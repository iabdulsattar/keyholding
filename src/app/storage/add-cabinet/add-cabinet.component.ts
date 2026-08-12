import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { KeyVaultService, Cabinet } from '../../core/services/keyvault.service';
import { RichSelectComponent, RichSelectOption } from '../../shared/components/form/rich-select/rich-select.component';
import { DatePickerComponent } from '../../shared/components/form/date-picker/date-picker.component';

interface StorageLocation {
  id: string;
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
  editMode = false;
  cabinetId = '';
  originalTotalHooks = 0;
  saving = false;

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

  get numberOfHooksMin(): number {
    return this.editMode ? this.originalTotalHooks : 1;
  }

  constructor(private keyVault: KeyVaultService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.cabinetId = this.route.snapshot.paramMap.get('id') || this.route.snapshot.queryParamMap.get('editId') || '';
    this.editMode = !!this.cabinetId;
    if (this.editMode) {
      this.loadCabinet();
    } else {
      this.loadStorageLocations();
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

  private loadCabinet(): void {
    this.loading = true;
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id') || '';
    if (!orgId || !this.cabinetId) {
      this.loading = false;
      this.createIcons();
      return;
    }
    this.keyVault.getCabinet(orgId, this.cabinetId).subscribe({
      next: (res: any) => {
        const item = res?.data ?? res ?? {};
        this.storageLocationId = item.storageLocationId || item.storageLocation?.id || '';
        this.cabinetName = item.name || item.cabinetName || '';
        this.cabinetType = item.cabinetType || item.type || '';
        this.securityLevel = item.securityLevel || '';
        this.description = item.description || '';
        this.numberOfHooks = item.numberOfHooks || item.totalHooks || 20;
        this.originalTotalHooks = this.numberOfHooks;
        this.fireRating = item.fireRating || '';
        this.cctvMonitored = item.cctvMonitored ?? true;
        this.alarmSystem = item.alarmSystem ?? true;
        this.responsiblePerson = item.responsiblePerson || item.installedBy || '';
        this.notes = item.notes || '';
        this.installedOn = item.installedOn || '';
        this.loading = false;
        this.createIcons();
      },
      error: () => {
        this.loading = false;
        this.createIcons();
      }
    });
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
      next: (res: any) => {
        const data = res?.data ?? res ?? {};
        const locations = data.content ?? data.items ?? data.data ?? data ?? [];
        this.storageLocations = locations.map((loc: any) => ({
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
    if (this.submitted && (!this.numberOfHooks || this.numberOfHooks < this.numberOfHooksMin)) {
      return true;
    }
    return false;
  }

  get securityLevelInvalid(): boolean {
    return this.submitted && !this.securityLevel;
  }

  get installedOnInvalid(): boolean {
    return this.submitted && !this.installedOn.trim();
  }

  get formInvalid(): boolean {
    return !this.storageLocationId || !this.cabinetName.trim() || !this.cabinetType || !this.numberOfHooks || this.numberOfHooks < this.numberOfHooksMin || !this.securityLevel || !this.installedOn.trim();
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

    this.saving = true;
    const request = this.editMode
      ? this.keyVault.updateCabinet(orgId, this.cabinetId, cabinet)
      : this.keyVault.createCabinet(orgId, cabinet);

    request.subscribe({
      next: (res: any) => {
        const hooksChanged = !this.editMode || this.numberOfHooks !== this.originalTotalHooks;
        if (this.numberOfHooks > 0 && hooksChanged) {
          const newCabinetId = this.editMode ? this.cabinetId : (res?.data?.id || res?.id || '');
          if (newCabinetId) {
            this.keyVault.autoGenerateHooks(orgId, newCabinetId, this.numberOfHooks).subscribe({
              next: () => {
                this.router.navigate(['/storage/locations/cabinets']);
              },
              error: () => {
                this.router.navigate(['/storage/locations/cabinets']);
              }
            });
          } else {
            this.router.navigate(['/storage/locations/cabinets']);
          }
        } else {
          this.router.navigate(['/storage/locations/cabinets']);
        }
      },
      error: () => {
        this.saving = false;
      }
    });
  }
}
