import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EdobService } from '../core/services/edob.service';
import { AuthService } from '../core/services/auth.service';
import { Entry, ListEntriesRequest, ListEntriesResponse, EntryType, OrgUser, Category, EntryStatus, EntryPriority } from '../core/models/edob.models';

@Component({
  selector: 'app-dob-feed',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dob-feed.component.html',
})
export class DobFeedComponent implements OnInit {
  entries: any[] = [];
  total = 0;
  page = 0;
  size = 20;
  loading = false;
  selectedEntry: any = null;
  rawEntries: Entry[] = [];
  isDetailPanelOpen = false;

  search = '';
  typeFilter = '';
  statusFilter: EntryStatus | '' = '';
  priorityFilter: EntryPriority | '' = '';
  createdByFilter = '';
  assignedToFilter = '';
  fromDate = '';
  toDate = '';
  errorMessage = '';

  entryTypes: EntryType[] = [];
  orgUsers: OrgUser[] = [];
  categories: Category[] = [];
  statuses = [
    { code: 'NEW', label: 'New' },
    { code: 'IN_PROGRESS', label: 'In Progress' },
    { code: 'COMPLETED', label: 'Completed' },
    { code: 'ASSIGNED', label: 'Assigned' },
    { code: 'CANCELLED', label: 'Cancelled' },
  ];
  priorities = [
    { code: 'LOW', label: 'Low' },
    { code: 'NORMAL', label: 'Normal' },
    { code: 'MEDIUM', label: 'Medium' },
    { code: 'HIGH', label: 'High' },
    { code: 'CRITICAL', label: 'Critical' },
  ];

  readonly tabs = [
    { label: 'All Entries', code: '' },
    { label: 'Basic Entries', code: 'BASIC' },
    { label: 'Incidents', code: 'INCIDENT' },
    { label: 'Handovers', code: 'HANDOVER' },
    { label: 'Follow-Ups', code: 'FOLLOW_UP' },
  ];

  readonly stats = [
    { label: 'Total Entries', value: '1,248', note: 'All time', tone: 'bg-gray-100 text-gray-900', icon: this.icon('M7 3h10v18H7V3Zm3 5h4M10 12h4M10 16h3') },
    { label: 'Open Incidents', value: '23', note: 'Requires attention', tone: 'bg-error-50 text-error-500', icon: this.icon('M12 4 3.5 19h17L12 4Zm0 5v4M12 16.5h.01') },
    { label: 'Active Follow-Ups', value: '14', note: 'In progress', tone: 'bg-warning-50 text-warning-600', icon: this.icon('M19 12a7 7 0 1 1-2-4.9M19 5v5h-5') },
    { label: 'Pending Handovers', value: '8', note: 'Awaiting review', tone: 'bg-purple-50 text-purple-600', icon: this.icon('M16 11a4 4 0 1 0-8 0M4 21a8 8 0 0 1 16 0M17 8h4M19 6v4') },
    { label: 'Completed (This Month)', value: '156', note: 'View all completed', tone: 'bg-success-50 text-success-600', icon: this.icon('M20 6 9 17l-5-5') },
  ];

  constructor(private edobService: EdobService, private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.ensureOrgId().then((orgId) => {
      if (!orgId) {
        this.errorMessage = 'Organization not found. Please sign in again.';
        return;
      }
      this.loadFilterOptions();
      this.loadEntries();
    });
  }

