import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { KeyVaultService } from '../../core/services/keyvault.service';

interface SiteBuilding {
  id: string;
  name: string;
}

@Component({
  selector: 'app-edit-storage-location',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './edit-storage-location.component.html',
})
export class EditStorageLocationComponent implements OnInit, AfterViewInit {
  loading = true;
  saving = false;

  locationId = '';

  siteBuildings: SiteBuilding[] = [];

  locationName = '';
  locationCode = '';
  siteId = '';
  locationType = '';
  address = '';
  city = '';
  postcode = '';
  country = '';
  responsiblePerson = '';
  contactNumber = '';
  accessInstructions = '';
  description = '';
  status = 'ACTIVE';

  constructor(
    private keyVault: KeyVaultService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  private getOrgId(): string {
    return localStorage.getItem('organizationId') || localStorage.getItem('org_id') || '';
  }

  ngOnInit(): void {
    this.locationId = this.route.snapshot.paramMap.get('id') || '';
    this.loadSiteBuildings();
    if (this.locationId) {
      this.loadStorageLocation();
    } else {
      this.loading = false;
      this.createIcons();
      this.router.navigate(['/storage/locations']);
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

  private loadSiteBuildings(): void {
    const orgId = this.getOrgId();
    if (!orgId) return;
    this.keyVault.listAllSites(orgId, { page: 0, size: 100 }).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res ?? {};
        const items = data.content ?? data.items ?? data.data ?? data ?? [];
        this.siteBuildings = items.map((s: any) => ({
          id: s.id || s.siteId || '',
          name: s.name || s.siteName || s.buildingName || '',
        }));
      },
      error: () => {
        this.siteBuildings = [
          { id: '', name: 'Head Office' },
          { id: '', name: 'Manchester Branch' },
          { id: '', name: 'Birmingham Office' },
        ];
      }
    });
  }

  private loadStorageLocation(): void {
    const orgId = this.getOrgId();
    if (!orgId || !this.locationId) {
      this.loading = false;
      this.createIcons();
      return;
    }
    this.keyVault.getStorageLocation(orgId, this.locationId).subscribe({
      next: (res: any) => {
        const loc = res?.data ?? res ?? {};
        this.locationName = loc.name || '';
        this.locationCode = loc.code || '';
        this.siteId = loc.siteId || loc.siteId?.id || '';
        this.locationType = loc.locationType || '';
        this.address = loc.address || '';
        this.city = loc.city || '';
        this.postcode = loc.postcode || '';
        this.country = loc.country || '';
        this.responsiblePerson = loc.responsiblePerson || '';
        this.contactNumber = loc.contactNumber || '';
        this.accessInstructions = loc.accessInstructions || '';
        this.description = loc.description || '';
        this.status = loc.status || 'ACTIVE';
        this.loading = false;
        this.createIcons();
      },
      error: () => {
        this.loading = false;
        this.createIcons();
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/storage/locations']);
  }

  onSave(): void {
    if (this.saving || !this.locationId) return;
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

    this.keyVault.updateStorageLocation(orgId, this.locationId, payload as any).subscribe({
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
