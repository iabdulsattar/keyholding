import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ClientService, Client, SiteRecord } from '../../core/services/client.service';
import { PageBreadcrumbComponent, BreadcrumbItem } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';

@Component({
  selector: 'app-all-sites',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PageBreadcrumbComponent],
  templateUrl: './all-sites.component.html',
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
    .filter-select {
      background-color: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      padding: 0.6rem 0.9rem;
      font-size: 0.875rem;
      color: #334155;
      outline: none;
    }
    .filter-select:focus { box-shadow: 0 0 0 2px rgba(47,75,245,0.25); border-color: #2f4bf5; }
    .th-cell { padding: 0.85rem 1.1rem; font-weight: 600; white-space: nowrap; font-size: 0.8rem; }
    .td-cell { padding: 0.9rem 1.1rem; vertical-align: middle; white-space: nowrap; }
    .status-badge {
      display: inline-block; font-size: 0.75rem; font-weight: 600;
      padding: 0.25rem 0.7rem; border-radius: 0.5rem;
    }
    .tag {
      display: inline-block; font-size: 0.72rem; font-weight: 500;
      padding: 0.15rem 0.6rem; border-radius: 0.4rem; margin-top: 0.15rem;
    }
  `]
})
export class AllSitesComponent implements OnInit {
  allSites: SiteRecord[] = [];
  clients: Client[] = [];
  loading = false;
  searchQuery = '';
  clientFilter = '';
  siteTypeFilter = '';
  statusFilter: 'all' | 'Active' | 'Inactive' = 'all';

  clientOptions: Client[] = [];
  siteTypeOptions = ['All Site Types', 'Office', 'Warehouse', 'Retail', 'Distribution', 'Construction', 'Storage'];

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Sites' },
    { label: 'All Sites' }
  ];

  constructor(private clientService: ClientService) {}

  ngOnInit(): void {
    this.loadClients();
    this.loadSites();
  }

  private loadClients(): void {
    this.clientService.listClients({ page: 0, size: 200 }).subscribe((result: any) => {
      this.clients = result.items;
      this.clientOptions = result.items;
    });
  }

  private loadAllSites(): void {
    this.loading = true;
    const status = this.statusFilter === 'all' ? undefined : this.statusFilter;
    this.clientService.listAllSites().subscribe((result: any) => {
      let sites = result.items;
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        sites = sites.filter((s: SiteRecord) =>
          (s.name || '').toLowerCase().includes(q) ||
          (s.code || '').toLowerCase().includes(q) ||
          (s.clientName || '').toLowerCase().includes(q) ||
          (s.address || '').toLowerCase().includes(q)
        );
      }
      if (this.clientFilter) {
        sites = sites.filter((s: SiteRecord) => s.clientId === this.clientFilter || s.clientName === this.clientFilter);
      }
      if (this.siteTypeFilter) {
        sites = sites.filter((s: SiteRecord) => s.type === this.siteTypeFilter);
      }
      if (status) {
        sites = sites.filter((s: SiteRecord) => s.status === status);
      }
      this.allSites = sites;
      this.loading = false;
    });
  }

  loadSites(): void {
    this.loadAllSites();
  }

  onSearch(): void {
    this.loadAllSites();
  }

  onClientChange(): void {
    this.loadAllSites();
  }

  onSiteTypeChange(): void {
    this.loadAllSites();
  }

  get totalSites(): number { return this.allSites.length; }
  get activeSites(): number { return this.allSites.filter(s => s.status === 'Active').length; }
  get inactiveSites(): number { return this.allSites.filter(s => s.status === 'Inactive').length; }
  get activePercentage(): string {
    if (!this.totalSites) return '0';
    return ((this.totalSites - this.inactiveSites) / this.totalSites * 100).toFixed(1);
  }
  get inactivePercentage(): string {
    if (!this.totalSites) return '0';
    return (this.inactiveSites / this.totalSites * 100).toFixed(1);
  }

  statusBadge(status: string): string {
    switch (status) {
      case 'Active':
        return `<span class="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100"><span>Active</span></span>`;
      case 'Inactive':
        return `<span class="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-50 text-rose-600 border border-rose-100"><span>Inactive</span></span>`;
      default:
        return status;
    }
  }
}
