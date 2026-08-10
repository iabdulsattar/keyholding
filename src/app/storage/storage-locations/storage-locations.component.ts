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

  constructor(private keyVault: KeyVaultService, private router: Router) {}

  ngOnInit(): void {
    this.loadStorageLocations();
    this.loadSites();
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

  private resolveSiteNames(): void {
    if (!this.storageLocations.length) return;
    this.storageLocations = this.storageLocations.map(loc => ({
      ...loc,
      siteName: loc.siteId ? (this.sitesMap[loc.siteId] || loc.siteName || '') : (loc.siteName || '')
    }));
    this.applyFilter();
  }

  private loadStorageLocations(): void {
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
    this.keyVault.listStorageLocations(orgId, { page: 0, size: 50 }).subscribe({
      next: (locations: any[]) => {
        const normalized = (locations && locations.length ? locations : []).map(loc => this.normalizeLocation(loc));
        this.storageLocations = normalized;
        this.filteredLocations = [...this.storageLocations];
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
    this.applyFilter();
  }

  applyFilter(): void {
    const q = this.searchTerm.toLowerCase().trim();
    const statusFilter = this.activeFilter;
    this.filteredLocations = this.storageLocations.filter(loc => {
      const matchesSearch =
        (loc.name || '').toLowerCase().includes(q) ||
        (loc.code || '').toLowerCase().includes(q) ||
        (loc.siteName || loc.site || '').toLowerCase().includes(q) ||
        (loc.address || '').toLowerCase().includes(q) ||
        (loc.responsiblePerson || '').toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === 'All Statuses' ||
        (loc.status || (loc.active ? 'Active' : 'Inactive')) === statusFilter;
      return matchesSearch && matchesStatus;
    });
    this.createIcons();
  }

  onStatusFilterChange(): void {
    this.applyFilter();
  }

  get totalLocations(): number {
    return this.storageLocations.length;
  }

  get activeLocations(): number {
    return this.storageLocations.filter(l => l.status === 'Active' || l.active === true).length;
  }

  get maintenanceLocations(): number {
    return this.storageLocations.filter(l => l.status === 'Under Maintenance' || l.status === 'MAINTENANCE').length;
  }

  get inactiveLocations(): number {
    return this.storageLocations.filter(l => l.status === 'Inactive' || l.status === 'INACTIVE').length;
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
