import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EdobService } from '../core/services/edob.service';
import { AuthService } from '../core/services/auth.service';
import { Entry, ListEntriesRequest, ListEntriesResponse, EntryType, OrgUser, Category, EntryStatus, EntryPriority } from '../core/models/edob.models';

import { EntriesTypesComponent } from '../shared/components/entries/entries-types/entries-types.component';
import { EntriesMetricsComponent, EntryMetric } from '../shared/components/entries/entries-metrics/entries-metrics.component';
import { EntriesTableComponent, TableEntry } from '../shared/components/entries/entries-table/entries-table.component';
import { EntriesFollowupComponent } from '../shared/components/entries/entries-followup/entries-followup.component';
import { EntryCreateComponent } from '../shared/components/entries/entry-create/entry-create.component';

export interface EntriesFilter {
  search: string;
  typeId: string;
  status: EntryStatus | '';
  priority: EntryPriority | '';
  createdBy: string;
  assignedTo: string;
  from: string;
  to: string;
}

@Component({
  selector: 'app-entries',
  standalone: true,
  imports: [
    CommonModule,
    EntriesTypesComponent,
    EntriesMetricsComponent,
    EntriesTableComponent,
    EntriesFollowupComponent,
    EntryCreateComponent,
  ],
  templateUrl: './entries.component.html',
})
export class EntriesComponent implements OnInit {
  entries: TableEntry[] = [];
  total = 0;
  page = 0;
  size = 10;
  loading = false;
  errorMessage = '';

  selectedEntry: TableEntry | null = null;
  showSidebar = false;

  entryTypes: EntryType[] = [];
  orgUsers: OrgUser[] = [];
  categories: Category[] = [];
  statuses: { code: EntryStatus; label: string }[] = [
    { code: 'NEW', label: 'New' },
    { code: 'IN_PROGRESS', label: 'In Progress' },
    { code: 'COMPLETED', label: 'Completed' },
    { code: 'ASSIGNED', label: 'Assigned' },
    { code: 'CANCELLED', label: 'Cancelled' },
  ];
  priorities: { code: EntryPriority; label: string }[] = [
    { code: 'LOW', label: 'Low' },
    { code: 'NORMAL', label: 'Normal' },
    { code: 'MEDIUM', label: 'Medium' },
    { code: 'HIGH', label: 'High' },
    { code: 'CRITICAL', label: 'Critical' },
  ];

  filters: EntriesFilter = {
    search: '',
    typeId: '',
    status: '',
    priority: '',
    createdBy: '',
    assignedTo: '',
    from: '',
    to: '',
  };

  metrics: EntryMetric[] = [];

  constructor(
    private edobService: EdobService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.ensureOrgId().then((orgId) => {
      if (!orgId) {
        this.errorMessage = 'Organization not found. Please sign in again.';
        return;
      }
      this.loadFilterOptions();
      this.loadEntries();
      this.loadMetrics();
    });
  }

  private async ensureOrgId(): Promise<string | null> {
    let orgId = this.getOrgId();
    if (orgId) return orgId;

    const token = this.authService.getAccessToken();
    if (!token) return null;

    try {
      const profile = await this.authService.me(token).toPromise();
      const orgs = (profile as any)?.organizations || [];
      if (orgs[0]?.id) {
        const remember = localStorage.getItem('remember_device');
        const storage = remember === 'true' ? localStorage : sessionStorage;
        storage.setItem('org_id', orgs[0].id);
        return orgs[0].id;
      }
    } catch {
      // ignore
    }

    return null;
  }

  private getOrgId(): string | null {
    const remember = localStorage.getItem('remember_device');
    if (remember === 'true') {
      return localStorage.getItem('org_id') || localStorage.getItem('organizationId') || null;
    }
    return sessionStorage.getItem('org_id') || sessionStorage.getItem('organizationId') || localStorage.getItem('org_id') || localStorage.getItem('organizationId') || null;
  }

  loadFilterOptions(): void {
    const orgId = this.getOrgId();
    if (!orgId) return;

    this.edobService.listEntryTypes(orgId).subscribe({
      next: (types) => { this.entryTypes = types; this.refreshEntriesDisplay(); },
      error: () => {},
    });
    this.edobService.listOrgUsers(orgId).subscribe({
      next: (users) => { this.orgUsers = users; this.refreshEntriesDisplay(); },
      error: () => {},
    });
    this.edobService.listCategories(orgId).subscribe({
      next: (cats) => { this.categories = cats; },
      error: () => {},
    });
  }

  buildRequest(): ListEntriesRequest {
    return {
      page: this.page,
      size: this.size,
      search: this.filters.search || undefined,
      typeId: this.filters.typeId || undefined,
      status: this.filters.status || undefined,
      priority: this.filters.priority || undefined,
      createdBy: this.filters.createdBy || undefined,
      assignedTo: this.filters.assignedTo || undefined,
      from: this.filters.from || undefined,
      to: this.filters.to || undefined,
    };
  }

  loadEntries(): void {
    const orgId = this.getOrgId();
    if (!orgId) return;

    this.loading = true;
    this.errorMessage = '';

    this.edobService.listEntries(orgId, this.buildRequest()).subscribe({
      next: (res: ListEntriesResponse) => {
        this.rawEntries = res.entries || [];
        this.total = res.total ?? this.rawEntries.length;
        this.refreshEntriesDisplay();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Failed to load entries. Please try again.';
      },
    });
  }

  private rawEntries: Entry[] = [];

  private refreshEntriesDisplay(): void {
    this.entries = this.mapEntries(this.rawEntries);
  }

