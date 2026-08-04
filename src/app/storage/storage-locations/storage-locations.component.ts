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

  constructor(private keyVault: KeyVaultService, private router: Router) {}

  ngOnInit(): void {
    this.loadStorageLocations();
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

  private loadStorageLocations(): void {
    this.loading = true;
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id') || '';
    if (!orgId) {
      this.storageLocations = this.getFallbackLocations();
      this.filteredLocations = [...this.storageLocations];
      this.loading = false;
      this.createIcons();
      return;
    }
    this.keyVault.listStorageLocations(orgId, true).subscribe({
      next: (locations: any[]) => {
        const normalized = (locations && locations.length ? locations : []).map(loc => this.normalizeLocation(loc));
        const complete = normalized.length > 0 && normalized.every(loc => loc.address && loc.siteName);
        this.storageLocations = complete ? normalized : this.getFallbackLocations();
        this.filteredLocations = [...this.storageLocations];
        this.loading = false;
        this.createIcons();
      },
      error: () => {
        this.storageLocations = this.getFallbackLocations();
        this.filteredLocations = [...this.storageLocations];
        this.loading = false;
        this.createIcons();
      }
    });
  }

  private normalizeLocation(loc: any): any {
    return {
      ...loc,
      id: loc.id || loc.code || '',
      code: loc.code || '',
      name: loc.name || loc.locationName || '',
      siteName: loc.siteName || loc.site || loc.building || loc.buildingName || '',
      address: loc.address || loc.addressLine1 || '',
      responsiblePerson: loc.responsiblePerson || loc.responsiblePersonName || loc.contactPerson || '',
      responsiblePersonTitle: loc.responsiblePersonTitle || loc.title || '',
      status: loc.status || (loc.active ? 'Active' : 'Inactive') || '',
      isActive: loc.active !== undefined ? loc.active : (loc.status === 'Active' || loc.status === 'ACTIVE'),
      active: loc.active !== undefined ? loc.active : (loc.status === 'Active' || loc.status === 'ACTIVE'),
      totalCabinets: loc.totalCabinets || loc.cabinetsCount || loc.cabinetCount || (Array.isArray(loc.cabinets) ? loc.cabinets.length : 0) || 0,
      totalHooks: loc.totalHooks || loc.hooksCount || loc.hooks || loc.slotCount || 0,
      contactNumber: loc.contactNumber || loc.phone || '',
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
    if (status === 'Active' || status === 'ACTIVE') {
      return 'bg-emerald-50 text-emerald-600';
    }
    if (status === 'Inactive' || status === 'INACTIVE') {
      return 'bg-rose-50 text-rose-600';
    }
    if (status === 'Under Maintenance' || status === 'MAINTENANCE') {
      return 'bg-amber-50 text-amber-600';
    }
    return 'bg-slate-100 text-slate-600';
  }

  getLocationStatus(loc: any): string {
    return loc.status || (loc.active ? 'Active' : 'Inactive') || '—';
  }

  getLocationStatusDot(loc: any): string {
    const status = this.getLocationStatus(loc);
    if (status === 'Active' || status === 'ACTIVE') return 'bg-emerald-500';
    if (status === 'Inactive' || status === 'INACTIVE') return 'bg-rose-500';
    if (status === 'Under Maintenance' || status === 'MAINTENANCE') return 'bg-amber-500';
    return 'bg-slate-400';
  }

  private getFallbackLocations(): any[] {
    return [
      { id: 'LOC-001', code: 'LOC-001', name: 'Head Office Safe Room', siteName: 'Head Office', address: '123 Security Way, London, SW1A 1AA', responsiblePerson: 'John Smith', responsiblePersonTitle: 'Facilities Manager', contactNumber: '+44 7123 456789', status: 'Active', active: true, totalCabinets: 6, totalHooks: 248 },
      { id: 'LOC-002', code: 'LOC-002', name: 'Manchester Branch Store', siteName: 'Manchester Branch', address: '10 King Street, Manchester, M2 4WU', responsiblePerson: 'Sarah Johnson', responsiblePersonTitle: 'Branch Manager', contactNumber: '+44 7234 567890', status: 'Active', active: true, totalCabinets: 4, totalHooks: 160 },
      { id: 'LOC-003', code: 'LOC-003', name: 'Birmingham Operations Room', siteName: 'Birmingham Office', address: '45 Colmore Row, Birmingham, B3 2BH', responsiblePerson: 'David Williams', responsiblePersonTitle: 'Operations Lead', contactNumber: '+44 121 555 1234', status: 'Active', active: true, totalCabinets: 3, totalHooks: 96 },
      { id: 'LOC-004', code: 'LOC-004', name: 'Mobile Key Van 1', siteName: 'Mobile Unit', address: 'N/A (Mobile Unit)', responsiblePerson: 'Michael Brown', responsiblePersonTitle: 'Van Supervisor', contactNumber: '+44 7345 678901', status: 'Under Maintenance', active: false, totalCabinets: 2, totalHooks: 40 },
      { id: 'LOC-005', code: 'LOC-005', name: 'Security Control Room', siteName: 'Head Office', address: '123 Security Way, London, SW1A 1AA', responsiblePerson: 'John Smith', responsiblePersonTitle: 'Facilities Manager', contactNumber: '+44 7123 456789', status: 'Active', active: true, totalCabinets: 2, totalHooks: 80 },
      { id: 'LOC-006', code: 'LOC-006', name: 'Leeds Branch Store', siteName: 'Leeds Branch', address: '78 Boar Lane, Leeds, LS1 6HW', responsiblePerson: 'Emma Taylor', responsiblePersonTitle: 'Branch Manager', contactNumber: '+44 113 555 7890', status: 'Inactive', active: false, totalCabinets: 0, totalHooks: 0 },
    ];
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '—';
    const date = new Date(value);
    if (isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
