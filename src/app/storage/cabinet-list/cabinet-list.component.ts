import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { KeyVaultService } from '../../core/services/keyvault.service';
import { RichSelectComponent, RichSelectOption } from '../../shared/components/form/rich-select/rich-select.component';

interface CabinetRow {
  id: string;
  code: string;
  name: string;
  type: string;
  totalHooks: number;
  usedHooks: number;
  availHooks: number;
  status: string;
  updatedDate: string;
  updatedBy: string;
}

@Component({
  selector: 'app-cabinet-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, RichSelectComponent],
  templateUrl: './cabinet-list.component.html',
})
export class CabinetListComponent implements OnInit, AfterViewInit {
  cabinets: CabinetRow[] = [];
  loading = false;
  error = '';

  searchTerm = '';
  activeFilter = 'All Statuses';
  activeTypeFilter = 'All Types';

  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  totalItems = 0;

  statusFilterOptions: RichSelectOption[] = [
    { value: 'All Statuses', label: 'All Statuses' },
    { value: 'Active', label: 'Active' },
    { value: 'Full', label: 'Full' },
    { value: 'Inactive', label: 'Inactive' },
  ];

  get activeTypeFilterOptions(): RichSelectOption[] {
    return [{ value: 'All Types', label: 'All Types' }, ...this.uniqueTypes.map(t => ({ value: t, label: t }))];
  }

  constructor(private keyVault: KeyVaultService, private router: Router) {}

  ngOnInit(): void {
    this.loadCabinets();
  }

  ngAfterViewInit(): void {
    this.createIcons();
  }

  private createIcons(): void {
    setTimeout(() => {
      const icons = (window as any).lucide;
      if (icons && icons.createIcons) {
        icons.createIcons();
      }
    }, 0);
  }

