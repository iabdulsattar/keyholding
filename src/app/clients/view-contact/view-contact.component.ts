import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientService, ContactRecord } from '../../core/services/client.service';
import { ToastService } from '../../core/services/toast.service';
import { ClientService, ContactRecord } from '../../core/services/client.service';
import { ToastService } from '../../core/services/toast.service';
import { PageBreadcrumbComponent, BreadcrumbItem } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { DeleteContactModalComponent } from '../delete-contact-modal/delete-contact-modal.component';
import { ActivityItem } from '../../shared/components/ui/activity-timeline/activity-timeline.component';

@Component({
  selector: 'app-view-contact',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PageBreadcrumbComponent, DeleteContactModalComponent],
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
  contactNameToDelete = '';

  activities: any[] = [];
  activitiesLoading = false;
  activitiesSearch = '';

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
      this.loadActivities();
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
    const contactId = this.contactId || this.route.snapshot.paramMap.get('contactId') || '';
    const clientId = this.clientId || this.route.snapshot.paramMap.get('id') || '';
    if (!clientId || !contactId) return;
    this.router.navigate(['/clients', clientId, 'add-contact'], {
      queryParams: { contactId: contactId }
    });
  }

  deleteContact(): void {
    this.contactNameToDelete = this.fullName;
    this.showDeleteModal = true;
  }

  onDeleteContactConfirmed(): void {
    this.showDeleteModal = false;
    this.toast.success('Contact deleted successfully');
    this.router.navigate(['/clients', this.clientId]);
  }

  onDeleteContactClosed(): void {
    this.showDeleteModal = false;
  }

  toggleDropdown(id: string): void {
    const dropdown = document.getElementById(id);
    if (dropdown) {
      dropdown.classList.toggle('hidden');
    }
  }

  loadActivities(): void {
    if (!this.contactId) return;
    this.activitiesLoading = true;
    this.clientService.listEntityAuditLog('CONTACT', this.contactId, { page: 0, size: 50 }).subscribe({
      next: (result: any) => {
        const items = result?.items ?? result?.data?.items ?? [];
        this.activities = items.map((item: any) => this.mapAuditToActivity(item));
        this.activitiesLoading = false;
      },
      error: () => {
        this.activities = [];
        this.activitiesLoading = false;
      }
    });
  }

  onActivitiesSearch(): void {
    const q = this.activitiesSearch.toLowerCase().trim();
    if (!q) {
      this.loadActivities();
      return;
    }
    this.activities = this.activities.filter((a: ActivityItem) =>
      (a.by + ' ' + a.action + ' ' + a.entity + ' ' + a.name + ' ' + a.details).toLowerCase().includes(q)
    );
  }

  private mapAuditToActivity(item: any): ActivityItem {
    const data = item?.data ?? {};
    const actor = item.actor || item.userName || 'System';
    const name = this.getEntityName(data?.message || item?.details || '');
    return {
      id: item.id ?? '',
      time: this.formatDateTime(item.createdAt),
      by: actor,
      role: item.userRole || '—',
      initials: this.getInitials(actor),
      avatarColor: this.getAvatarColor(actor),
      action: item.action || '—',
      entity: this.formatTargetType(item.targetType),
      name: name || '—',
      detail1: '',
      ip: item.ipAddress || '—',
      details: item.details || '—',
    };
  }

  private formatDateTime(value: string): string {
    if (!value) return '—';
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    const datePart = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const timePart = date.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' });
    return `${datePart}, ${timePart}`;
  }

  private getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }

  private getAvatarColor(name: string): string {
    const colors = ['bg-blue-100 text-blue-600', 'bg-emerald-100 text-emerald-600', 'bg-amber-100 text-amber-600', 'bg-rose-100 text-rose-600', 'bg-violet-100 text-violet-600', 'bg-sky-100 text-sky-600'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }

  private getEntityName(details: string): string {
    if (!details) return '';
    const match = details.match(/"([^"]+)"/);
    return match ? match[1] : details.substring(0, 50);
  }

  private formatTargetType(value?: string): string {
    if (!value) return '—';
    return value.charAt(0) + value.slice(1).toLowerCase();
  }
}
