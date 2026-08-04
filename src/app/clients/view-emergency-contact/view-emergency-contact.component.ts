import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientService, EmergencyContact } from '../../core/services/client.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-view-emergency-contact',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './view-emergency-contact.component.html',
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
    .badge { display: inline-flex; align-items: center; padding: 0.125rem 0.625rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
    .info-label { font-size: 0.75rem; font-weight: 600; color: #64748b; margin-bottom: 0.25rem; }
    .info-value { font-size: 0.875rem; color: #1e293b; display: flex; align-items: center; gap: 0.5rem; }
    .btn-outline { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.5rem 1rem; font-size: 0.875rem; font-weight: 500; color: #475569; background-color: #fff; border: 1px solid #e2e8f0; border-radius: 0.5rem; cursor: pointer; transition: background-color 0.15s, color 0.15s; text-decoration: none; }
    .btn-outline:hover { background-color: #f8fafc; color: #1e293b; }
  `]
})
export class ViewEmergencyContactComponent implements OnInit {
  clientId = '';
  clientName = '';
  contactId = '';

  firstName = '';
  lastName = '';
  fullName = '';
  department = '';
  phone = '';
  email = '';
  availability = '';
  notifyFor = '';
  primaryContact = true;
  status = 'Active';
  address = '';
  notes = '';

  loading = false;

  constructor(private route: ActivatedRoute, private router: Router, private clientService: ClientService, private toast: ToastService) {}

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
    this.clientService.getEmergencyContact(this.clientId, this.contactId).subscribe({
      next: (contact: EmergencyContact | undefined) => {
        if (contact) {
          this.firstName = contact.firstName || '';
          this.lastName = contact.lastName || '';
          this.fullName = contact.fullName || '';
          this.department = contact.department || '';
          this.phone = contact.phone || '';
          this.email = contact.email || '';
          this.availability = contact.availability || '';
          this.notifyFor = contact.notifyFor || '';
          this.primaryContact = contact.primaryContact ?? false;
          this.status = contact.status || 'Active';
          this.address = contact.address || '';
          this.notes = contact.notes || '';
        }
        this.loading = false;
      },
      error: () => {
        this.toast.error('Failed to load emergency contact');
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/clients', this.clientId]);
  }

  editContact(): void {
    if (!this.clientId || !this.contactId) return;
    this.router.navigate(['/clients', this.clientId, 'add-emergency-contact'], {
      queryParams: { contactId: this.contactId }
    });
  }

  deleteContact(): void {
    if (!this.clientId || !this.contactId) return;
    if (!confirm('Are you sure you want to delete this emergency contact? This action cannot be undone.')) return;
    this.clientService.deleteEmergencyContact(this.clientId, this.contactId).subscribe({
      next: () => {
        this.toast.success('Emergency contact deleted successfully');
        this.router.navigate(['/clients', this.clientId]);
      },
      error: () => {
        this.toast.error('Failed to delete emergency contact');
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