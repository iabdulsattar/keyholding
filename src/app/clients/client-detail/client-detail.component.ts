import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientService, Client, KeyRecord, SiteRecord } from '../../core/services/client.service';
import { DeactivateClientModalComponent } from '../deactivate-client-modal/deactivate-client-modal.component';
import { ActivateClientModalComponent } from '../activate-client-modal/activate-client-modal.component';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DeactivateClientModalComponent, ActivateClientModalComponent],
  templateUrl: './client-detail.component.html',
  styles: `
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
    .tab-content-panel { display: none; }
    .tab-content-panel.active { display: block; }
    .nav-item { display:flex; align-items:center; gap:.75rem; padding:.6rem .75rem; border-radius:.6rem; font-size:.875rem; color:#cbd5e1; transition: background .15s, color .15s; }
    .nav-item:hover { background: rgba(255,255,255,0.06); color:#fff; }
    .nav-item-active { background: #4338ca; color:#fff; }
    .nav-icon { width:1.15rem; height:1.15rem; flex-shrink:0; }
    .btn-outline { display:inline-flex; align-items:center; gap:.4rem; padding:.5rem .9rem; border-radius:.6rem; border:1px solid #e2e8f0; font-size:.8rem; font-weight:500; color:#334155; background:#fff; white-space:nowrap; transition: background .15s; }
    .btn-outline:hover { background:#f8fafc; }
    .btn-primary { display:inline-flex; align-items:center; gap:.4rem; padding:.55rem 1rem; border-radius:.6rem; background:#4338ca; color:#fff; font-size:.8rem; font-weight:600; white-space:nowrap; transition: background .15s; }
    .btn-primary:hover { background:#372da3; }
    .badge { display:inline-flex; align-items:center; padding:.15rem .55rem; border-radius:9999px; font-size:.7rem; font-weight:600; }
    .tab { padding:.85rem .25rem; border-bottom:2px solid transparent; color:#94a3b8; white-space:nowrap; }
    .tab:hover { color:#475569; }
    .tab-active { color:#4338ca; border-color:#4338ca; font-weight:600; }
    .stat-card { background:#fff; border:1px solid #e2e8f0; border-radius:1rem; padding:1rem 1.1rem; display:flex; align-items:center; gap:.85rem; box-shadow: 0 1px 2px rgba(0,0,0,0.02); }
    .stat-icon { width:2.75rem; height:2.75rem; border-radius:.75rem; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .th { padding: .85rem 1.25rem; text-align:left; font-weight:600; }
    .td { padding: .85rem 1.25rem; vertical-align:middle; }
    .page-btn { width:2rem; height:2rem; border-radius:.5rem; border:1px solid #e2e8f0; display:flex; align-items:center; justify-content:center; font-weight:600; color:#334155; }
    .no-scrollbar::-webkit-scrollbar { display:none; }
    .no-scrollbar { -ms-overflow-style:none; scrollbar-width:none; }
    .avatar { display:inline-flex; align-items:center; justify-content:center; width:2rem; height:2rem; border-radius:9999px; font-size:.75rem; font-weight:700; }
  `
})
export class ClientDetailComponent implements OnInit {
  isClientActive = true;
  activeTab = 'overview';
  clientId = '';
  client: Client | null = null;
  keys: KeyRecord[] = [];
  filteredKeys: KeyRecord[] = [];
  keysPage = 1;
  keysRowsPerPage = 8;
  keysSearch = '';
  keysStatus = 'All';
  keysType = 'All';
  sites: SiteRecord[] = [];
  filteredSites: SiteRecord[] = [];
  sitesPage = 1;
  sitesRowsPerPage = 8;
  sitesSearch = '';
  sitesStatus = 'All';
  sitesType = 'All';
  loading = false;
  clientStats: any = null;
  siteStats: any = null;
  showDeactivateClientModal = false;
  showActivateClientModal = false;

  siteDonutSegments: { color: string; offset: number; length: number }[] = [];

  constructor(private route: ActivatedRoute, private router: Router, private clientService: ClientService) {}

