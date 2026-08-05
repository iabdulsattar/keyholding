import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientService, ContactRecord } from '../../core/services/client.service';
import { ToastService } from '../../core/services/toast.service';
import { PageBreadcrumbComponent, BreadcrumbItem } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';

@Component({
  selector: 'app-add-contact',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PageBreadcrumbComponent],
  templateUrl: './add-contact.component.html',
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
    select { appearance: none; background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 1rem center; background-size: 1rem; }
    .field-label { display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 0.375rem; }
    .field-label .text-rose-500 { color: #f43f5e; }
    .field-input { width: 100%; padding: 0.625rem 0.75rem; font-size: 0.875rem; line-height: 1.25rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; color: #1e293b; background-color: #fff; transition: border-color 0.15s, box-shadow 0.15s; }
    .field-input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
    .field-input::placeholder { color: #94a3b8; }
    .field-hint { font-size: 0.75rem; color: #62748e; margin-top: 0.25rem; font-weight: 500}
    .btn-outline { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem 1rem; font-size: 0.875rem; font-weight: 500; color: #475569; background-color: #fff; border: 1px solid #e2e8f0; border-radius: 0.5rem; cursor: pointer; transition: background-color 0.15s, color 0.15s; }
    .btn-outline:hover { background-color: #f8fafc; color: #1e293b; }
    .btn-primary { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.5rem 1rem; font-size: 0.875rem; font-weight: 600; color: #fff; background-color: #155dfc; border: 1px solid transparent; border-radius: 0.5rem; cursor: pointer; transition: background-color 0.15s; }
    .btn-primary:hover { background-color: #155dfc; }
  `]
})
export class AddContactComponent implements OnInit {
  clientId = '';
  clientName = 'Metro Security Services';
  contactId = '';

  firstName = '';
  lastName = '';
  jobTitle = '';
  email = '';
  phone = '';
  department = '';
  primaryContact = true;
  status = 'Active';
  preferredContactMethod = 'Email';
  address = '';
  notes = '';

  saving = false;

  get breadcrumbs(): BreadcrumbItem[] {
    return [
      { label: 'Client Management', link: '/clients' },
      { label: 'Clients', link: '/clients' },
      { label: this.clientName, link: ['/clients', this.clientId] },
      { label: 'Contacts' },
      { label: this.isEditMode ? 'Edit Contact' : 'Add Contact' }
    ];
  }

  constructor(private route: ActivatedRoute, private router: Router, private clientService: ClientService, private toast: ToastService) {}

  get isEditMode(): boolean {
    return !!this.contactId;
  }

  ngOnInit(): void {
    this.clientId = this.route.snapshot.paramMap.get('id') || '';
    this.contactId = this.route.snapshot.queryParamMap.get('contactId') || '';
    this.loadClientName();

    if (this.contactId) {
      this.loadContact();
    }
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
    this.clientService.getContact(this.clientId, this.contactId).subscribe({
      next: (contact: ContactRecord | undefined) => {
        if (contact) {
          this.firstName = contact.firstName || '';
          this.lastName = contact.lastName || '';
          this.jobTitle = contact.jobTitle || '';
          this.email = contact.email || '';
          this.phone = contact.phone || '';
          this.department = contact.department || '';
          this.primaryContact = contact.primaryContact ?? false;
          this.status = contact.status || 'Active';
          this.preferredContactMethod = contact.preferredMethod || 'Email';
          this.address = contact.address || '';
          this.notes = contact.notes || '';
        }
      },
      error: () => {
        this.toast.error('Failed to load contact');
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
    if (!this.firstName.trim() || !this.lastName.trim()) {
      this.toast.error('First name and last name are required');
      return;
    }
    if (!this.email.trim()) {
      this.toast.error('Email address is required');
      return;
    }

    this.saving = true;
    const contact: Partial<ContactRecord> = {
      firstName: this.firstName,
      lastName: this.lastName,
      jobTitle: this.jobTitle,
      email: this.email,
      phone: this.phone,
      department: this.department,
      primaryContact: this.primaryContact,
      status: this.status as 'Active' | 'Inactive',
      preferredMethod: this.preferredContactMethod,
      address: this.address,
      notes: this.notes,
    };

    const handleSuccess = () => {
      this.saving = false;
      this.toast.success(this.isEditMode ? 'Contact updated successfully' : 'Contact created successfully');
      this.router.navigate(['/clients', this.clientId]);
    };

    const handleError = () => {
      this.saving = false;
      this.toast.error(this.isEditMode ? 'Failed to update contact' : 'Failed to create contact');
    };

    if (this.isEditMode) {
      this.clientService.updateContact(this.clientId, this.contactId, contact).subscribe({
        next: handleSuccess,
        error: handleError,
      });
    } else {
      this.clientService.createContact(this.clientId, contact).subscribe({
        next: handleSuccess,
        error: handleError,
      });
    }
  }
}
