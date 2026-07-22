import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientService, Client, KeyRecord, SiteRecord } from '../../core/services/client.service';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './client-detail.component.html',
  styles: `
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
    .tab-content-panel { display: none; }
    .tab-content-panel.active { display: block; }
  `
})
export class ClientDetailComponent implements OnInit {
  isClientActive = true;
  activeTab = 'overview';
  clientId = '';
  client: Client | null = null;
  keys: KeyRecord[] = [];
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

  get totalJobs(): number {
    return this.sites.reduce((sum, site) => sum + (site.jobs || 0), 0);
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

  toggleActivationState(): void {
    if (!this.client || !this.clientId) return;
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
    if (!orgId) return;
    if (this.isClientActive) {
      this.clientService.deactivateClient(this.clientId).subscribe({
        next: () => {
          this.isClientActive = false;
          this.loadClient();
          this.showToast('Client deactivated successfully');
        },
        error: () => this.showToast('Failed to deactivate client')
      });
    } else {
      this.clientService.reactivateClient(this.clientId).subscribe({
        next: () => {
          this.isClientActive = true;
          this.loadClient();
          this.showToast('Client activated successfully');
        },
        error: () => this.showToast('Failed to activate client')
      });
    }
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

  toggleDropdown(id: string): void {
    const dropdown = document.getElementById(id);
    if (dropdown) {
      dropdown.classList.toggle('hidden');
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
      this.router.navigate(['/keys/view-key']);
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
}