  ngOnInit(): void {
    this.clientId = this.route.snapshot.paramMap.get('id') || '';
    this.loadClient();
    this.loadKeys();
    this.loadSites();
    this.loadClientStats();
    this.loadSiteStats();
  }

  private loadClientStats(): void {
    this.clientService.getClientStats().subscribe((stats: any) => {
      this.clientStats = stats?.data ?? stats ?? null;
    });
  }

  private loadSiteStats(): void {
    if (!this.clientId) return;
    this.clientService.getSiteStats(this.clientId).subscribe((stats: any) => {
      this.siteStats = stats?.data ?? stats ?? null;
      const total = this.siteStats?.total ?? this.sites.length ?? 0;
      const active = this.siteStats?.active ?? 0;
      const inactive = this.siteStats?.inactive ?? 0;
      const maintenance = 0;
      const planned = 0;

      const activePct = total > 0 ? (active / total) * 100 : 0;
      const inactivePct = total > 0 ? (inactive / total) * 100 : 0;
      const maintenancePct = total > 0 ? (maintenance / total) * 100 : 0;
      const plannedPct = total > 0 ? (planned / total) * 100 : 0;

      const circumference = 2 * Math.PI * 50; // 314.16
      const segments = [
        { color: '#10b981', pct: activePct },
        { color: '#ef4444', pct: inactivePct },
        { color: '#f59e0b', pct: maintenancePct },
        { color: '#a855f7', pct: plannedPct },
      ];

      let cumulativeOffset = 0;
      this.siteDonutSegments = segments.map(seg => {
        const length = (seg.pct / 100) * circumference;
        const offset = -cumulativeOffset;
        cumulativeOffset += length;
        return { color: seg.color, offset, length };
      }).filter(seg => seg.length > 0);
    });
  }

  private loadClient(): void {
    this.loading = true;
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
    if (!orgId || !this.clientId) {
      this.client = null;
      this.loading = false;
      return;
    }
    this.clientService.getClientById(orgId, this.clientId).subscribe((data: Client | undefined) => {
      this.client = data || null;
      if (this.client) {
        this.isClientActive = this.client.status === 'Active';
      }
      this.loading = false;
    });
  }

  private loadKeys(): void {
    this.clientService.getKeysByClient(this.clientId).subscribe((data: KeyRecord[]) => {
      this.keys = data;
      this.filteredKeys = [...this.keys];
    });
  }

  private loadSites(): void {
    this.clientService.getSitesByClient(this.clientId).subscribe((data: SiteRecord[]) => {
      this.sites = data;
      this.filteredSites = [...this.sites];
    });
  }

  get sitesPaginated(): SiteRecord[] {
    const start = (this.sitesPage - 1) * this.sitesRowsPerPage;
    return this.filteredSites.slice(start, start + this.sitesRowsPerPage);
  }

  get sitesTotalPages(): number {
    return Math.ceil(this.filteredSites.length / this.sitesRowsPerPage);
  }

  get sitesShowingStart(): number {
    return this.filteredSites.length === 0 ? 0 : (this.sitesPage - 1) * this.sitesRowsPerPage + 1;
  }

  get sitesShowingEnd(): number {
    return Math.min(this.sitesPage * this.sitesRowsPerPage, this.filteredSites.length);
  }

  get totalKeys(): number {
    return this.keys.length;
  }

  get keysPaginated(): KeyRecord[] {
    const start = (this.keysPage - 1) * this.keysRowsPerPage;
    return this.filteredKeys.slice(start, start + this.keysRowsPerPage);
  }

  get keysTotalPages(): number {
    return Math.ceil(this.filteredKeys.length / this.keysRowsPerPage);
  }

  get keysShowingStart(): number {
    return this.filteredKeys.length === 0 ? 0 : (this.keysPage - 1) * this.keysRowsPerPage + 1;
  }

  get keysShowingEnd(): number {
    return Math.min(this.keysPage * this.keysRowsPerPage, this.filteredKeys.length);
  }

