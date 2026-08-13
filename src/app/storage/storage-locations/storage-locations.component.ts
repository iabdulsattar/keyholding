import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { KeyVaultService } from '../../core/services/keyvault.service';

@Component({
  selector: 'app-storage-locations',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './storage-locations.component.html',
})
export class StorageLocationsComponent implements OnInit, AfterViewInit {
  storageLocations: any[] = [];
  filteredLocations: any[] = [];
  loading = false;
  searchTerm = '';
  activeFilter = 'All Statuses';
  private sitesMap: Record<string, string> = {};
  apiError = false;
  stats: any = null;
  currentPage = 0;
  pageSize = 10;
  pageSizeOptions: number[] = [10, 25, 50, 100];
  totalPages = 0;
  totalItems = 0;

  constructor(private keyVault: KeyVaultService, private router: Router) {}

  ngOnInit(): void {
    this.loadStorageLocations();
    this.loadSites();
    this.loadStorageLocationStats();
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

  private loadSites(): void {
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id') || '';
    if (!orgId) return;
    this.keyVault.listAllSites(orgId, { page: 0, size: 100 }).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res ?? {};
        const items = data.content ?? data.items ?? data.data ?? data ?? [];
        this.sitesMap = items.reduce((acc: Record<string, string>, s: any) => {
          acc[s.id] = s.name || s.siteName || s.buildingName || '';
          return acc;
        }, {});
        this.resolveSiteNames();
      },
      error: () => {
        this.sitesMap = {};
      }
    });
  }

  private loadStorageLocationStats(): void {
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id') || '';
    if (!orgId) return;
    this.keyVault.getStorageLocationStats(orgId).subscribe({
      next: (res: any) => {
        this.stats = res?.data ?? res ?? {};
      },
      error: () => {
        this.stats = null;
      }
    });
  }

  private resolveSiteNames(): void {
    if (!this.storageLocations.length) return;
    this.storageLocations = this.storageLocations.map(loc => ({
      ...loc,
      siteName: loc.siteId ? (this.sitesMap[loc.siteId] || loc.siteName || '') : (loc.siteName || '')
    }));
    this.applyFilter();
  }

  private loadStorageLocations(params?: { q?: string; status?: string; page?: number }): void {
    this.loading = true;
    this.apiError = false;
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id') || '';
    if (!orgId) {
      this.storageLocations = [];
      this.filteredLocations = [];
      this.loading = false;
      this.createIcons();
      return;
    }
    const q = params?.q ?? this.searchTerm;
    const status = params?.status ?? this.activeFilter;
    const page = params?.page ?? this.currentPage;
    const apiStatus = status === 'All Statuses' ? undefined : (status || '').toUpperCase().replace(/ /g, '_');
    this.keyVault.listStorageLocations(orgId, { page, size: this.pageSize, q: q || undefined, status: apiStatus }).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res ?? {};
        const items = data.content ?? data.items ?? data.data ?? data ?? [];
        const normalized = (items && items.length ? items : []).map((loc: any) => this.normalizeLocation(loc));
        this.storageLocations = normalized;
        this.filteredLocations = [...this.storageLocations];
        this.currentPage = Number(data.page ?? data.number ?? page ?? 0);
        this.pageSize = Number(data.size ?? this.pageSize);
        this.totalItems = Number(data.totalElements ?? data.total ?? this.storageLocations.length);
        this.totalPages = Number(data.totalPages ?? Math.max(1, Math.ceil(this.totalItems / this.pageSize)));
        this.loading = false;
        this.createIcons();
      },
      error: () => {
        this.storageLocations = [];
        this.filteredLocations = [];
        this.apiError = true;
        this.loading = false;
        this.createIcons();
      }
    });
  }

  private normalizeLocation(loc: any): any {
    const siteId = loc.siteId || '';
    const siteName = siteId ? (this.sitesMap[siteId] || '') : (loc.siteBuilding || '');
    return {
      id: loc.id || loc.locationCode || '',
      code: loc.locationCode || '',
      name: loc.name || '',
      locationType: loc.locationType || '',
      siteId: siteId,
      siteName: siteName,
      siteBuilding: loc.siteBuilding || '',
      address: loc.address || '',
      city: loc.city || '',
      postcode: loc.postcode || '',
      country: loc.country || '',
      responsiblePerson: loc.responsiblePerson || '',
      responsiblePersonTitle: '',
      contactNumber: loc.contactNumber || '',
      accessInstructions: loc.accessInstructions || '',
      description: loc.description || '',
      status: loc.status || (loc.active ? 'Active' : 'Inactive') || '',
      isActive: loc.active !== undefined ? loc.active : (loc.status === 'Active' || loc.status === 'ACTIVE'),
      active: loc.active !== undefined ? loc.active : (loc.status === 'Active' || loc.status === 'ACTIVE'),
      totalCabinets: loc.totalCabinets ?? 0,
      totalHooks: loc.totalHooks ?? 0,
      createdAt: loc.createdAt || loc.created_at || '',
      updatedAt: loc.updatedAt || loc.updated_at || '',
    };
  }

  viewLocation(location: any): void {
    const id = location.id || location.code || '';
    if (id) {
      this.router.navigate(['/storage/locations/view', id]);
    }
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadStorageLocations({ q: this.searchTerm });
  }

  applyFilter(): void {
    this.currentPage = 0;
    this.loadStorageLocations({ q: this.searchTerm, status: this.activeFilter });
  }

  onStatusFilterChange(): void {
    this.currentPage = 0;
    this.loadStorageLocations({ status: this.activeFilter });
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.loadStorageLocations({ q: this.searchTerm, status: this.activeFilter });
  }

  onPageSizeChange(): void {
    this.currentPage = 0;
    this.loadStorageLocations({ q: this.searchTerm, status: this.activeFilter });
  }

  get totalLocations(): number {
    return this.stats?.total ?? this.stats?.totalLocations ?? this.totalItems;
  }

  get activeLocations(): number {
    return this.stats?.active ?? this.stats?.activeLocations ?? this.storageLocations.filter(l => l.status === 'Active' || l.active === true).length;
  }

  get maintenanceLocations(): number {
    return this.stats?.maintenance ?? this.stats?.underMaintenance ?? this.stats?.maintenanceLocations ?? this.storageLocations.filter(l => l.status === 'Under Maintenance' || l.status === 'MAINTENANCE').length;
  }

  get inactiveLocations(): number {
    return this.stats?.inactive ?? this.stats?.inactiveLocations ?? this.storageLocations.filter(l => l.status === 'Inactive' || l.status === 'INACTIVE').length;
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

  get totalCabinetsAll(): number {
    return this.storageLocations.reduce((sum, l) => sum + (l.totalCabinets || 0), 0);
  }

  get totalHooksAll(): number {
    return this.storageLocations.reduce((sum, l) => sum + (l.totalHooks || 0), 0);
  }

  get keysInStorageAll(): number {
    return this.storageLocations.reduce((sum, l) => sum + (l.keysInStorage || 0), 0);
  }

  get availableHooksAll(): number {
    return this.storageLocations.reduce((sum, l) => sum + (l.availableHooks || 0), 0);
  }

  locationStatusClass(status: string): string {
    const s = (status || '').toUpperCase();
    if (s === 'ACTIVE') {
      return 'bg-emerald-50 text-emerald-600';
    }
    if (s === 'INACTIVE') {
      return 'bg-rose-50 text-rose-600';
    }
    if (s.includes('MAINTENANCE') || s === 'UNDER MAINTENANCE') {
      return 'bg-amber-50 text-amber-600';
    }
    return 'bg-slate-100 text-slate-600';
  }

  getLocationStatus(loc: any): string {
    const raw = loc.status || (loc.active ? 'Active' : 'Inactive') || '—';
    if (raw === 'UNDER_MAINTENANCE' || raw === 'MAINTENANCE') return 'Under Maintenance';
    return raw;
  }

  getLocationStatusDot(loc: any): string {
    const s = (this.getLocationStatus(loc) || '').toUpperCase();
    if (s === 'ACTIVE') return 'bg-emerald-500';
    if (s === 'INACTIVE') return 'bg-rose-500';
    if (s.includes('MAINTENANCE') || s === 'UNDER MAINTENANCE') return 'bg-amber-500';
    return 'bg-slate-400';
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '—';
    const date = new Date(value);
    if (isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
