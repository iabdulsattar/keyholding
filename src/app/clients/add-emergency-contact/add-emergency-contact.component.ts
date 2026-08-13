import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientService, EmergencyContact } from '../../core/services/client.service';
import { ToastService } from '../../core/services/toast.service';
import { PageBreadcrumbComponent, BreadcrumbItem } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { RichSelectComponent, RichSelectOption } from '../../shared/components/form/rich-select/rich-select.component';

@Component({
  selector: 'app-add-emergency-contact',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PageBreadcrumbComponent, RichSelectComponent],
  templateUrl: './add-emergency-contact.component.html',
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
    select { appearance: none; background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 1rem center; background-size: 1rem; }
    .field-label { display: block; font-size: 0.875rem; font-weight: 600; color: #334155; margin-bottom: 0.375rem; }
    .field-label .text-rose-500 { color: #f43f5e; }
    .field-input { width: 100%; padding: 0.625rem 0.75rem; font-size: 0.875rem; line-height: 1.25rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; color: #1e293b; background-color: #fff; transition: border-color 0.15s, box-shadow 0.15s; }
    .field-input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
    .field-input::placeholder { color: #94a3b8; }
    .field-hint { font-size: 0.75rem; color: #62748e; font-weight: 500; margin-top: 0.25rem; }
    .btn-outline { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.5rem 1rem; font-size: 0.875rem; font-weight: 500; color: #475569; background-color: #fff; border: 1px solid #e2e8f0; border-radius: 0.5rem; cursor: pointer; transition: background-color 0.15s, color 0.15s; }
    .btn-outline:hover { background-color: #f8fafc; color: #1e293b; }
    .btn-primary { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.5rem 1rem; font-size: 0.875rem; font-weight: 600; color: #fff; background-color: #4338ca; border: 1px solid transparent; border-radius: 0.5rem; cursor: pointer; transition: background-color 0.15s; }
    .btn-primary:hover { background-color: #372da3; }
  `]
})
export class AddEmergencyContactComponent implements OnInit {
  clientId = '';
  clientName = 'Metro Security Services';
  contactId = '';

  firstName = '';
  lastName = '';
  email = '';
  phoneCountryCode = '+44';
  phone = '';
  department = '';
  availability = '';
  notifyFor = '';
  status = '';
  address = '';
  notes = '';

  departmentOptions: RichSelectOption[] = [
    { value: '', label: 'Select department' },
    { value: 'Operations', label: 'Operations' },
    { value: 'Administration', label: 'Administration' },
    { value: 'Finance', label: 'Finance' },
    { value: 'Human Resources', label: 'Human Resources' },
    { value: 'IT', label: 'IT' },
    { value: 'Sales', label: 'Sales' },
    { value: 'Support', label: 'Support' },
    { value: 'Compliance', label: 'Compliance' },
    { value: 'Other', label: 'Other' },
  ];
  availabilityOptions: RichSelectOption[] = [
    { value: '', label: 'Select availability' },
    { value: '24/7', label: '24/7' },
    { value: 'Business Hours', label: 'Business Hours' },
    { value: 'Evenings', label: 'Evenings' },
    { value: 'Weekends', label: 'Weekends' },
    { value: 'On Call', label: 'On Call' },
  ];
  statusOptions: RichSelectOption[] = [
    { value: '', label: 'Select Status' },
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
  ];
  notifyForOptions: RichSelectOption[] = [
    { value: '', label: 'Select notification type' },
    { value: 'All Emergencies', label: 'All Emergencies' },
    { value: 'Key Related', label: 'Key Related' },
    { value: 'Site Related', label: 'Site Related' },
    { value: 'Security Incidents', label: 'Security Incidents' },
    { value: 'Other', label: 'Other' },
  ];

  saving = false;
  touched = new Set<string>();
  submitted = false;

  get informationInvalid(): boolean {
    return this.submitted && (
      !this.firstName.trim() ||
      !this.lastName.trim() ||
      !this.email.trim()
    );
  }

  markTouched(field: string): void {
    this.touched.add(field);
  }

  get breadcrumbs(): BreadcrumbItem[] {
    return [
      { label: 'Client Management', link: '/clients' },
      { label: 'Clients', link: '/clients' },
      { label: this.clientName, link: ['/clients', this.clientId] },
      { label: 'Emergency Contacts' },
      { label: this.isEditMode ? 'Edit Emergency Contact' : 'Add Emergency Contact' }
    ];
  }

  constructor(private route: ActivatedRoute, private router: Router, private clientService: ClientService, private toast: ToastService) {}

  get isEditMode(): boolean {
    return !!this.contactId;
  }

   ngOnInit(): void {
    this.clientId = this.route.snapshot.paramMap.get('id') || '';
    this.contactId = this.route.snapshot.queryParamMap.get('contactId') || '';
    this.route.queryParams.subscribe(params => {
      const cid = params['contactId'] || '';
      if (cid && cid !== this.contactId) {
        this.contactId = cid;
        this.loadContact();
      }
    });

    if (this.contactId) {
      this.loadContact();
    }

    this.loadClientName();
  }

  private loadClientName(): void {
    if (!this.clientId) return;
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
    if (!orgId) return;
    this.clientService.getClientById(orgId, this.clientId).subscribe({
      next: (client) => {
        if (client?.name) {
          this.clientName = client.name;
        }
      },
      error: () => {}
    });
  }

  private loadContact(): void {
    if (!this.clientId || !this.contactId) return;
    this.clientService.getEmergencyContact(this.clientId, this.contactId).subscribe({
      next: (contact: EmergencyContact | undefined) => {
        if (contact) {
          this.firstName = contact.firstName || '';
          this.lastName = contact.lastName || '';
          this.email = contact.email || '';
          this.phoneCountryCode = contact.phoneCountryCode || '+44';
          this.phone = contact.phone || '';
          this.department = contact.department || '';
          this.availability = contact.availability || '';
          this.notifyFor = contact.notifyFor || '';
          this.status = contact.status || 'Active';
          this.address = contact.address || '';
          this.notes = contact.notes || '';
        }
      },
      error: () => {
        this.toast.error('Failed to load emergency contact');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/clients', this.clientId]);
  }

  cancel(): void {
    this.goBack();
  }

  saveContact(): void {
    if (this.saving) return;
    this.submitted = true;
    this.touched.add('firstName');
    this.touched.add('lastName');
    this.touched.add('email');
    this.touched.add('department');
    this.touched.add('phone');
    this.touched.add('availability');
    this.touched.add('status');

    if (!this.firstName.trim() || !this.lastName.trim()) {
      this.toast.error('First name and last name are required');
      return;
    }
    if (!this.email.trim()) {
      this.toast.error('Email address is required');
      return;
    }
    if (!this.department) {
      this.toast.error('Department is required');
      return;
    }
    if (!this.phone.trim()) {
      this.toast.error('Phone number is required');
      return;
    }
    if (!this.availability) {
      this.toast.error('Availability is required');
      return;
    }
    if (!this.status) {
      this.toast.error('Status is required');
      return;
    }

    this.saving = true;
    const contact: Partial<EmergencyContact> = {
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      phoneCountryCode: this.phoneCountryCode || undefined,
      phone: this.phone,
      department: this.department || undefined,
      availability: this.availability || undefined,
      primaryContact: false,
      status: this.status as 'Active' | 'Inactive' | 'ACTIVE' | 'INACTIVE',
      address: this.address || undefined,
      notes: this.notes || undefined,
      notifyFor: this.notifyFor || undefined,
    };

    const handleSuccess = () => {
      this.saving = false;
      this.toast.success(this.isEditMode ? 'Emergency contact updated successfully' : 'Emergency contact created successfully');
      this.router.navigate(['/clients', this.clientId]);
    };

    const handleError = () => {
      this.saving = false;
      this.toast.error(this.isEditMode ? 'Failed to update emergency contact' : 'Failed to create emergency contact');
    };

    if (this.isEditMode) {
      this.clientService.updateEmergencyContact(this.clientId, this.contactId, contact).subscribe({
        next: handleSuccess,
        error: handleError,
      });
    } else {
      this.clientService.createEmergencyContact(this.clientId, contact).subscribe({
        next: handleSuccess,
        error: handleError,
      });
    }
  }
}
