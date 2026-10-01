import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { ClientService, Client } from '../../core/services/client.service';
import { ToastService } from '../../core/services/toast.service';
import { RichSelectComponent } from '../../shared/components/form/rich-select/rich-select.component';
import { RichSelectOption } from '../../shared/components/form/rich-select/rich-select.component';

@Component({
  selector: 'app-add-client',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    RichSelectComponent,
  ],
  templateUrl: './add-client.component.html',
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  `]
})
export class AddClientComponent implements OnInit {
  clientCode = '';
  clientName = '';
  email = '';
  phone = '';
  website = '';
  region = '';
  address = '';
  industry = '';
  vatNumber = '';
  registrationNumber = '';
  contactPerson = '';
  designation = '';
  contactEmail = '';
  notes = '';
  status: 'active' | 'inactive' = 'active';

  regions: RichSelectOption[] = [
    { value: '', label: 'Select region' },
    
    { value: 'North Region', label: 'North Region' },
    { value: 'Central Region', label: 'Central Region' },
    { value: 'West Region', label: 'West Region' },
    { value: 'East Region', label: 'East Region' },
    { value: 'South Region', label: 'South Region' },
  ];

  industries: RichSelectOption[] = [
    { value: '', label: 'Select industry' },
    
    { value: 'Security Services', label: 'Security Services' },
    { value: 'Commercial Property', label: 'Commercial Property' },
  ];

  loading = false;
  loadingClient = false;
  loadError = '';
  /** Id confirmed by the single-client endpoint, used for the update call. */
  loadedId: string | null = null;
  /** Full record as returned by the API, so untouched fields survive an update. */
  original: Client | null = null;
  editMode = false;
  editingClientId: string | null = null;
  submitted = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private clientService: ClientService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const editId = params['editId'];
      if (editId) {
        this.editMode = true;
        this.editingClientId = editId;
        // The form is filled only from the single-client endpoint; nothing is
        // carried over from the list row or the client detail view.
        this.loadClient(editId);
      } else {
        this.editMode = false;
        this.editingClientId = null;
      }
    });
  }

  private getOrgId(): string | null {
    const remember = localStorage.getItem('remember_device');
    if (remember === 'true') {
      return localStorage.getItem('org_id') || localStorage.getItem('organizationId') || null;
    }
    return sessionStorage.getItem('org_id') || sessionStorage.getItem('organizationId')
      || localStorage.getItem('org_id') || localStorage.getItem('organizationId') || null;
  }

  private loadClient(clientId: string): void {
    const orgId = this.getOrgId();
    if (!orgId) {
      this.loadError = 'Organization not found.';
      this.loadingClient = false;
      return;
    }

    this.loadingClient = true;
    this.loadError = '';
    this.clientService.getClientById(orgId, clientId).subscribe({
      next: (client: Client | undefined) => {
        this.loadingClient = false;
        if (!client) {
          this.loadError = 'Client not found.';
          return;
        }
        this.clientCode = client.code || '';
        this.clientName = client.name || '';
        this.email = client.email || '';
        this.phone = client.phone || '';
        this.website = client.website || '';
        this.region = this.regionLabel(client.region);
        this.address = client.address || '';
        this.industry = client.industry || '';
        this.vatNumber = client.vatNumber || '';
        this.registrationNumber = client.registrationNumber || '';
        this.contactPerson = client.contactPerson || '';
        this.designation = client.designation || '';
        this.contactEmail = client.contactEmail || '';
        this.notes = client.notes || '';
        this.status = this.toStatus(client.status);
        this.loadedId = client.id || clientId;
        this.original = client;
      },
      error: () => {
        this.loadingClient = false;
        this.loadError = 'Failed to load client details.';
      }
    });
  }

  /** The region may arrive as a plain string or as an object with a name. */
  private regionLabel(region: any): string {
    if (!region) return '';
    if (typeof region === 'string') return region;
    return region.name || region.label || region.regionName || '';
  }

  /** `ACTIVE` / `Active` / `true` all mean active; anything else is inactive. */
  private toStatus(status: any): 'active' | 'inactive' {
    if (typeof status === 'string') {
      const value = status.trim().toUpperCase();
      if (value === 'ACTIVE' || value === 'TRUE') return 'active';
      if (value === 'INACTIVE' || value === 'FALSE' || value === 'VOID') return 'inactive';
      return 'active';
    }
    return status === true ? 'active' : 'inactive';
  }

  sectionErrors: { information: string[]; details: string[]; status: string[] } = {
    information: [],
    details: [],
    status: []
  };
  touched = new Set<string>();

  isSectionValid(section: keyof AddClientComponent['sectionErrors']): boolean {
    return (this.sectionErrors[section] || []).length === 0;
  }

  markTouched(field: string) {
    this.touched.add(field);
  }

  setStatus(status: 'active' | 'inactive'): void {
    this.status = status;
  }

  validate(): boolean {
    const errors: { information: string[]; details: string[]; status: string[] } = {
      information: [],
      details: [],
      status: []
    };

    this.submitted = true;

    this.touched.add('clientName');
    this.touched.add('email');
    this.touched.add('region');

    if (!this.clientName.trim()) errors.information.push('Client Name is required');
    if (!this.email.trim()) errors.information.push('Email is required');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) errors.information.push('Enter a valid email address');
    if (!this.region) errors.information.push('Region is required');
    this.sectionErrors = errors;
    return errors.information.length === 0 && errors.details.length === 0 && errors.status.length === 0;
  }

  get informationInvalid(): boolean {
    return !this.isSectionValid('information');
  }
  get detailsInvalid(): boolean {
    return !this.isSectionValid('details');
  }
  get statusInvalid(): boolean {
    return !this.isSectionValid('status');
  }

  onSubmit(): void {
    // `loading` is only set once the form is valid, so a second click landing
    // before that point would otherwise post a duplicate client.
    if (this.loading) return;
    // Saving while the API response is still in flight would post the blank
    // form over the real client record.
    if (this.editMode && (this.loadingClient || this.loadError)) return;
    if (!this.validate()) return;

    this.loading = true;

    const clientData = this.buildPayload();

    const targetId = this.loadedId || this.editingClientId;
    if (this.editMode && targetId) {
      this.clientService.updateClient(targetId, clientData).subscribe({
        next: () => {
          this.loading = false;
          this.toast.success('Client updated successfully!');
          setTimeout(() => this.router.navigate(['/clients']), 800);
        },
        error: () => {
          this.loading = false;
          this.toast.error('Failed to update client. Please try again.');
        }
      });
    } else {
      this.clientService.createClient(clientData).subscribe({
        next: () => {
          this.loading = false;
          this.toast.success('Client saved successfully!');
          setTimeout(() => this.router.navigate(['/clients']), 800);
        },
        error: () => {
          this.loading = false;
          this.toast.error('Failed to save client. Please try again.');
        }
      });
    }
  }

  /**
   * On create the record is built from the form alone. On update it starts from
   * the record the single-client endpoint returned, so server-owned values
   * (`sites`, `users`, `created`, `createdBy`, `lastUpdated`, `updatedBy`) are
   * sent back unchanged instead of being reset by the form.
   */
  private buildPayload(): Client {
    const base: Partial<Client> = this.editMode && this.original ? { ...this.original } : {
      sites: 0,
      users: 0,
      created: new Date().toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' }),
    };

    return {
      ...base,
      id: this.editMode ? (this.loadedId || this.editingClientId || '') : '',
      code: this.editMode ? (this.clientCode || this.original?.code || '') : '',
      name: this.clientName,
      email: this.email,
      region: this.region,
      status: this.status === 'active' ? 'Active' : 'Inactive',
      phone: this.phone || undefined,
      website: this.website || undefined,
      address: this.address || undefined,
      industry: this.industry || undefined,
      vatNumber: this.vatNumber || undefined,
      registrationNumber: this.registrationNumber || undefined,
      contactPerson: this.contactPerson || undefined,
      designation: this.designation || undefined,
      contactEmail: this.contactEmail || undefined,
      notes: this.notes || undefined,
    } as Client;
  }

  cancel(): void {
    this.router.navigate(['/clients']);
  }
}
