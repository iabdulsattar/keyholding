import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { KeyVaultService } from '../../core/services/keyvault.service';
import { RichSelectComponent, RichSelectOption } from '../../shared/components/form/rich-select/rich-select.component';

@Component({
  selector: 'app-reactivate-storage-location',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, RichSelectComponent],
  templateUrl: './reactivate-storage-location.component.html',
})
export class ReactivateStorageLocationComponent implements OnInit, AfterViewInit {
  locationId = '';
  location: any = null;
  loading = true;
  error = '';
  reactivating = false;
  reactivateReason = '';
  submitted = false;
  reactivateReasonOptions: RichSelectOption[] = [
    { value: 'Location back in service', label: 'Location back in service' },
    { value: 'Renovation complete', label: 'Renovation complete' },
    { value: 'Security requirements met', label: 'Security requirements met' },
    { value: 'Other', label: 'Other' },
  ];

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

  private loadLocation(): void {
    this.loading = true;
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id') || '';
    if (!orgId) {
      this.location = this.getFallbackLocation();
      this.loading = false;
      this.createIcons();
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
          totalCabinets: item.totalCabinets || 0,
          totalHooks: item.totalHooks || 0,
          keysInStorage: item.keysInStorage || 0,
          availableHooks: item.availableHooks || 0,
          outOfOrderHooks: item.outOfOrderHooks || 0,
          cctvMonitored: item.cctvMonitored ?? true,
          alarmSystem: item.alarmSystem ?? true,
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
      name: 'Head Office Vault',
      siteName: 'Head Office',
      address: '25 Fenchurch Street, London, EC3M 5BN, UK',
      city: 'London',
      postcode: 'EC3M 5BN',
      country: 'United Kingdom',
      responsiblePerson: 'James Walker',
      responsiblePersonTitle: 'Facilities Manager',
      contactNumber: '+44 020 7946 0958',
      locationType: 'Safe Room',
      accessInstructions: 'Access is restricted to authorized personnel only.',
      status: 'INACTIVE',
      totalCabinets: 6,
      totalHooks: 248,
      keysInStorage: 186,
      availableHooks: 62,
      outOfOrderHooks: 0,
      cctvMonitored: true,
      alarmSystem: true,
    };
  }

  onCancel(): void {
    this.router.navigate(['/storage/locations']);
  }

  confirmReactivate(): void {
    this.submitted = true;
    if (!this.reactivateReason || !this.location) return;
    if (!this.locationId) return;
    this.reactivating = true;
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id') || '';
    if (!orgId) {
      this.router.navigate(['/storage/locations']);
      return;
    }
    this.keyVault.reactivateStorageLocation(orgId, this.locationId).subscribe({
      next: () => {
        this.location.status = 'ACTIVE';
        this.reactivating = false;
        this.createIcons();
        this.router.navigate(['/storage/locations']);
      },
      error: () => {
        this.reactivating = false;
        this.createIcons();
      }
    });
  }

  get reactivateReasonInvalid(): boolean {
    return this.submitted && !this.reactivateReason;
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '—';
    const date = new Date(value);
    if (isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