  private mapEntries(raw: Entry[]): TableEntry[] {
    const typeMap = new Map(this.entryTypes.map((t) => [t.code, t.name]));
    const typeMapById = new Map(this.entryTypes.map((t) => [t.id, t.name]));
    const userMap = new Map(this.orgUsers.map((u) => [u.id, `${u.firstName} ${u.lastName}`.trim() || u.email]));
    const userImgMap = new Map(this.orgUsers.map((u: any) => [u.id, u['avatar'] || u['avatarUrl'] || u['profileImageUrl'] || '/images/user/dummy-user.png']));

    return raw.map((entry) => {
      const typeName = typeMap.get(entry.entryTypeCode) || typeMapById.get(entry.entryTypeId || '') || entry.entryTypeCode;
      const createdByName = userMap.get(entry.createdByUserId) || entry.createdByUserId;
      const assignedToName = entry.assignedToUserId ? (userMap.get(entry.assignedToUserId) || entry.assignedToUserId) : '-';
      const userName = createdByName;
      const userImg = userImgMap.get(entry.createdByUserId) || '/images/user/dummy-user.png';

      return {
        id: entry.entryNumber || entry.id,
        entryId: entry.id,
        type: typeName,
        typeCode: entry.entryTypeCode,
        title: entry.title,
        date: this.formatDate(entry.createdAt),
        status: this.formatStatus(entry.status),
        statusCode: entry.status,
        priority: this.formatPriority(entry.priority),
        priorityCode: entry.priority,
        userName,
        userInitials: this.initials(userName),
        userImg,
        assignedTo: assignedToName,
        raw: entry,
      };
    });
  }

  loadMetrics(): void {
    const orgId = this.getOrgId();
    if (!orgId) return;

    this.edobService.listEntries(orgId, { size: 1000 }).subscribe({
      next: (res: ListEntriesResponse) => {
        const all = res.entries || [];
        const total = res.total ?? all.length;
        const openIncidents = all.filter((e) => e.entryTypeCode === 'INCIDENT' && e.status !== 'COMPLETED' && e.status !== 'CANCELLED').length;
        const activeFollowUps = all.filter((e) => e.entryTypeCode === 'FOLLOW_UP' && e.status !== 'COMPLETED' && e.status !== 'CANCELLED').length;
        const pendingHandovers = all.filter((e) => e.entryTypeCode === 'HANDOVER' && e.status !== 'COMPLETED' && e.status !== 'CANCELLED').length;
        const completedThisMonth = all.filter((e) => {
          if (e.status !== 'COMPLETED') return false;
          const d = new Date(e.updatedAt || e.createdAt);
          const now = new Date();
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length;

        this.metrics = [
          { label: 'Total Entries', value: this.formatNumber(total), note: 'All time', tone: 'bg-gray-100 text-gray-900', icon: '<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>' },
          { label: 'Open Incidents', value: this.formatNumber(openIncidents), note: 'Requires attention', tone: 'bg-error-50 text-error-500', icon: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>' },
          { label: 'Active Follow-Ups', value: this.formatNumber(activeFollowUps), note: 'In progress', tone: 'bg-warning-50 text-warning-600', icon: '<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>' },
          { label: 'Pending Handovers', value: this.formatNumber(pendingHandovers), note: 'Awaiting review', tone: 'bg-purple-50 text-purple-600', icon: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/>' },
          { label: 'Completed (This Month)', value: this.formatNumber(completedThisMonth), note: 'View all completed', tone: 'bg-success-50 text-success-600', icon: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>' },
        ];
      },
      error: () => {
        this.metrics = [
          { label: 'Total Entries', value: '0', note: 'All time', tone: 'bg-gray-100 text-gray-900', icon: '<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>' },
          { label: 'Open Incidents', value: '0', note: 'Requires attention', tone: 'bg-error-50 text-error-500', icon: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>' },
          { label: 'Active Follow-Ups', value: '0', note: 'In progress', tone: 'bg-warning-50 text-warning-600', icon: '<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>' },
          { label: 'Pending Handovers', value: '0', note: 'Awaiting review', tone: 'bg-purple-50 text-purple-600', icon: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/>' },
          { label: 'Completed (This Month)', value: '0', note: 'View all completed', tone: 'bg-success-50 text-success-600', icon: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>' },
        ];
      },
    });
  }

  onFilterChange(filters: EntriesFilter): void {
    this.filters = filters;
    this.page = 0;
    this.loadEntries();
  }

  onSearch(term: string): void {
    this.filters = { ...this.filters, search: term };
    this.page = 0;
    this.loadEntries();
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadEntries();
  }

  onIdClick(row: TableEntry): void {
    if (this.selectedEntry?.entryId === row.entryId) {
      this.showSidebar = !this.showSidebar;
    } else {
      this.selectedEntry = row;
      this.showSidebar = true;
    }
  }

  editEntry(): void {
    if (!this.selectedEntry?.entryId) return;
    this.router.navigate(['/entries', this.selectedEntry.entryId]);
  }

  closeSidebar(): void {
    this.showSidebar = false;
  }

  createEntry(): void {
    this.router.navigate(['/create-entry']);
  }

  getShowingText(): string {
    if (this.total === 0) return 'Showing 0-0 of 0 entries';
    const start = this.page * this.size + 1;
    const end = Math.min((this.page + 1) * this.size, this.total);
    return `Showing ${start}-${end} of ${this.total} entries`;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.size));
  }

  private formatStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  private formatPriority(priority: string): string {
    return priority.charAt(0) + priority.slice(1).toLowerCase();
  }

  private formatDate(iso: string): string {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  private initials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  }

  private formatNumber(n: number): string {
    return n.toLocaleString('en-US');
  }
}
