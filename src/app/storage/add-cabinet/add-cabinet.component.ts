import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { KeyVaultService } from '../../core/services/keyvault.service';
import { RichSelectComponent, RichSelectOption } from '../../shared/components/form/rich-select/rich-select.component';

interface StorageLocation {
  id: string;
  code: string;
  name: string;
}

@Component({
  selector: 'app-add-cabinet',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, RichSelectComponent],
  templateUrl: './add-cabinet.component.html',
})
export class AddCabinetComponent implements OnInit, AfterViewInit {
  loading = true;
  storageLocations: StorageLocation[] = [];

  storageLocationId = '';
  cabinetName = '';
  cabinetType = '';
  description = '';
  numberOfHooks = 20;
  fireRating = '';
  cctvMonitored = true;
  alarmSystem = true;
  responsiblePerson = '';
  notes = '';

  cabinetTypeOptions: RichSelectOption[] = [
    { value: '', label: 'Select cabinet type' },
    { value: 'Standard', label: 'Standard' },
    { value: 'Fire Rated', label: 'Fire Rated' },
    { value: 'High Security', label: 'High Security' },
  ];
  securityLevelOptions: RichSelectOption[] = [
    { value: '', label: 'Select security level' },
    { value: 'Standard', label: 'Standard' },
    { value: 'High', label: 'High' },
  ];
  fireRatingOptions: RichSelectOption[] = [
    { value: '', label: 'Select fire rating' },
    { value: '30 min', label: '30 min' },
    { value: '60 min', label: '60 min' },
    { value: '120 min', label: '120 min' },
  ];

  get storageLocationOptions(): RichSelectOption[] {
    return [{ value: '', label: 'Select storage location' }, ...this.storageLocations.map(loc => ({ value: loc.id, label: `${loc.name} (${loc.code})` }))];
  }

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
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id') || '';
    if (!orgId) {
      this.loading = false;
      this.createIcons();
      return;
    }
    this.keyVault.listCatalogStorageLocations(orgId, false).subscribe({
      next: (locations: any[]) => {
        this.storageLocations = locations.map(loc => ({
          id: loc.id || loc.code || '',
          code: loc.code || '',
          name: loc.name || loc.locationName || '',
        }));
        this.loading = false;
        this.createIcons();
      },
      error: () => {
        this.storageLocations = [
          { id: '1', code: 'LOC-0001', name: 'Head Office Vault' },
          { id: '2', code: 'LOC-0002', name: 'Manchester Branch' },
        ];
        this.loading = false;
        this.createIcons();
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/storage/locations/cabinets']);
  }

  onSaveCabinet(): void {
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id') || '';
    if (!orgId || !this.storageLocationId || !this.cabinetName) return;

    const cabinet = {
      storageLocationId: this.storageLocationId,
      name: this.cabinetName,
      cabinetType: this.cabinetType,
      description: this.description,
      numberOfHooks: this.numberOfHooks,
      fireRating: this.fireRating,
      cctvMonitored: this.cctvMonitored,
      alarmSystem: this.alarmSystem,
      responsiblePerson: this.responsiblePerson,
      notes: this.notes,
    };

    this.keyVault.createCabinet(orgId, cabinet).subscribe({
      next: () => {
        this.router.navigate(['/storage/locations/cabinets']);
      },
      error: () => {
        this.router.navigate(['/storage/locations/cabinets']);
      }
    });
  }
}
