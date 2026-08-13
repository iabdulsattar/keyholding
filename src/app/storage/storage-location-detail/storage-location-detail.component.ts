import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { KeyVaultService } from '../../core/services/keyvault.service';

@Component({
  selector: 'app-storage-location-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './storage-location-detail.component.html',
})
export class StorageLocationDetailComponent implements OnInit, AfterViewInit {
  locationId = '';
  location: any = null;
  loading = true;
  error = '';

  cabinetsPage = 1;
  cabinetsRowsPerPage = 8;
  cabinetsRowsPerPageOptions: number[] = [6, 8, 12, 24];

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
          code: item.locationCode || '',
          name: item.name || '',
          siteName: item.siteBuilding || item.siteName || '',
          address: item.address || '',
          city: item.city || '',
          postcode: item.postcode || '',
          country: item.country || '',
          responsiblePerson: item.responsiblePerson || '',
          responsiblePersonTitle: '',
          contactNumber: item.contactNumber || '',
          locationType: item.locationType || '',
          accessInstructions: item.accessInstructions || '',
          status: item.status || 'INACTIVE',
          isActive: item.status === 'ACTIVE',
          totalCabinets: item.totalCabinets || 0,
          totalHooks: item.totalHooks || 0,
          keysInStorage: item.keysInStorage || 0,
          availableHooks: item.availableHooks || 0,
          outOfOrderHooks: item.outOfOrderHooks || 0,
          cctvMonitored: item.cctvMonitored ?? true,
          alarmSystem: item.alarmSystem ?? true,
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

  getStatusDotClass(status: string): string {
    const s = (status || '').toUpperCase();
    if (s === 'ACTIVE') return 'bg-emerald-500';
    if (s === 'INACTIVE') return 'bg-rose-500';
    if (s.includes('MAINTENANCE') || s === 'UNDER MAINTENANCE') return 'bg-amber-500';
    return 'bg-slate-400';
  }

  get cabinetsPaginated(): any[] {
    const cabinets = this.location?.cabinets || [];
    const start = (this.cabinetsPage - 1) * this.cabinetsRowsPerPage;
    return cabinets.slice(start, start + this.cabinetsRowsPerPage);
  }

  get cabinetsTotalPages(): number {
    const cabinets = this.location?.cabinets || [];
    return Math.max(1, Math.ceil(cabinets.length / this.cabinetsRowsPerPage));
  }

  get cabinetsShowingStart(): number {
    const cabinets = this.location?.cabinets || [];
    return cabinets.length === 0 ? 0 : (this.cabinetsPage - 1) * this.cabinetsRowsPerPage + 1;
  }

  get cabinetsShowingEnd(): number {
    const cabinets = this.location?.cabinets || [];
    return Math.min(this.cabinetsPage * this.cabinetsRowsPerPage, cabinets.length);
  }

  get cabinetsVisiblePages(): (number | '...')[] {
    const pages: (number | '...')[] = [];
    const total = this.cabinetsTotalPages;
    const current = this.cabinetsPage;
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

  cabinetsPreviousPage(): void {
    if (this.cabinetsPage > 1) this.cabinetsPage--;
  }

  cabinetsNextPage(): void {
    if (this.cabinetsPage < this.cabinetsTotalPages) this.cabinetsPage++;
  }

  cabinetsGoToPage(page: number): void {
    if (page >= 1 && page <= this.cabinetsTotalPages) this.cabinetsPage = page;
  }

  onCabinetsRowsPerPageChange(size: string): void {
    this.cabinetsRowsPerPage = parseInt(size, 10) || 8;
    this.cabinetsPage = 1;
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