  private async ensureOrgId(): Promise<string | null> {
    let orgId = this.getOrgId();
    if (orgId) return orgId;

    const token = this.authService.getAccessToken();
    if (!token) return null;

    try {
      const profile = await this.authService.me(token).toPromise();
      const orgs = profile?.organizations || [];
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

  loadFilterOptions(): void {
    const orgId = this.getOrgId();
    if (!orgId) return;

    this.edobService.listEntryTypes(orgId).subscribe((types: EntryType[]) => {
      this.entryTypes = types;
      this.refreshEntryDisplay();
    });
    this.edobService.listOrgUsers(orgId).subscribe((users: OrgUser[]) => {
      this.orgUsers = users;
      this.refreshEntryDisplay();
    });
    this.edobService.listCategories(orgId).subscribe((cats: Category[]) => this.categories = cats);
  }

  loadEntries(): void {
    const orgId = this.getOrgId();
    if (!orgId) return;

    this.loading = true;
    const activeTab = this.tabs.find(t => t.code === this.typeFilter) || this.tabs[0];

    const filters: ListEntriesRequest = {
      page: this.page,
      size: this.size,
      search: this.search || undefined,
      typeId: this.typeFilter || undefined,
      status: this.statusFilter || undefined,
      priority: this.priorityFilter || undefined,
      createdBy: this.createdByFilter || undefined,
      assignedTo: this.assignedToFilter || undefined,
      from: this.fromDate || undefined,
      to: this.toDate || undefined,
    };

    this.edobService.listEntries(orgId, filters).subscribe({
      next: (res: ListEntriesResponse) => {
        this.rawEntries = res.entries;
        this.refreshEntryDisplay();
        this.total = res.total;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  private refreshEntryDisplay(): void {
    this.entries = this.mapEntries(this.rawEntries);
  }

  onSearch(): void {
    this.page = 0;
    this.loadEntries();
  }

  onFilterChange(): void {
    this.page = 0;
    this.loadEntries();
  }

  onClearFilters(): void {
    this.search = '';
    this.typeFilter = '';
    this.statusFilter = '';
    this.priorityFilter = '';
    this.createdByFilter = '';
    this.assignedToFilter = '';
    this.fromDate = '';
    this.toDate = '';
    this.page = 0;
    this.loadEntries();
  }

  onPageChange(p: number): void {
    this.page = p;
    this.loadEntries();
  }

  private mapEntries(raw: Entry[]): any[] {
    const typeMap = new Map(this.entryTypes.map(t => [t.code, t.name]));
    const typeMapById = new Map(this.entryTypes.map(t => [t.id, t.name]));
    const userMap = new Map(this.orgUsers.map(u => [u.id, `${u.firstName} ${u.lastName}`.trim()]));

    return raw.map(entry => {
      const typeName = typeMap.get(entry.entryTypeCode) || typeMapById.get(entry.entryTypeId || '') || entry.entryTypeCode;
      const createdByName = userMap.get(entry.createdByUserId) || entry.createdByUserId;
      const assignedToName = entry.assignedToUserId ? (userMap.get(entry.assignedToUserId) || entry.assignedToUserId) : '-';

      return {
        ...entry,
        entryNumber: entry.entryNumber || entry.id,
        type: typeName,
        typeCode: entry.entryTypeCode,
        title: entry.title,
        status: this.formatStatus(entry.status),
        statusCode: entry.status,
        priority: this.formatPriority(entry.priority),
        priorityCode: entry.priority,
        createdBy: createdByName,
        assignedTo: assignedToName,
        date: this.formatDate(entry.createdAt),
        linked: entry.attachments && entry.attachments.length > 0 ? `${entry.attachments.length} Linked` : '-',
        comments: '-',
        typeClass: this.getTypeClass(entry.entryTypeCode),
        statusClass: this.getStatusClass(entry.status),
        priorityClass: this.getPriorityClass(entry.priority),
      };
    });
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

  private getTypeClass(code: string): string {
    const map: Record<string, string> = {
      'BASIC': 'bg-gray-100 text-gray-700',
      'INCIDENT': 'bg-error-50 text-error-600',
      'HANDOVER': 'bg-purple-50 text-purple-600',
      'FOLLOW_UP': 'bg-warning-50 text-warning-700',
    };
    return map[code] || 'bg-gray-100 text-gray-700';
  }

  private getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'NEW': 'bg-gray-100 text-gray-700',
      'IN_PROGRESS': 'bg-warning-50 text-warning-700',
      'COMPLETED': 'bg-success-50 text-success-700',
      'ASSIGNED': 'bg-brand-50 text-brand-600',
      'CANCELLED': 'bg-error-50 text-error-600',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  }

  private getPriorityClass(priority: string): string {
    const map: Record<string, string> = {
      'LOW': 'bg-success-50 text-success-700',
      'NORMAL': 'bg-gray-100 text-gray-700',
      'MEDIUM': 'bg-warning-50 text-warning-700',
      'HIGH': 'bg-error-50 text-error-600',
      'CRITICAL': 'bg-error-50 text-error-600',
    };
    return map[priority] || 'bg-gray-100 text-gray-700';
  }

  private getOrgId(): string | null {
    const remember = localStorage.getItem('remember_device');
    if (remember === 'true') {
      return localStorage.getItem('org_id') || localStorage.getItem('organizationId') || null;
    }
    return sessionStorage.getItem('org_id') || sessionStorage.getItem('organizationId') || localStorage.getItem('org_id') || localStorage.getItem('organizationId') || null;
  }

  getVisiblePages(): (number | '...')[] {
    const totalPages = Math.max(1, Math.ceil(this.total / this.size));
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 0; i < totalPages; i++) pages.push(i);
      return pages;
    }
    pages.push(0);
    if (this.page > 2) pages.push('...');
    const start = Math.max(1, this.page - 1);
    const end = Math.min(totalPages - 2, this.page + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (this.page < totalPages - 3) pages.push('...');
    pages.push(totalPages - 1);
    return pages;
  }

  getShowingText(): string {
    if (this.total === 0) return 'Showing 0-0 of 0 entries';
    const start = this.page * this.size + 1;
    const end = Math.min((this.page + 1) * this.size, this.total);
    return `Showing ${start}-${end} of ${this.total} entries`;
  }

  selectEntry(entry: any): void {
    this.selectedEntry = entry;
    this.isDetailPanelOpen = true;
  }

  editEntry(entry: any): void {
    if (!entry?.id) return;
    this.router.navigate(['/create-entry'], { queryParams: { id: entry.id } });
  }

  closeDetailPanel(): void {
    this.isDetailPanelOpen = false;
    this.selectedEntry = null;
  }

  private icon(path: string): string {
    return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="${path}" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
}
