import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ClientService, Client, SiteRecord } from '../../core/services/client.service';
import { RichSelectComponent, RichSelectOption } from '../../shared/components/form/rich-select/rich-select.component';

@Component({
  selector: 'app-all-sites',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, RichSelectComponent],
  templateUrl: './all-sites.component.html',
  styles: [`
    .th-cell { padding: 0.85rem 1.1rem; font-weight: 600; white-space: nowrap; font-size: 0.8rem; }
    .td-cell { padding: 0.9rem 1.1rem; vertical-align: middle; }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `]
})
export class AllSitesComponent implements OnInit {
  allSites: SiteRecord[] = [];
  clients: Client[] = [];
  loading = false;
  searchQuery = '';
  clientFilter = '';
  siteTypeFilter = '';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';

  // Pagination state
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 25, 50, 100];
  totalItems = 0;
  totalPages = 0;

  clientOptions: Client[] = [];
  siteTypeOptions = ['All Site Types', 'Office', 'Warehouse', 'Retail', 'Distribution Centre', 'Construction Site', 'Storage', 'Remote Office', 'Data Centre', 'Other'];
  siteTypeFilterOptions: RichSelectOption[] = [
    { value: '', label: 'All Site Types' },
    { value: 'Office', label: 'Office' },
    { value: 'Warehouse', label: 'Warehouse' },
    { value: 'Retail', label: 'Retail' },
    { value: 'Distribution Centre', label: 'Distribution Centre' },
    { value: 'Construction Site', label: 'Construction Site' },
    { value: 'Storage', label: 'Storage' },
    { value: 'Remote Office', label: 'Remote Office' },
    { value: 'Data Centre', label: 'Data Centre' },
    { value: 'Other', label: 'Other' },
  ];
  statusFilterOptions: RichSelectOption[] = [
    { value: 'all', label: 'Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
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
    const params: any = { 
      page: this.currentPage - 1, 
      size: this.pageSize 
    };
    if (this.searchQuery) params.q = this.searchQuery;
    if (this.statusFilter && this.statusFilter !== 'all') params.status = this.statusFilter === 'active' ? 'ACTIVE' : this.statusFilter === 'inactive' ? 'INACTIVE' : this.statusFilter;
    if (this.siteTypeFilter) params.siteType = this.siteTypeFilter;
    if (this.clientFilter) params.clientId = this.clientFilter;

    this.clientService.listAllSites(params).subscribe((result: any) => {
      this.allSites = result.items;
      this.totalItems = result.totalElements || result.total || result.items.length;
      this.totalPages = result.totalPages || Math.ceil(this.totalItems / this.pageSize);
      this.loading = false;
    });
  }

  loadSites(): void {
    this.loadAllSites();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadAllSites();
  }

  onClientChange(): void {
    this.currentPage = 1;
    this.loadAllSites();
  }

  onSiteTypeChange(): void {
    this.currentPage = 1;
    this.loadAllSites();
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.loadAllSites();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadAllSites();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadAllSites();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadAllSites();
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
    if (this.totalItems === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get showingEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  get clientFilterOptions(): RichSelectOption[] {
    return [{ value: '', label: 'Client Type' }, ...this.clientOptions.map(c => ({ value: c.id, label: c.name }))];
  }

  get totalSites(): number { return this.totalItems; }
  get activeSites(): number { return this.allSites.filter(s => s.status === 'ACTIVE').length; }
  get inactiveSites(): number { return this.allSites.filter(s => s.status === 'INACTIVE').length; }
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
      case 'ACTIVE':
        return 'bg-green-100 text-green-600';
      case 'INACTIVE':
        return 'bg-rose-50 text-rose-600';
      default:
        return '';
    }
  }

  siteTypeBadgeClass(type: string): string {
    const map: Record<string, string> = {
      'Office': 'bg-blue-50 text-blue-700',
      'Warehouse': 'bg-purple-50 text-purple-700',
      'Retail': 'bg-amber-50 text-amber-700',
      'Distribution Centre': 'bg-emerald-50 text-emerald-700',
      'Data Centre': 'bg-cyan-50 text-cyan-700',
      'Construction Site': 'bg-slate-100 text-slate-600',
      'Storage': 'bg-pink-50 text-pink-700',
    };
    return map[type] || 'bg-slate-100 text-slate-600';
  }
}