  private loadCabinets(params?: { q?: string; status?: string; cabinetType?: string; page?: number }): void {
    this.loading = true;
    this.error = '';
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id') || '';
    if (!orgId) {
      this.cabinets = [];
      this.loading = false;
      this.createIcons();
      return;
    }
    const q = params?.q ?? this.searchTerm;
    const status = params?.status ?? this.activeFilter;
    const cabinetType = params?.cabinetType ?? this.activeTypeFilter;
    const page = params?.page ?? this.currentPage;
    const apiStatus = status === 'All Statuses' ? undefined : (status || '').toUpperCase().replace(/ /g, '_');
    const apiType = cabinetType === 'All Types' ? undefined : cabinetType;
    this.keyVault.listCabinets(orgId, { page, size: this.pageSize, q: q || undefined, status: apiStatus, cabinetType: apiType }).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res ?? {};
        const items = data.content ?? data.items ?? data.data ?? data ?? [];
        const normalized = (items && items.length ? items : []).map((c: any) => this.normalizeCabinet(c));
        this.cabinets = normalized;
        this.currentPage = Number(data.page ?? data.number ?? page ?? 0);
        this.pageSize = Number(data.size ?? this.pageSize);
        this.totalItems = Number(data.totalElements ?? data.total ?? this.cabinets.length);
        this.totalPages = Number(data.totalPages ?? Math.max(1, Math.ceil(this.totalItems / this.pageSize)));
        this.loading = false;
        this.createIcons();
      },
      error: () => {
        this.cabinets = [];
        this.loading = false;
        this.createIcons();
      }
    });
  }

  private normalizeCabinet(c: any): CabinetRow {
    const totalHooks = c.numberOfHooks || c.totalHooks || c.hookCount || c.hooks || 0;
    const usedHooks = c.usedHooks || c.keysHooked || c.keysOnHooks || 0;
    const availHooks = c.availableHooks !== undefined ? c.availableHooks : (totalHooks - usedHooks);
    let status = c.status || 'ACTIVE';
    if (status === 'ACTIVE' || status === 'Active') {
      status = usedHooks >= totalHooks && totalHooks > 0 ? 'Full' : 'Active';
    } else if (status === 'INACTIVE' || status === 'Inactive') {
      status = 'Inactive';
    } else if (status === 'MAINTENANCE' || status === 'Under Maintenance') {
      status = 'Under Maintenance';
    }
    return {
      id: c.id || c.code || '',
      code: c.code || c.cabinetCode || '',
      name: c.name || c.cabinetName || '',
      type: c.cabinetType || c.type || '',
      totalHooks: totalHooks,
      usedHooks: usedHooks,
      availHooks: availHooks,
      status: status,
      updatedDate: c.updatedDate || c.updatedAt || c.lastUpdated || '',
      updatedBy: c.updatedBy || c.lastUpdatedBy || '',
    };
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadCabinets({ q: this.searchTerm });
  }

  onStatusFilterChange(): void {
    this.currentPage = 0;
    this.loadCabinets({ status: this.activeFilter });
  }

  onTypeFilterChange(): void {
    this.currentPage = 0;
    this.loadCabinets({ cabinetType: this.activeTypeFilter });
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.loadCabinets({ q: this.searchTerm, status: this.activeFilter, cabinetType: this.activeTypeFilter });
  }

  get totalCabinets(): number {
    return this.totalItems;
  }

  get startIndex(): number {
    if (this.totalItems === 0) return 0;
    return this.currentPage * this.pageSize + 1;
  }

  get endIndex(): number {
    if (this.totalItems === 0) return 0;
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalItems);
  }

  get visiblePages(): (number | '...')[] {
    const pages: (number | '...')[] = [];
    const total = this.totalPages;
    const current = this.currentPage;
    if (total <= 7) {
      for (let i = 0; i < total; i++) pages.push(i);
    } else {
      pages.push(0);
      if (current > 3) pages.push('...');
      const start = Math.max(1, current - 1);
      const end = Math.min(total - 2, current + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (current < total - 4) pages.push('...');
      pages.push(total - 1);
    }
    return pages;
  }

  get totalHooks(): number {
    return this.cabinets.reduce((sum, c) => sum + (c.totalHooks || 0), 0);
  }

  get usedHooks(): number {
    return this.cabinets.reduce((sum, c) => sum + (c.usedHooks || 0), 0);
  }

  get availHooks(): number {
    return this.cabinets.reduce((sum, c) => sum + (c.availHooks || 0), 0);
  }

  get activeCabinets(): number {
    return this.cabinets.filter(c => c.status === 'Active').length;
  }

  get fullCabinets(): number {
    return this.cabinets.filter(c => c.status === 'Full').length;
  }

  get inactiveCabinets(): number {
    return this.cabinets.filter(c => c.status === 'Inactive').length;
  }

  get maintenanceCabinets(): number {
    return this.cabinets.filter(c => c.status === 'Under Maintenance' || c.status === 'MAINTENANCE').length;
  }

  get uniqueTypes(): string[] {
    return [...new Set(this.cabinets.map(c => c.type).filter(t => !!t))];
  }

  get utilization(): number {
    if (this.totalHooks === 0) return 0;
    return Math.round((this.usedHooks / this.totalHooks) * 100);
  }

  get utilizationDashoffset(): number {
    const circumference = 2 * Math.PI * 15.5;
    return circumference - (this.utilization / 100) * circumference;
  }

  get circumference(): number {
    return 2 * Math.PI * 15.5;
  }

  cabinetStatusClass(status: string): string {
    if (status === 'Active') return 'bg-emerald-50 text-emerald-600';
    if (status === 'Full') return 'bg-rose-50 text-rose-500';
    if (status === 'Inactive') return 'bg-rose-50 text-rose-600';
    return 'bg-slate-100 text-slate-500';
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '—';
    const date = new Date(value);
    if (isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  viewCabinet(cabinet: CabinetRow): void {
    this.router.navigate(['/storage/locations/cabinets/view', cabinet.id]);
  }

  editCabinet(cabinet: CabinetRow): void {
    this.router.navigate(['/storage/locations/cabinets/edit', cabinet.id]);
  }
}
