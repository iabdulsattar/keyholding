import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { KeyVaultService, Cabinet } from '../../core/services/keyvault.service';
import { RichSelectComponent, RichSelectOption } from '../../shared/components/form/rich-select/rich-select.component';
import { DatePickerComponent } from '../../shared/components/form/date-picker/date-picker.component';

interface StorageLocation {
  id: string;
  code: string;
  name: string;
}

@Component({
  selector: 'app-add-cabinet',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, RichSelectComponent, DatePickerComponent],
  templateUrl: './add-cabinet.component.html',
})
export class AddCabinetComponent implements OnInit, AfterViewInit {
  loading = true;
  storageLocations: StorageLocation[] = [];

  storageLocationId = '';
  cabinetName = '';
  cabinetType = '';
  securityLevel = '';
  description = '';
  numberOfHooks = 20;
  fireRating = '';
  cctvMonitored = true;
  alarmSystem = true;
  responsiblePerson = '';
  notes = '';
  installedOn = '';

  submitted = false;

  cabinetTypeOptions: RichSelectOption[] = [
    { value: '', label: 'Select cabinet type' },
    { value: 'Standard', label: 'Standard' },
    { value: 'Fire Rated', label: 'Fire Rated' },
    { value: 'High Security', label: 'High Security' },
  ];
  securityLevelOptions: RichSelectOption[] = [
    { value: '', label: 'Select security level' },
    { value: 'LOW', label: 'Standard' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
    { value: 'TOP_SECRET', label: 'Top Secret' },
  ];
  fireRatingOptions: RichSelectOption[] = [
    { value: '', label: 'Select fire rating' },
    { value: '30 min', label: '30 min' },
    { value: '60 min', label: '60 min' },
    { value: '120 min', label: '120 min' },
  ];

  get storageLocationOptions(): RichSelectOption[] {
    return [{ value: '', label: 'Select storage location' }, ...this.storageLocations.map(loc => ({ value: loc.id, label: loc.name }))];
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
      this.storageLocations = [];
      this.loading = false;
      this.createIcons();
      return;
    }
    this.keyVault.listStorageLocations(orgId).subscribe({
      next: (locations: any[]) => {
        this.storageLocations = locations.map(loc => ({
          id: loc.id || '',
          name: loc.name || loc.locationName || '',
        }));
        this.loading = false;
        this.createIcons();
      },
      error: () => {
        this.storageLocations = [];
        this.loading = false;
        this.createIcons();
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/storage/locations/cabinets']);
  }

  onInstalledOnChange(event: any): void {
    this.installedOn = event?.dateStr || '';
  }

  get storageLocationIdInvalid(): boolean {
    return this.submitted && !this.storageLocationId;
  }

  get cabinetNameInvalid(): boolean {
    return this.submitted && !this.cabinetName.trim();
  }

  get cabinetTypeInvalid(): boolean {
    return this.submitted && !this.cabinetType;
  }

  get numberOfHooksInvalid(): boolean {
    return this.submitted && (!this.numberOfHooks || this.numberOfHooks < 1);
  }

  get securityLevelInvalid(): boolean {
    return this.submitted && !this.securityLevel;
  }

  get installedOnInvalid(): boolean {
    return this.submitted && !this.installedOn.trim();
  }

  get formInvalid(): boolean {
    return !this.storageLocationId || !this.cabinetName.trim() || !this.cabinetType || !this.numberOfHooks || this.numberOfHooks < 1 || !this.securityLevel || !this.installedOn.trim();
  }

  onSaveCabinet(): void {
    this.submitted = true;
    if (this.formInvalid) return;

    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id') || '';
    if (!orgId || !this.storageLocationId || !this.cabinetName) return;

    const cabinet = {
      storageLocationId: this.storageLocationId,
      name: this.cabinetName,
      cabinetType: this.cabinetType,
      securityLevel: this.securityLevel as Cabinet['securityLevel'],
      description: this.description,
      numberOfHooks: this.numberOfHooks,
      fireRating: this.fireRating,
      cctvMonitored: this.cctvMonitored,
      alarmSystem: this.alarmSystem,
      responsiblePerson: this.responsiblePerson,
      notes: this.notes,
      installedOn: this.installedOn,
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