  get keyStatuses(): string[] {
    const statuses = Array.from(new Set(this.keys.map(k => k.status)));
    return ['All', ...statuses.sort()];
  }

  get keyTypes(): string[] {
    const types = Array.from(new Set(this.keys.map(k => k.type)));
    return ['All', ...types.sort()];
  }

  onKeysSearch(): void {
    this.keysPage = 1;
    this.applyKeysFilter();
  }

  onKeysStatusChange(): void {
    this.keysPage = 1;
    this.applyKeysFilter();
  }

  onKeysTypeChange(): void {
    this.keysPage = 1;
    this.applyKeysFilter();
  }

  private applyKeysFilter(): void {
    const q = this.keysSearch.toLowerCase().trim();
    this.filteredKeys = this.keys.filter(item => {
      const matchesSearch = item.keyCode.toLowerCase().includes(q) ||
                            item.name.toLowerCase().includes(q) ||
                            item.siteName.toLowerCase().includes(q) ||
                            item.assignedTo.toLowerCase().includes(q) ||
                            item.storageLocation.toLowerCase().includes(q);
      const matchesStatus = this.keysStatus === 'All' || item.status === this.keysStatus;
      const matchesType = this.keysType === 'All' || item.type === this.keysType;
      return matchesSearch && matchesStatus && matchesType;
    });
  }

  keysPreviousPage(): void {
    if (this.keysPage > 1) {
      this.keysPage--;
    }
  }

  keysNextPage(): void {
    if (this.keysPage < this.keysTotalPages) {
      this.keysPage++;
    }
  }

  keysGoToPage(page: number): void {
    if (page >= 1 && page <= this.keysTotalPages) {
      this.keysPage = page;
    }
  }

  onKeysRowsPerPageChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.keysRowsPerPage = parseInt(select.value);
    this.keysPage = 1;
  }

  get totalJobs(): number {
    return this.sites.reduce((sum, site) => sum + (site.jobs || 0), 0);
  }

  get keyStatusStats(): { status: string; count: number; color: string; pct: number }[] {
    const total = this.filteredKeys.length || 1;
    const counts = new Map<string, { count: number; color: string }>();
    this.filteredKeys.forEach(k => {
      const color = this.statusColorFor(k.status, k.statusColor);
      const existing = counts.get(k.status) || { count: 0, color };
      counts.set(k.status, { count: existing.count + 1, color });
    });

    const ordered = ['In Storage', 'Issued', 'In Use', 'Overdue', 'Lost / Damaged'];
    const colorMap: Record<string, string> = {
      'In Storage': 'bg-emerald-500',
      'Issued': 'bg-amber-500',
      'In Use': 'bg-blue-500',
      'Overdue': 'bg-rose-500',
      'Lost': 'bg-slate-400',
      'Lost / Damaged': 'bg-slate-400',
      'Damaged': 'bg-slate-400',
      'Damaged / Lost': 'bg-slate-400',
    };

    return ordered.map(status => {
      const data = counts.get(status) || { count: 0, color: colorMap[status] || 'bg-slate-400' };
      return {
        status,
        count: data.count,
        color: data.color,
        pct: Math.round((data.count / total) * 100)
      };
    });
  }

  get keyDonutSegments(): { color: string; offset: number; length: number }[] {
    const circumference = 2 * Math.PI * 50;
    const stats = this.keyStatusStats;
    const segments = stats.map(s => ({
      color: s.color === 'bg-emerald-500' ? '#10b981' :
             s.color === 'bg-amber-500' ? '#f59e0b' :
             s.color === 'bg-blue-500' ? '#3b82f6' :
             s.color === 'bg-rose-500' ? '#ef4444' : '#94a3b8',
      count: s.count,
      pct: s.pct
    }));

    let cumulativeOffset = 0;
    const all = segments.map(seg => {
      const length = (seg.pct / 100) * circumference;
      const offset = -cumulativeOffset;
      cumulativeOffset += length;
      return { color: seg.color, offset, length, count: seg.count };
    });

    return all.filter(seg => seg.length > 0 && seg.count > 0);
  }

  get keyTypeStats(): { type: string; count: number; color: string; pct: number }[] {
    const total = this.filteredKeys.length || 1;
    const counts = new Map<string, { count: number; color: string }>();
    this.filteredKeys.forEach(k => {
      const color = k.typeColor || 'bg-slate-400';
      const existing = counts.get(k.type) || { count: 0, color };
      counts.set(k.type, { count: existing.count + 1, color });
    });
    return Array.from(counts.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      color: data.color,
      pct: Math.round((data.count / total) * 100)
    }));
  }

  private statusColorFor(status: string, fallback?: string): string {
    if (fallback) return fallback;
    const map: Record<string, string> = {
      'In Storage': 'bg-emerald-500',
      'In Use': 'bg-blue-500',
      'Issued': 'bg-amber-500',
      'Overdue': 'bg-purple-500',
      'Lost': 'bg-rose-500',
      'Lost / Damaged': 'bg-rose-500',
    };
    return map[status] || 'bg-slate-400';
  }

  hexForType(type: string): string {
    const map: Record<string, string> = {
      Office: '#3b82f6',
      Warehouse: '#a855f7',
      Retail: '#f59e0b',
      'Distribution Centre': '#fb923c',
      'Data Centre': '#06b6d4',
      Storage: '#94a3b8',
      'Construction Site': '#f97316',
      'Remote Office': '#14b8a6',
      Other: '#64748b',
    };
    return map[type] || '#94a3b8';
  }

  onSitesSearch(): void {
    this.sitesPage = 1;
    this.applySitesFilter();
  }

  onSitesStatusChange(): void {
    this.sitesPage = 1;
    this.applySitesFilter();
  }

  onSitesTypeChange(): void {
    this.sitesPage = 1;
    this.applySitesFilter();
  }

  private applySitesFilter(): void {
    const q = this.sitesSearch.toLowerCase().trim();
    this.filteredSites = this.sites.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(q) ||
                            item.code.toLowerCase().includes(q) ||
                            item.address.toLowerCase().includes(q) ||
                            item.contact.toLowerCase().includes(q);
      const matchesStatus = this.sitesStatus === 'All' || item.status === this.sitesStatus;
      const matchesType = this.sitesType === 'All' || item.type === this.sitesType;
      return matchesSearch && matchesStatus && matchesType;
    });
  }

  sitesPreviousPage(): void {
    if (this.sitesPage > 1) {
      this.sitesPage--;
    }
  }

  sitesNextPage(): void {
    if (this.sitesPage < this.sitesTotalPages) {
      this.sitesPage++;
    }
  }

  sitesGoToPage(page: number): void {
    if (page >= 1 && page <= this.sitesTotalPages) {
      this.sitesPage = page;
    }
  }

  onRowsPerPageChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.sitesRowsPerPage = parseInt(select.value);
    this.sitesPage = 1;
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
    setTimeout(() => {
      const icons = (window as any).lucide;
      if (icons && icons.createIcons) {
        icons.createIcons();
      }
    }, 0);
  }

  get headerConfig(): { breadcrumbs: { label: string; link?: string }[]; title: string; showActions: boolean; actions: { label: string; icon: string; class?: string }[] } {
    const clientName = this.client?.name || 'Client Details';
    const baseBreadcrumbs = [
      { label: 'Client Management', link: '/clients' },
      { label: 'Clients', link: '/clients' },
      { label: clientName }
    ];

    switch (this.activeTab) {
      case 'keys':
        return {
          breadcrumbs: [...baseBreadcrumbs, { label: 'Keys' }],
          title: clientName,
          showActions: true,
          actions: [
            { label: 'Add New Key', icon: 'plus', class: 'bg-blue-600 hover:bg-blue-700 text-white' },
            { label: 'Import Keys', icon: 'upload', class: 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-600' },
            { label: 'Export', icon: 'download', class: 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-600' }
          ]
        };
      case 'sites':
        return {
          breadcrumbs: [...baseBreadcrumbs, { label: 'Sites' }],
          title: clientName,
          showActions: true,
          actions: [
            { label: 'Add New Site', icon: 'plus', class: 'bg-blue-600 hover:bg-blue-700 text-white' },
            { label: 'Import Sites', icon: 'upload', class: 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-600' },
            { label: 'Export', icon: 'download', class: 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-600' }
          ]
        };
      case 'jobs':
        return {
          breadcrumbs: [...baseBreadcrumbs, { label: 'Jobs' }],
          title: clientName,
          showActions: false,
          actions: []
        };
      default:
        return {
          breadcrumbs: baseBreadcrumbs,
          title: 'Client Details',
          showActions: false,
          actions: []
        };
    }
  }

  getOrgId(): string {
    return localStorage.getItem('organizationId') || localStorage.getItem('org_id') || '';
  }

  toggleActivationState(): void {
    if (this.isClientActive) {
      this.showDeactivateClientModal = true;
    } else {
      this.showActivateClientModal = true;
    }
  }

  onClientDeactivated(): void {
    this.showDeactivateClientModal = false;
    this.isClientActive = false;
    this.loadClient();
    this.showToast('Client deactivated successfully');
  }

  onClientActivated(): void {
    this.showActivateClientModal = false;
    this.isClientActive = true;
    this.loadClient();
    this.showToast('Client activated successfully');
  }

  showToast(message: string): void {
    const toast = document.getElementById('toastNotification');
    const toastMessage = document.getElementById('toastMessage');
    if (toast && toastMessage) {
      toastMessage.textContent = message;
      toast.classList.remove('translate-x-[150%]');
      setTimeout(() => {
        toast.classList.add('translate-x-[150%]');
      }, 3000);
    }
  }

  triggerAction(actionName: string): void {
    if (actionName === 'Add New Key') {
      this.router.navigate(['/keys/add-key'], { queryParams: { clientId: this.clientId } });
      return;
    }
    if (actionName === 'Add New Site') {
      this.router.navigate(['/sites/add-site'], { queryParams: { clientId: this.clientId } });
      return;
    }
    if (actionName === 'Edit Client') {
      this.router.navigate(['/clients/add-client'], { queryParams: { editId: this.clientId } });
      return;
    }
    if (actionName === 'Export Client Data') {
      this.exportClientData();
      return;
    }
    if (actionName === 'Refresh Links') {
      this.loadClient();
      this.loadKeys();
      this.loadSites();
      this.showToast('Data refreshed successfully');
      return;
    }
    this.showToast(`Action "${actionName}" triggered`);
  }

  private exportClientData(): void {
    if (!this.client) return;
    const headers = new Headers();
    headers.append('Content-Type', 'text/csv');
    const rows = [
      ['Code', 'Name', 'Email', 'Region', 'Status', 'Sites', 'Users', 'Created On'],
      [this.client.code, this.client.name, this.client.email, this.client.region, this.client.status, String(this.client.sites), String(this.client.users), this.client.created]
    ];
    const csvContent = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${this.client.code || 'client'}-${this.client.name || 'data'}.csv`;
    link.click();
    this.showToast('Client data exported');
  }

  triggerRowAction(action: string, rowId: string): void {
    if (action === 'View') {
      this.router.navigate(['/keys/view-key', rowId]);
      return;
    }
    const toast = document.getElementById('toastNotification');
    const toastMessage = document.getElementById('toastMessage');
    if (toast && toastMessage) {
      toastMessage.textContent = `${action} requested for contextual entity target: [${rowId}]`;
      toast.classList.remove('translate-x-[150%]');
      setTimeout(() => {
        toast.classList.add('translate-x-[150%]');
      }, 3500);
    }
  }

  viewSite(siteId: string): void {
    console.log(`Navigating to view site with ID: ${siteId}`);
    this.router.navigate(['/sites/view-site', siteId]);
  }

  toggleSelectAllRows(masterCheckbox: HTMLInputElement): void {
    const rowCheckboxes = document.querySelectorAll('.row-checkbox');
    rowCheckboxes.forEach(cb => {
      (cb as HTMLInputElement).checked = masterCheckbox.checked;
      if (masterCheckbox.checked) {
        (cb as HTMLElement).closest('tr')?.classList.add('bg-blue-50/20');
      } else {
        (cb as HTMLElement).closest('tr')?.classList.remove('bg-blue-50/20');
      }
    });
  }

  uploadDocument(): void {
    if (!this.clientId) return;
    this.router.navigate(['/clients', this.clientId, 'add-document'], {
      queryParams: { clientName: this.client?.name || '' }
    });
  }

  viewDocument(docId: string = ''): void {
    if (!this.clientId) return;
    this.router.navigate(['/clients', this.clientId, 'view-document', docId], {
      queryParams: { clientName: this.client?.name || '' }
    });
  }

  onRowCheckboxChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      checkbox.closest('tr')?.classList.add('bg-blue-50/20');
    } else {
      checkbox.closest('tr')?.classList.remove('bg-blue-50/20');
      const selectAll = document.getElementById('selectAllRows') as HTMLInputElement;
      if (selectAll) selectAll.checked = false;
    }
  }

  contacts = [
    { name: 'James Walker', title: 'Operations Manager', dept: 'Operations', email: 'james.walker@metrosecurity.co.uk', phone: '+44 020 7946 0958', status: 'Active', primary: true, initials: 'JW', color: 'bg-violet-100 text-violet-700' },
    { name: 'Sarah Miller', title: 'Account Manager', dept: 'Accounts', email: 'sarah.miller@metrosecurity.co.uk', phone: '+44 020 7946 0961', status: 'Active', primary: true, initials: 'SM', color: 'bg-orange-100 text-orange-700' },
    { name: 'David Johnson', title: 'Finance Manager', dept: 'Finance', email: 'david.johnson@metrosecurity.co.uk', phone: '+44 020 7946 0962', status: 'Active', primary: false, initials: 'DJ', color: 'bg-amber-100 text-amber-700' },
    { name: 'Lisa Martin', title: 'HR Manager', dept: 'Human Resources', email: 'lisa.martin@metrosecurity.co.uk', phone: '+44 020 7946 0963', status: 'Inactive', primary: false, initials: 'LM', color: 'bg-pink-100 text-pink-700' },
    { name: 'Robert Vance', title: 'Compliance Officer', dept: 'Compliance', email: 'robert.vance@metrosecurity.co.uk', phone: '+44 020 7946 0964', status: 'Active', primary: false, initials: 'RV', color: 'bg-indigo-100 text-indigo-700' },
    { name: 'Amy King', title: 'Customer Support Lead', dept: 'Customer Support', email: 'amy.king@metrosecurity.co.uk', phone: '+44 020 7946 0965', status: 'Active', primary: false, initials: 'AK', color: 'bg-emerald-100 text-emerald-700' },
    { name: 'Mark Taylor', title: 'IT Manager', dept: 'IT', email: 'mark.taylor@metrosecurity.co.uk', phone: '+44 020 7946 0966', status: 'Inactive', primary: false, initials: 'MT', color: 'bg-red-100 text-red-700' },
    { name: 'Emma Parker', title: 'Procurement Officer', dept: 'Procurement', email: 'emma.parker@metrosecurity.co.uk', phone: '+44 020 7946 0967', status: 'Inactive', primary: false, initials: 'EP', color: 'bg-teal-100 text-teal-700' },
  ];

  contactStatusClass(status: string): string {
    return status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500';
  }

  toggleDropdown(id: string): void {
    const dropdown = document.getElementById(id);
    if (dropdown) {
      dropdown.classList.toggle('hidden');
    }
  }

  viewContact(contactName: string): void {
    if (!this.clientId) return;
    const slug = contactName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    this.router.navigate(['/clients', this.clientId, 'view-contact', slug], {
      queryParams: { clientName: this.client?.name || '' }
    });
  }

  addContact(): void {
    if (!this.clientId) return;
    this.router.navigate(['/clients', this.clientId, 'add-contact'], {
      queryParams: { clientName: this.client?.name || '' }
    });
  }
}
