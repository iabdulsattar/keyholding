import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { KeyVaultService } from '../../core/services/keyvault.service';
import { RichSelectComponent, RichSelectOption } from '../../shared/components/form/rich-select/rich-select.component';

interface SiteBuilding {
  id: string;
  name: string;
}

@Component({
  selector: 'app-add-storage-location',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, RichSelectComponent],
  templateUrl: './add-storage-location.component.html',
})
export class AddStorageLocationComponent implements OnInit, AfterViewInit {
  loading = true;
  saving = false;

  siteBuildings: SiteBuilding[] = [];

  locationName = '';
  siteId = '';
  locationType = '';
  address = '';
  city = '';
  postcode = '';
  country = 'United Kingdom';
  responsiblePerson = '';
  contactNumber = '';
  accessInstructions = '';
  description = '';
  status = 'ACTIVE';

  locationTypeOptions: RichSelectOption[] = [
    { value: '', label: 'Select location type' },
    { value: 'Safe Room', label: 'Safe Room' },
    { value: 'Store Room', label: 'Store Room' },
    { value: 'Mobile Unit', label: 'Mobile Unit' },
    { value: 'Branch Office', label: 'Branch Office' },
  ];
  countryOptions: RichSelectOption[] = [
    { value: '', label: 'Select country' },
    { value: 'United Kingdom', label: 'United Kingdom' },
    { value: 'United States', label: 'United States' },
    { value: 'Pakistan', label: 'Pakistan' },
  ];

  get siteBuildingOptions(): RichSelectOption[] {
    return [{ value: '', label: 'Select site or building (if applicable)' }, ...this.siteBuildings.map(sb => ({ value: sb.id, label: sb.name }))];
  }

  constructor(private keyVault: KeyVaultService, private router: Router) {}

  ngOnInit(): void {
    this.loadSiteBuildings();
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

  private getOrgId(): string {
    return localStorage.getItem('organizationId') || localStorage.getItem('org_id') || '';
  }

  private loadSiteBuildings(): void {
    const orgId = this.getOrgId();
    if (!orgId) {
      this.loading = false;
      this.createIcons();
      return;
    }
    this.keyVault.listAllSites(orgId, { page: 0, size: 100 }).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res ?? {};
        const items = data.content ?? data.items ?? data.data ?? data ?? [];
        this.siteBuildings = items.map((s: any) => ({
          id: s.id || s.siteId || '',
          name: s.name || s.siteName || s.buildingName || '',
        }));
        this.loading = false;
        this.createIcons();
      },
      error: () => {
        this.siteBuildings = [
          { id: '', name: 'Head Office' },
          { id: '', name: 'Manchester Branch' },
          { id: '', name: 'Birmingham Office' },
        ];
        this.loading = false;
        this.createIcons();
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/storage/locations']);
  }

  onSave(): void {
    if (this.saving) return;
    const orgId = this.getOrgId();
    if (!orgId || !this.locationName.trim()) return;

    this.saving = true;
    const payload = {
      name: this.locationName,
      siteId: this.siteId || undefined,
      locationType: this.locationType || undefined,
      address: this.address,
      city: this.city,
      postcode: this.postcode,
      country: this.country,
      responsiblePerson: this.responsiblePerson || undefined,
      contactNumber: this.contactNumber || undefined,
      accessInstructions: this.accessInstructions || undefined,
      description: this.description || undefined,
      status: this.status,
    };

    this.keyVault.createStorageLocation(orgId, payload as any).subscribe({
      next: () => {
        this.saving = false;
        this.createIcons();
        this.router.navigate(['/storage/locations']);
      },
      error: () => {
        this.saving = false;
        this.createIcons();
      }
    });
  }
}
