import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ClientService, Client, SiteRecord } from '../../core/services/client.service';

@Component({
  selector: 'app-all-sites',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
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
    .page-btn {
      width: 2rem; height: 2rem; border-radius: 0.55rem;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.8rem; font-weight: 500; color: #475569;
      border: 1px solid #e2e8f0; background: white;
    }
    .page-btn:hover { background: #f8fafc; }
    .page-btn-active { background: #eef2ff; color: #2f4bf5; border-color: #c7d2fe; }
    .sort-arrow { color: #cbd5e1; font-size: 0.7rem; }
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
  pageSites: SiteRecord[] = [];
  loading = false;
  searchQuery = '';
  clientFilter = '';
  siteTypeFilter = '';
  statusFilter: 'all' | 'Active' | 'Inactive' = 'all';
  page = 0;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;

  clientOptions: Client[] = [];
  siteTypeOptions = ['All Site Types', 'Office', 'Warehouse', 'Retail', 'Distribution', 'Construction', 'Storage'];

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
      this.applyPagination();
      this.loading = false;
    });
  }

  private applyPagination(): void {
    this.totalItems = this.allSites.length;
    this.totalPages = Math.max(1, Math.ceil(this.totalItems / this.pageSize));
    if (this.page >= this.totalPages) {
      this.page = Math.max(0, this.totalPages - 1);
    }
    const start = this.page * this.pageSize;
    this.pageSites = this.allSites.slice(start, start + this.pageSize);
  }

  loadSites(): void {
    this.loadAllSites();
  }

  onSearch(): void {
    this.page = 0;
    this.loadAllSites();
  }

  onClientChange(): void {
    this.page = 0;
    this.loadAllSites();
  }

  onSiteTypeChange(): void {
    this.page = 0;
    this.loadAllSites();
  }

  get totalSites(): number { return this.totalItems; }
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

  get showingStart(): number {
    return this.totalItems === 0 ? 0 : this.page * this.pageSize + 1;
  }

  get showingEnd(): number {
    return Math.min((this.page + 1) * this.pageSize, this.totalItems);
  }

  goToPage(p: number | string): void {
    if (typeof p !== 'number') return;
    if (p < 0 || p >= this.totalPages) return;
    this.page = p;
    this.applyPagination();
  }

  prevPage(): void {
    this.goToPage(this.page - 1);
  }

  nextPage(): void {
    this.goToPage(this.page + 1);
  }

  onPageSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.pageSize = parseInt(select.value, 10) || 10;
    this.page = 0;
    this.applyPagination();
  }

  getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const total = this.totalPages;
    const current = this.page;
    if (total <= 7) {
      for (let i = 0; i < total; i++) pages.push(i);
    } else {
      pages.push(0);
      if (current > 2) pages.push('...');
      const start = Math.max(1, current - 1);
      const end = Math.min(total - 2, current + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (current < total - 3) pages.push('...');
      pages.push(total - 1);
    }
    return pages;
  }

  pageLabel(p: number | string): string {
    return typeof p === 'number' ? String(p + 1) : String(p);
  }

  trackBySiteId(index: number, site: SiteRecord): string {
    return site.id;
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
