import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { KeyVaultService } from '../../core/services/keyvault.service';

@Component({
  selector: 'app-storage-location-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './storage-location-detail.component.html',
})
export class StorageLocationDetailComponent implements OnInit, AfterViewInit {
  locationId = '';
  location: any = null;
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private keyVault: KeyVaultService
  ) {}

  ngOnInit(): void {
    this.locationId = this.route.snapshot.paramMap.get('id') || '';
    if (this.locationId) {
      this.loadLocation();
    } else {
      this.loading = false;
      this.error = 'No storage location ID provided.';
    }
  }

  private loadLocation(): void {
    this.loading = true;
    this.error = '';
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id') || '';
    if (!orgId) {
      this.error = 'No organization found.';
      this.loading = false;
      return;
    }
    this.keyVault.getStorageLocation(orgId, this.locationId).subscribe({
      next: (res: any) => {
        const item = res?.data ?? res ?? {};
        this.location = {
          id: item.id || '',
          code: item.code || '',
          name: item.name || '',
          siteName: item.siteName || item.site || item.building || '',
          address: item.address || '',
          country: item.country || '',
          city: item.city || '',
          postcode: item.postcode || item.postalCode || item.zipCode || '',
          contactNumber: item.contactNumber || item.phone || '',
          status: item.status || (item.active ? 'Active' : 'Inactive') || '',
          isActive: item.active !== undefined ? item.active : (item.status === 'Active' || item.status === 'ACTIVE'),
          responsiblePerson: item.responsiblePerson || item.responsiblePersonName || '',
          responsiblePersonTitle: item.responsiblePersonTitle || '',
          locationType: item.locationType || '',
          createdBy: item.createdBy || item.createdByName || '',
          createdDate: item.createdDate || item.createdAt || '',
          updatedBy: item.updatedBy || item.lastUpdatedBy || '',
          updatedDate: item.updatedDate || item.updatedAt || '',
          totalCabinets: item.totalCabinets || item.cabinetsCount || item.cabinetCount || 0,
          totalHooks: item.totalHooks || item.hooksCount || item.hooks || item.slotCount || 0,
          keysInStorage: item.keysInStorage || item.keysCount || 0,
          availableHooks: item.availableHooks || item.availableSlots || 0,
          outOfOrderHooks: item.outOfOrderHooks || item.outOfOrder || 0,
          cabinets: item.cabinets || [],
        };
        this.loading = false;
        this.createIcons();
      },
      error: () => {
        this.location = this.getFallbackLocation();
        this.loading = false;
        this.createIcons();
      }
    });
  }

  private getFallbackLocation(): any {
    return {
      id: this.locationId,
      code: 'LOC-0001',
      name: 'Head Office Safe Room',
      siteName: 'Head Office',
      address: '123 Security Way, London, SW1A 1AA, United Kingdom',
      country: 'United Kingdom',
      city: 'London',
      postcode: 'SW1A 1AA',
      contactNumber: '+44 7123 456789',
      status: 'Active',
      isActive: true,
      responsiblePerson: 'John Smith',
      responsiblePersonTitle: 'Facilities Manager',
      locationType: 'Safe Room',
      createdBy: 'Faiza Ahmed',
      createdDate: '2025-04-14T10:30:00',
      updatedBy: 'Faiza Ahmed',
      updatedDate: '2025-04-18T14:15:00',
      totalCabinets: 6,
      totalHooks: 248,
      keysInStorage: 186,
      availableHooks: 62,
      outOfOrderHooks: 0,
      cabinets: [
        { code: 'CAB-A01', name: 'Cabinet A', type: 'Steel Key Cabinet', capacity: 50, hooks: 50, keysInStorage: 41 },
        { code: 'CAB-A02', name: 'Cabinet B', type: 'Steel Key Cabinet', capacity: 50, hooks: 50, keysInStorage: 37 },
        { code: 'CAB-A03', name: 'Cabinet C', type: 'Electronic Key Cabinet', capacity: 60, hooks: 60, keysInStorage: 49 },
      ],
    };
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

  onBack(): void {
    this.router.navigate(['/storage/locations']);
  }

  getStatusClass(status: string): string {
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

  formatDate(value: string | null | undefined): string {
    if (!value) return '—';
    const date = new Date(value);
    if (isNaN(date.getTime())) return String(value);
    const datePart = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const timePart = date.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' });
    return `${datePart}, ${timePart}`;
  }

  copyCode(): void {
    if (this.location?.code) {
      navigator.clipboard.writeText(this.location.code);
    }
  }
}
