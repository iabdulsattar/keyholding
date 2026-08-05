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
    { value: 'North Region', label: 'North Region' },
    { value: 'Central Region', label: 'Central Region' },
    { value: 'West Region', label: 'West Region' },
    { value: 'East Region', label: 'East Region' },
    { value: 'South Region', label: 'South Region' },
  ];

  industries: RichSelectOption[] = [
    { value: 'Security Services', label: 'Security Services' },
    { value: 'Commercial Property', label: 'Commercial Property' },
    { value: 'Logistics & Fleet', label: 'Logistics & Fleet' },
    { value: 'Corporate Offices', label: 'Corporate Offices' },
    { value: 'Retail Banking', label: 'Retail Banking' },
  ];

  loading = false;
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
      if (params['editId']) {
        this.editMode = true;
        this.editingClientId = params['editId'];
        this.loadClient(this.editingClientId as string);
      } else {
        this.editMode = false;
        this.editingClientId = null;
      }
    });
  }

  private loadClient(clientId: string): void {
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
    if (!orgId) return;
    this.clientService.getClientById(orgId, clientId).subscribe((client: Client | undefined) => {
      if (!client) return;
      this.clientCode = client.code;
      this.clientName = client.name;
      this.email = client.email;
      this.phone = client.phone || '';
      this.website = client.website || '';
      this.region = client.region;
      this.address = client.address || '';
      this.industry = client.industry || '';
      this.vatNumber = client.vatNumber || '';
      this.registrationNumber = client.registrationNumber || '';
      this.contactPerson = client.contactPerson || '';
      this.designation = client.designation || '';
      this.contactEmail = client.contactEmail || '';
      this.notes = client.notes || '';
      this.status = client.status === 'Active' ? 'active' : 'inactive';
    });
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
    if (!this.validate()) return;

    this.loading = true;

    const clientData: Client = {
      id: this.editMode ? (this.editingClientId || '') : '',
      code: this.editMode ? (this.clientCode || '') : '',
      name: this.clientName,
      email: this.email,
      region: this.region,
      status: this.status === 'active' ? 'Active' : 'Inactive',
      sites: 0,
      users: 0,
      created: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
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
    };

    if (this.editMode && this.editingClientId) {
      this.clientService.updateClient(this.editingClientId, clientData).subscribe({
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

  cancel(): void {
    this.router.navigate(['/clients']);
  }
}
