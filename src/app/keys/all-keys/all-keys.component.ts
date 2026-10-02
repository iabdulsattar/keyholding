import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ClientService, Client, SiteRecord, KeyRecord, PaginatedResult } from '../../core/services/client.service';
import { KeyVaultService } from '../../core/services/keyvault.service';
import { PageBreadcrumbComponent, BreadcrumbItem } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { RichSelectComponent, RichSelectOption } from '../../shared/components/form/rich-select/rich-select.component';
import { ProductSwitcherComponent } from '../../shared/components/ui/product-switcher/product-switcher.component';

@Component({
  selector: 'app-all-keys',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, RichSelectComponent, ProductSwitcherComponent],
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
    .th-cell { padding: 0.85rem 1.1rem; font-weight: 700; white-space: nowrap; font-size: 0.75rem; }
    .td-cell { padding: 0.9rem 1.1rem; vertical-align: middle; white-space: nowrap; }
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
  loading = false;
  deletingKeyId = '';
  searchQuery = '';
  clientFilter = '';

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Keys' },
    { label: 'All Keys' }
  ];
  siteFilter = '';
  keyTypeFilter = '';
  statusFilter: string = '';

  // Pagination state
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 25, 50, 100];
  totalItems = 0;
  totalPages = 0;

  clientOptions: Client[] = [];
  siteOptions: SiteRecord[] = [];
  keyTypeOptions = ['All Key Types', 'Master Key', 'Door Key', 'Alarm Key', 'Gate Key', 'Utility Key', 'Office Key', 'IT Key'];
  keyTypeFilterOptions: RichSelectOption[] = [
    { value: '', label: 'All Key Types' },
    { value: 'Master Key', label: 'Master Key' },
    { value: 'Door Key', label: 'Door Key' },
    { value: 'Alarm Key', label: 'Alarm Key' },
    { value: 'Gate Key', label: 'Gate Key' },
    { value: 'Utility Key', label: 'Utility Key' },
    { value: 'Office Key', label: 'Office Key' },
    { value: 'IT Key', label: 'IT Key' },
  ];
  statusFilterOptions: RichSelectOption[] = [
    { value: '', label: 'All Status' },
    { value: 'IN_STORAGE', label: 'On the Hook' },
    { value: 'ISSUED', label: 'Issued' },
    { value: 'IN_USE', label: 'In Use' },
    { value: 'OVERDUE', label: 'Overdue' },
    { value: 'DAMAGED', label: 'Damaged' },
    { value: 'LOST', label: 'Lost' },
  ];

  get siteFilterOptions(): RichSelectOption[] {
    return [{ value: '', label: 'All Sites' }, ...this.siteOptions.map(s => ({ value: s.id, label: s.name }))];
  }

  get clientFilterOptions(): RichSelectOption[] {
    return [{ value: '', label: 'All Clients' }, ...this.clientOptions.map(c => ({ value: c.id, label: c.name }))];
  }

  constructor(private clientService: ClientService, private keyVault: KeyVaultService) {}

  ngOnInit(): void {
    this.loadClients();
    this.loadSites();
    this.loadKeys();
  }

  private loadClients(): void {
    this.clientService.listClients({ page: 0, size: 200 }).subscribe({
      next: (result: any) => {
        this.clients = result?.items ?? [];
        this.clientOptions = this.clients;
      },
      error: () => {
        this.clients = [];
        this.clientOptions = [];
      }
    });
  }

  private loadSites(): void {
    this.clientService.listAllSites({ page: 0, size: 200 }).subscribe({
      next: (result: any) => {
        this.sites = result?.items ?? [];
        this.siteOptions = this.sites;
      },
      error: () => {
        this.sites = [];
        this.siteOptions = [];
      }
    });
  }

  private loadKeys(): void {
    this.loading = true;
    const status = this.statusFilter ? this.statusFilter : undefined;
    // Client and site are sent to the API rather than filtered on the results,
    // otherwise the filter would only apply to the current page while the
    // totals still counted every key.
    this.clientService.listAllKeys({
      q: this.searchQuery || undefined,
      status,
      clientId: this.clientFilter || undefined,
      siteId: this.siteFilter || undefined,
      page: this.currentPage - 1,
      size: this.pageSize,
    }).subscribe({
      next: (result: PaginatedResult<KeyRecord>) => {
        let keys = result.items;
        if (this.keyTypeFilter && this.keyTypeFilter !== 'All Key Types') {
          keys = keys.filter((k: KeyRecord) => k.type === this.keyTypeFilter);
        }
        this.keys = keys;
        this.totalItems = result.totalItems || keys.length;
        this.totalPages = result.totalPages || Math.ceil(this.totalItems / this.pageSize);
        this.loading = false;
      },
      error: () => {
        this.keys = [];
        this.totalItems = 0;
        this.totalPages = 0;
        this.loading = false;
      }
    });
  }

  /**
   * Deletes the key straight from the listing, without the confirmation dialog,
   * then reloads so the totals match the rows that remain.
   */
  deleteKey(key: KeyRecord): void {
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id') || '';
    if (!orgId || !key?.id || this.deletingKeyId === key.id) return;
    this.deletingKeyId = key.id;
    this.keyVault.deleteKey(orgId, key.id).subscribe({
      next: () => {
        this.deletingKeyId = '';
        // Stepping back keeps the page valid when the last row was removed.
        if (this.keys.length === 1 && this.currentPage > 1) {
          this.currentPage--;
        }
        this.loadKeys();
      },
      error: () => {
        this.deletingKeyId = '';
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadKeys();
  }

  onClientChange(): void {
    this.currentPage = 1;
    this.loadKeys();
  }

  onSiteChange(): void {
    this.currentPage = 1;
    this.loadKeys();
  }

  onKeyTypeChange(): void {
    this.currentPage = 1;
    this.loadKeys();
  }

  onStatusChange(): void {
    this.currentPage = 1;
    this.loadKeys();
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.loadKeys();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadKeys();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadKeys();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadKeys();
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

  get totalKeys(): number { return this.totalItems; }
  get onHookKeys(): number { return this.keys.filter(k => this.hasState(k, 'ON_THE_HOOK', 'ON_HOOK')).length; }
  get issuedKeys(): number { return this.keys.filter(k => this.hasState(k, 'ISSUED')).length; }
  get onHookPercentage(): string {
    if (!this.totalKeys) return '0';
    return ((this.totalKeys - this.issuedKeys) / this.totalKeys * 100).toFixed(1);
  }
  get issuedPercentage(): string {
    if (!this.totalKeys) return '0';
    return (this.issuedKeys / this.totalKeys * 100).toFixed(1);
  }

  private hasState(key: KeyRecord, ...states: string[]): boolean {
    return states.indexOf((key.statusCode || key.status || '').toUpperCase()) !== -1;
  }

  /** Renders the raw key state (`ON_THE_HOOK`) as plain words (`On the hook`). */
  statusBadge(status: string, color = 'emerald'): string {
    const label = this.statusLabel(status);
    return `<span class="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-${color}-50 text-${color}-700 border border-${color}-100"><span>${label}</span></span>`;
  }

  private statusLabel(status: string): string {
    const text = (status || '').replace(/[_-]+/g, ' ').trim();
    if (!text) return '';
    if (text !== text.toUpperCase() && text !== text.toLowerCase()) return text;
    const lower = text.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }

  typeBadge(type: string, color = 'slate'): string {
    return `<span class="px-2.5 py-1 rounded-md border border-${color}-100 tag bg-${color}-50 text-${color}-600">${type}</span>`;
  }
}
