import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientService, ContactRecord } from '../../core/services/client.service';
import { ToastService } from '../../core/services/toast.service';
import { PageBreadcrumbComponent, BreadcrumbItem } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ConfirmModalComponent } from '../../shared/components/ui/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-view-contact',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PageBreadcrumbComponent, ConfirmModalComponent],
  templateUrl: './view-contact.component.html',
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
    .badge { display: inline-flex; align-items: center; padding: 0.125rem 0.625rem; border-radius: 0.5rem; font-size: 0.75rem; font-weight: 600; }
    .info-label { font-size: 0.75rem; font-weight: 600; color: #64748b; margin-bottom: 0.25rem; }
    .info-value { font-size: 0.875rem; font-weight: 500; color: #1e293b; display: flex; align-items: center; gap: 0.5rem; }
    .btn-outline { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem 1rem; font-size: 0.875rem; font-weight: 500; color: #475569; background-color: #fff; border: 1px solid #e2e8f0; border-radius: 0.5rem; cursor: pointer; transition: background-color 0.15s, color 0.15s; text-decoration: none; }
    .btn-outline:hover { background-color: #f8fafc; color: #1e293b; }
  `]
})
export class ViewContactComponent implements OnInit {
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
  address = 'Metro Security Services\n1 Security House, Park Lane\nLondon, W1K 1AB, UK';
  notes = 'James is the main point of contact for all operational matters and key management operations.';

  addedBy = 'Faisa Ahmed';
  createdOn = '15 May 2024, 09:15 AM';
  lastUpdated = '15 May 2024, 11:20 AM';
  lastUpdatedBy = 'Faisa Ahmed';

  jobsAssigned = 48;
  keysManaged = 26;
  sitesAccess = 8;
  primaryFor = 'Metro Security Services';

  loading = false;
  showDeleteModal = false;

  get breadcrumbs(): BreadcrumbItem[] {
    return [
      { label: 'Client Management', link: '/clients' },
      { label: 'Clients', link: '/clients' },
      { label: this.clientName, link: ['/clients', this.clientId] },
      { label: 'Contacts' },
      { label: 'View Contact' }
    ];
  }

  constructor(private route: ActivatedRoute, private router: Router, private clientService: ClientService, private toast: ToastService) {}

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get isEditMode(): boolean {
    return !!this.contactId;
  }

  ngOnInit(): void {
    this.clientId = this.route.snapshot.paramMap.get('id') || '';
    this.contactId = this.route.snapshot.paramMap.get('contactId') || '';
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
    this.loading = true;
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
        this.loading = false;
      },
      error: () => {
        this.toast.error('Failed to load contact');
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/clients', this.clientId]);
  }

  editContact(): void {
    if (!this.clientId || !this.contactId) return;
    this.router.navigate(['/clients', this.clientId, 'add-contact'], {
      queryParams: { contactId: this.contactId }
    });
  }

  deleteContact(): void {
    this.showDeleteModal = true;
  }

  confirmDeleteContact(): void {
    if (!this.clientId || !this.contactId) return;
    this.clientService.deleteContact(this.clientId, this.contactId).subscribe({
      next: () => {
        this.showDeleteModal = false;
        this.toast.success('Contact deleted successfully');
        this.router.navigate(['/clients', this.clientId]);
      },
      error: () => {
        this.showDeleteModal = false;
        this.toast.error('Failed to delete contact');
      }
    });
  }

  toggleDropdown(id: string): void {
    const dropdown = document.getElementById(id);
    if (dropdown) {
      dropdown.classList.toggle('hidden');
    }
  }
}
