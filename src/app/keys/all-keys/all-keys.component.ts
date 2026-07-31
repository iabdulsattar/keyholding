import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ClientService, Client, SiteRecord, KeyRecord, PaginatedResult } from '../../core/services/client.service';

@Component({
  selector: 'app-all-keys',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './all-keys.component.html',
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
    .sort-arrow { color: #cbd5e1; font-size: 0.7rem; }
    .status-badge {
      display: inline-block; font-size: 0.75rem; font-weight: 600;
      padding: 0.25rem 0.7rem; border-radius: 0.5rem;
    }
    .tag {
      display: inline-block; font-size: 0.72rem; font-weight: 600;
      padding: 0.2rem 0.65rem; border-radius: 0.4rem;
    }
  `]
})
export class AllKeysComponent implements OnInit {
  keys: KeyRecord[] = [];
  clients: Client[] = [];
  sites: SiteRecord[] = [];
  pageKeys: KeyRecord[] = [];
  loading = false;
  searchQuery = '';
  clientFilter = '';
  siteFilter = '';
  keyTypeFilter = '';
  statusFilter: string = '';
  page = 0;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;

  clientOptions: Client[] = [];
  siteOptions: SiteRecord[] = [];
  keyTypeOptions = ['All Key Types', 'Master Key', 'Door Key', 'Alarm Key', 'Gate Key', 'Utility Key', 'Office Key', 'IT Key'];
  statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'IN_STORAGE', label: 'On the Hook' },
    { value: 'ISSUED', label: 'Issued' },
    { value: 'IN_USE', label: 'In Use' },
    { value: 'OVERDUE', label: 'Overdue' },
    { value: 'DAMAGED', label: 'Damaged' },
    { value: 'LOST', label: 'Damaged / Lost' }
  ];

  constructor(private clientService: ClientService) {}

  ngOnInit(): void {
    this.loadClients();
    this.loadSites();
    this.loadKeys();
  }

  private loadClients(): void {
    this.clientService.listClients({ page: 0, size: 200 }).subscribe((result: any) => {
      this.clients = result.items;
      this.clientOptions = result.items;
    });
  }

  private loadSites(): void {
    this.clientService.listAllSites({ page: 0, size: 200 }).subscribe((result: any) => {
      this.sites = result.items;
      this.siteOptions = result.items;
    });
  }

  private loadKeys(): void {
    this.loading = true;
    const status = this.statusFilter ? this.statusFilter : undefined;
    this.clientService.listAllKeys({
      q: this.searchQuery || undefined,
      status,
      page: this.page,
      size: this.pageSize,
    }).subscribe((result: PaginatedResult<KeyRecord>) => {
      let keys = result.items;
      if (this.clientFilter) {
        keys = keys.filter((k: KeyRecord) => k.clientId === this.clientFilter);
      }
      if (this.siteFilter) {
        keys = keys.filter((k: KeyRecord) => k.site === this.siteFilter || k.siteName === this.siteFilter);
      }
      if (this.keyTypeFilter && this.keyTypeFilter !== 'All Key Types') {
        keys = keys.filter((k: KeyRecord) => k.type === this.keyTypeFilter);
      }
      this.keys = keys;
      this.totalItems = keys.length;
      this.totalPages = Math.max(1, Math.ceil(this.totalItems / this.pageSize));
      if (this.page >= this.totalPages) {
        this.page = Math.max(0, this.totalPages - 1);
      }
      this.applyPagination();
      this.loading = false;
    });
  }

  private applyPagination(): void {
    const start = this.page * this.pageSize;
    this.pageKeys = this.keys.slice(start, start + this.pageSize);
  }

  onSearch(): void {
    this.page = 0;
    this.loadKeys();
  }

  onClientChange(): void {
    this.page = 0;
    this.loadKeys();
  }

  onSiteChange(): void {
    this.page = 0;
    this.loadKeys();
  }

  onKeyTypeChange(): void {
    this.page = 0;
    this.loadKeys();
  }

  onStatusChange(): void {
    this.page = 0;
    this.loadKeys();
  }

  get totalKeys(): number { return this.totalItems; }
  get onHookKeys(): number { return this.keys.filter(k => k.status === 'In Storage').length; }
  get issuedKeys(): number { return this.keys.filter(k => k.status === 'Issued').length; }
  get onHookPercentage(): string {
    if (!this.totalKeys) return '0';
    return ((this.totalKeys - this.issuedKeys) / this.totalKeys * 100).toFixed(1);
  }
  get issuedPercentage(): string {
    if (!this.totalKeys) return '0';
    return (this.issuedKeys / this.totalKeys * 100).toFixed(1);
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

  trackByKeyId(index: number, key: KeyRecord): string {
    return key.id;
  }

  statusBadge(status: string, color = 'emerald'): string {
    const labelMap: Record<string, string> = {
      'In Storage': 'On the Hook',
      'Issued': 'Issued',
      'In Use': 'In Use',
      'Overdue': 'Overdue',
      'Damaged': 'Damaged',
      'Lost': 'Damaged / Lost',
      'Damaged / Lost': 'Damaged / Lost',
    };
    const label = labelMap[status] || status;
    return `<span class="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-${color}-50 text-${color}-700 border border-${color}-100"><span>${label}</span></span>`;
  }

  typeBadge(type: string, color = 'slate'): string {
    return `<span class="px-2.5 py-1 rounded-lg border border-${color}-100 tag bg-${color}-50 text-${color}-600">${type}</span>`;
  }
}
