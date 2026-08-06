import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ClientService, Client, SiteRecord, KeyRecord, PaginatedResult } from '../../core/services/client.service';
import { PageBreadcrumbComponent, BreadcrumbItem } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { RichSelectComponent, RichSelectOption } from '../../shared/components/form/rich-select/rich-select.component';

@Component({
  selector: 'app-all-keys',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PageBreadcrumbComponent, RichSelectComponent],
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
  searchQuery = '';
  clientFilter = '';

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Keys' },
    { label: 'All Keys' }
  ];
  siteFilter = '';
  keyTypeFilter = '';
  statusFilter: string = '';

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
    { value: 'LOST', label: 'Damaged / Lost' },
  ];

  get siteFilterOptions(): RichSelectOption[] {
    return [{ value: '', label: 'All Sites' }, ...this.siteOptions.map(s => ({ value: s.id, label: s.name }))];
  }

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
      page: 0,
      size: 200,
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
      this.loading = false;
    });
  }

  onSearch(): void {
    this.loadKeys();
  }

  onClientChange(): void {
    this.loadKeys();
  }

  onSiteChange(): void {
    this.loadKeys();
  }

  onKeyTypeChange(): void {
    this.loadKeys();
  }

  onStatusChange(): void {
    this.loadKeys();
  }

  get totalKeys(): number { return this.keys.length; }
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
