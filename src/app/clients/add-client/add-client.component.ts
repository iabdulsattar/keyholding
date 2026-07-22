import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ClientService, Client } from '../../core/services/client.service';
import { InputFieldComponent } from '../../shared/components/form/input/input-field.component';
import { LabelComponent } from '../../shared/components/form/label/label.component';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-add-client',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    InputFieldComponent,
    LabelComponent,
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

  showRegionDropdown = false;
  showIndustryDropdown = false;

  regions = ['North Region', 'Central Region', 'West Region', 'East Region', 'South Region'];
  industries = ['Security Services', 'Commercial Property', 'Logistics & Fleet', 'Corporate Offices', 'Retail Banking'];

  loading = false;

  constructor(
    private router: Router,
    private clientService: ClientService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.generateClientCode();
  }

  private generateClientCode(): void {
    this.clientCode = `CLT-${String(Math.floor(1000 + Math.random() * 9000)).padStart(4, '0')}`;
  }

  copyClientCode(): void {
    navigator.clipboard.writeText(this.clientCode).then(() => {
      this.toast.success('Client code copied to clipboard!');
    });
  }

  toggleRegionDropdown(): void {
    this.showRegionDropdown = !this.showRegionDropdown;
    this.showIndustryDropdown = false;
  }

  toggleIndustryDropdown(): void {
    this.showIndustryDropdown = !this.showIndustryDropdown;
    this.showRegionDropdown = false;
  }

  selectRegion(value: string): void {
    this.region = value;
    this.showRegionDropdown = false;
  }

  selectIndustry(value: string): void {
    this.industry = value;
    this.showIndustryDropdown = false;
  }

  closeDropdowns(): void {
    this.showRegionDropdown = false;
    this.showIndustryDropdown = false;
  }

  setStatus(status: 'active' | 'inactive'): void {
    this.status = status;
  }

  validate(): boolean {
    const requiredFields = [
      { field: this.clientName, name: 'Client Name' },
      { field: this.email, name: 'Email' },
      { field: this.region, name: 'Region' },
    ];

    const missing = requiredFields.filter(f => !f.field || f.field.toString().trim() === '');

    if (missing.length > 0) {
      this.toast.error(`Missing required fields: ${missing.map(m => m.name).join(', ')}`);
      return false;
    }

    return true;
  }

  onSubmit(): void {
    if (!this.validate()) return;

    this.loading = true;

    const newClient: Client = {
      id: this.clientCode,
      code: this.clientCode,
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

    this.clientService.createClient(newClient).subscribe({
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

  cancel(): void {
    this.router.navigate(['/clients']);
  }
}
