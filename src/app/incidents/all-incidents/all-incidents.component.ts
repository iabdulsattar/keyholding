import { Component, OnInit } from '@angular/core';
import { getTimezoneOptions } from '../../core/utils/date.utils';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { KeyVaultService } from '../../core/services/keyvault.service';
import { ToastService } from '../../core/services/toast.service';
import { RichSelectComponent, RichSelectOption } from '../../shared/components/form/rich-select/rich-select.component';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { ProductSwitcherComponent } from '../../shared/components/ui/product-switcher/product-switcher.component';

export type IncidentStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
export type IncidentType = 'LOST' | 'BROKEN';

export interface IncidentRecord {
  id: string;
  code: string;
  type: IncidentType;
  keyName: string;
  keyCode: string;
  jobCode: string;
  client: string;
  site: string;
  reportedBy: string;
  date: string;
  time: string;
  status: IncidentStatus;
  description: string;
  raw: any;
}

@Component({
  selector: 'app-all-incidents',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, RichSelectComponent, ModalComponent, ProductSwitcherComponent],
  templateUrl: './all-incidents.component.html',
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  `]
})
export class AllIncidentsComponent implements OnInit {
  incidents: IncidentRecord[] = [];
  stats: any = {};
  loading = false;
  Math = Math;

  searchQuery = '';
  statusFilter = '';
  typeFilter = '';
  typeOptions: RichSelectOption[] = [
    { value: '', label: 'All Types' },
    { value: 'LOST', label: 'Lost Key' },
    { value: 'BROKEN', label: 'Broken Key' },
  ];
  statusOptions: RichSelectOption[] = [
    { value: '', label: 'Status' },
    { value: 'OPEN', label: 'Open' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'RESOLVED', label: 'Resolved' },
  ];
  reportTypeOptions: RichSelectOption[] = [
    { value: 'LOST', label: 'Lost Key' },
    { value: 'BROKEN', label: 'Broken Key' },
  ];

  pageSizeOptions = [10, 20, 50];
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;

  expandedIncidentId = '';
  deletingIncidentId = '';

  showReportModal = false;
  submitting = false;
  keyOptions: RichSelectOption[] = [];
  reportForm = {
    type: 'LOST' as IncidentType,
    keyId: '',
    description: '',
  };

  constructor(private keyVault: KeyVaultService, private toast: ToastService) {}

  ngOnInit(): void {
    this.loadIncidents();
    this.loadStats();
  }

  private getOrgId(): string | null {
    const remember = localStorage.getItem('remember_device');
    if (remember === 'true') {
      return localStorage.getItem('org_id') || localStorage.getItem('organizationId') || null;
    }
    return sessionStorage.getItem('org_id') || sessionStorage.getItem('organizationId')
      || localStorage.getItem('org_id') || localStorage.getItem('organizationId') || null;
  }

  loadIncidents(): void {
    const orgId = this.getOrgId();
    if (!orgId) return;
    this.loading = true;
    this.keyVault.listIncidents(orgId, {
      q: this.searchQuery || undefined,
      status: this.statusFilter || undefined,
      incidentType: this.typeFilter || undefined,
      page: this.currentPage - 1,
      size: this.pageSize,
    }).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res ?? {};
        const meta = res?.meta ?? data?.meta ?? {};
        const rawItems = Array.isArray(data) ? data : (data.items ?? data.content ?? data.data ?? []);
        const items: any[] = Array.isArray(rawItems) ? rawItems : [];
        this.incidents = items.map((item: any) => this.mapIncident(item));
        this.totalItems = meta.totalElements ?? data.totalElements ?? data.totalItems ?? data.total ?? this.incidents.length;
        this.totalPages = meta.totalPages ?? data.totalPages ?? Math.max(1, Math.ceil(this.totalItems / this.pageSize));
        this.loading = false;
      },
      error: () => {
        this.incidents = [];
        this.totalItems = 0;
        this.totalPages = 0;
        this.loading = false;
        this.toast.error('Could not load incidents');
      }
    });
  }

  loadStats(): void {
    const orgId = this.getOrgId();
    if (!orgId) return;
    this.keyVault.getIncidentStats(orgId).subscribe({
      next: (res: any) => {
        this.stats = res?.data ?? res ?? {};
      },
      error: () => {
        this.stats = {};
      }
    });
  }

  private loadKeyOptions(): void {
    const orgId = this.getOrgId();
    if (!orgId || this.keyOptions.length > 0) return;
    this.keyVault.listAllKeys(orgId, { page: 0, size: 200 }).subscribe((res: any) => {
      const data = res?.data ?? res ?? {};
      const rawItems = Array.isArray(data) ? data : (data.items ?? data.data ?? []);
      const items: any[] = Array.isArray(rawItems) ? rawItems : [];
      this.keyOptions = items.map((item: any) => ({
        value: item.id ?? '',
        label: item.keyCode ? `${item.keyCode} - ${item.name ?? ''}`.trim() : (item.name ?? ''),
        description: item.siteName ?? '',
      })).filter((o: RichSelectOption) => !!o.value);
    });
  }

  private mapIncident(item: any): IncidentRecord {
    const status = this.normalizeStatus(item.status);
    return {
      id: item.id ?? '',
      code: item.incidentCode ?? item.code ?? '',
      type: this.normalizeType(item.incidentType ?? item.type),
      keyName: item.keyName ?? item.key?.name ?? '',
      keyCode: item.keyCode ?? item.key?.keyCode ?? '',
      jobCode: item.jobCode ?? item.job?.jobCode ?? '',
      client: item.clientName ?? item.client?.name ?? '',
      site: item.siteName ?? item.site?.name ?? '',
      reportedBy: item.reportedByUserName ?? item.reportedBy ?? item.reportedByName ?? '',
      date: this.formatDate(item.reportedAt ?? item.incidentDate ?? item.createdAt),
      time: this.formatTime(item.reportedAt ?? item.incidentTime ?? item.reportedTime ?? item.createdAt),
      status,
      description: item.description ?? item.notes ?? '',
      raw: item,
    };
  }

  private normalizeStatus(value: any): IncidentStatus {
    const code = String(value ?? '').toUpperCase().replace(/[\s-]+/g, '_');
    if (code === 'IN_PROGRESS' || code === 'INPROGRESS' || code === 'STARTED') return 'IN_PROGRESS';
    if (code === 'RESOLVED' || code === 'COMPLETED' || code === 'CLOSED') return 'RESOLVED';
    return 'OPEN';
  }

  private normalizeType(value: any): IncidentType {
    const code = String(value ?? '').toUpperCase();
    return code.includes('BROKEN') || code.includes('DAMAG') ? 'BROKEN' : 'LOST';
  }

  private formatDate(value: any): string {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('en-GB', getTimezoneOptions({ day: 'numeric', month: 'short', year: 'numeric' }));
  }

  private formatTime(value: any): string {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('en-GB', getTimezoneOptions({ hour: 'numeric', minute: '2-digit' }));
  }

  typeLabel(type: IncidentType): string {
    return type === 'LOST' ? 'Lost Key' : 'Broken Key';
  }

  typeClass(type: IncidentType): string {
    return type === 'LOST' ? 'text-red-500' : 'text-amber-500';
  }

  typeIconPath(type: IncidentType): string {
    return type === 'LOST'
      ? '<path d="M12 9v4m0 4h.01M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>'
      : '<path d="M3 12h4l3-8 4 16 3-8h4"/>';
  }

  statusLabel(status: IncidentStatus): string {
    return status === 'OPEN' ? 'Open' : status === 'IN_PROGRESS' ? 'In Progress' : 'Resolved';
  }

  statusClass(status: IncidentStatus): string {
    const map: Record<IncidentStatus, string> = {
      OPEN: 'bg-red-50 text-red-600',
      IN_PROGRESS: 'bg-amber-50 text-amber-600',
      RESOLVED: 'bg-emerald-50 text-emerald-600',
    };
    return map[status] || 'bg-slate-100 text-slate-500';
  }

  get openCount(): number {
    return this.stats.open ?? this.stats.openIncidents ?? 0;
  }

  get inProgressCount(): number {
    return this.stats.inProgress ?? this.stats.in_progress ?? 0;
  }

  get resolvedCount(): number {
    return this.stats.resolved ?? this.stats.resolvedIncidents ?? 0;
  }

  get totalIncidents(): number {
    return this.stats.total ?? this.stats.totalIncidents ?? this.totalItems;
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadIncidents();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadIncidents();
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.loadIncidents();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadIncidents();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadIncidents();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadIncidents();
    }
  }

  get visiblePages(): (number | '...')[] {
    const pages: (number | '...')[] = [];
    const total = this.totalPages;
    const current = this.currentPage;
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push('...');
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (current < total - 2) pages.push('...');
      pages.push(total);
    }
    return pages;
  }

  get showingStart(): number {
    return this.totalItems === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get showingEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  toggleDetails(incident: IncidentRecord): void {
    this.expandedIncidentId = this.expandedIncidentId === incident.id ? '' : incident.id;
  }

  changeStatus(incident: IncidentRecord, status: IncidentStatus): void {
    const orgId = this.getOrgId();
    if (!orgId || !incident.id || incident.status === status) return;
    const previous = incident.status;
    incident.status = status;
    this.keyVault.updateIncidentStatus(orgId, incident.id, { status }).subscribe({
      next: () => {
        this.toast.success(`${incident.code || 'Incident'} marked as ${this.statusLabel(status).toLowerCase()}`);
        this.loadIncidents();
        this.loadStats();
      },
      error: () => {
        incident.status = previous;
        this.toast.error('Could not update the incident status');
      }
    });
  }

  deleteIncident(incident: IncidentRecord): void {
    const orgId = this.getOrgId();
    if (!orgId || !incident.id || this.deletingIncidentId === incident.id) return;
    if (!confirm(`Delete incident ${incident.code || ''}? This cannot be undone.`)) return;
    this.deletingIncidentId = incident.id;
    this.keyVault.deleteIncident(orgId, incident.id).subscribe({
      next: () => {
        this.deletingIncidentId = '';
        if (this.incidents.length === 1 && this.currentPage > 1) {
          this.currentPage--;
        }
        this.toast.success('Incident deleted');
        this.loadIncidents();
        this.loadStats();
      },
      error: () => {
        this.deletingIncidentId = '';
        this.toast.error('Could not delete the incident');
      }
    });
  }

  openReportModal(): void {
    this.reportForm = { type: 'LOST', keyId: '', description: '' };
    this.showReportModal = true;
    this.loadKeyOptions();
  }

  closeReportModal(): void {
    if (this.submitting) return;
    this.showReportModal = false;
  }

  onReportTypeChange(value: string): void {
    this.reportForm.type = value === 'BROKEN' ? 'BROKEN' : 'LOST';
  }

  submitReport(): void {
    const orgId = this.getOrgId();
    if (!orgId) return;
    if (!this.reportForm.keyId) {
      this.toast.warning('Select the key this incident relates to');
      return;
    }
    this.submitting = true;
    this.keyVault.createIncident(orgId, {
      incidentType: this.reportForm.type,
      keyId: this.reportForm.keyId,
      description: this.reportForm.description || undefined,
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.showReportModal = false;
        this.currentPage = 1;
        this.toast.success('Incident reported');
        this.loadIncidents();
        this.loadStats();
      },
      error: () => {
        this.submitting = false;
        this.toast.error('Could not report the incident');
      }
    });
  }
}