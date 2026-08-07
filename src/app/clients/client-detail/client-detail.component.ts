import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ClientService, Client, KeyRecord, SiteRecord, EmergencyContact } from '../../core/services/client.service';
import { DeactivateClientModalComponent } from '../deactivate-client-modal/deactivate-client-modal.component';
import { ActivateClientModalComponent } from '../activate-client-modal/activate-client-modal.component';
import { DeleteContactModalComponent } from '../delete-contact-modal/delete-contact-modal.component';
import { ToggleContactStatusModalComponent } from '../toggle-contact-status-modal/toggle-contact-status-modal.component';
import { DeleteEmergencyContactModalComponent } from '../delete-emergency-contact-modal/delete-emergency-contact-modal.component';
import { ToggleEmergencyContactStatusModalComponent } from '../toggle-emergency-contact-status-modal/toggle-emergency-contact-status-modal.component';
import { DeleteDocumentModalComponent } from '../delete-document-modal/delete-document-modal.component';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DeactivateClientModalComponent, ActivateClientModalComponent, DeleteContactModalComponent, ToggleContactStatusModalComponent, DeleteEmergencyContactModalComponent, ToggleEmergencyContactStatusModalComponent, DeleteDocumentModalComponent],
  templateUrl: './client-detail.component.html',
  styles: `
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
    .tab-content-panel { display: none; }
    .tab-content-panel.active { display: block; }
    .nav-item { display:flex; align-items:center; gap:.75rem; padding:.6rem .75rem; border-radius:.6rem; font-size:.875rem; color:#cbd5e1; transition: background .15s, color .15s; }
    .nav-item:hover { background: rgba(255,255,255,0.06); color:#fff; }
    .nav-item-active { background: #4338ca; color:#fff; }
    .nav-icon { width:1.15rem; height:1.15rem; flex-shrink:0; }
    .btn-outline { display:inline-flex; align-items:center; gap:.4rem; padding:.5rem .9rem; border-radius:.6rem; border:1px solid #e2e8f0; font-size:.8rem; font-weight:500; color:#334155; background:#fff; white-space:nowrap; transition: background .15s; }
    .btn-outline:hover { background:#f8fafc; }
    .btn-primary { display:inline-flex; align-items:center; gap:.4rem; padding:.55rem 1rem; border-radius:.6rem; background:#4338ca; color:#fff; font-size:.8rem; font-weight:600; white-space:nowrap; transition: background .15s; }
    .btn-primary:hover { background:#372da3; }
    .badge { display:inline-flex; align-items:center; padding:.15rem .55rem; border-radius: 0.5rem; font-size:.7rem; font-weight:600; }
    .tab { padding:.85rem .25rem; border-bottom:2px solid transparent; color:#94a3b8; white-space:nowrap; }
    .tab:hover { color:#475569; }
    .tab-active { color:#4338ca; border-color:#4338ca; font-weight:600; }
    .stat-card { background:#fff; border:1px solid #f9f3f4; border-radius:0.5rem; padding:1rem 1.1rem; display:flex; align-items:center; gap:.85rem; }
    .stat-icon { width:2.75rem; height:2.75rem; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .th { padding: .85rem 1.25rem; text-align:left; font-weight:600; }
    .td { padding: .85rem 1.25rem; vertical-align:middle; }
    .page-btn { width:2rem; height:2rem; border-radius:.5rem; border:1px solid #e2e8f0; display:flex; align-items:center; justify-content:center; font-weight:600; color:#334155; }
    .no-scrollbar::-webkit-scrollbar { display:none; }
    .no-scrollbar { -ms-overflow-style:none; scrollbar-width:none; }
    .avatar { display:inline-flex; align-items:center; justify-content:center; width:2rem; height:2rem; border-radius:9999px; font-size:.75rem; font-weight:700; }
  `
})
export class ClientDetailComponent implements OnInit {
  isClientActive = true;
  activeTab = 'overview';
  clientId = '';
  client: Client | null = null;
  keys: KeyRecord[] = [];
  filteredKeys: KeyRecord[] = [];
  keysPage = 1;
  keysRowsPerPage = 8;
  keysSearch = '';
  keysStatus = 'All';
  keysType = 'All';
  sites: SiteRecord[] = [];
  filteredSites: SiteRecord[] = [];
  sitesPage = 1;
  sitesRowsPerPage = 8;
  sitesSearch = '';
  sitesStatus = 'All';
  sitesType = 'All';
  loading = false;
  clientStats: any = null;
  siteStats: any = null;
showDeactivateClientModal = false;
  showActivateClientModal = false;
  showDeleteContactModal = false;
  contactIdToDelete = '';
  contactNameToDelete = '';
  showDeleteEmergencyContactModal = false;
  emergencyContactIdToDelete = '';
  emergencyContactNameToDelete = '';
  showDeleteDocumentModal = false;
  documentIdToDelete = '';
  documentNameToDelete = '';
  showToggleContactStatusModal = false;
  contactIdToToggle = '';
  contactNameToToggle = '';
  currentContactStatus = '';
  showToggleEmergencyContactStatusModal = false;
  emergencyContactIdToToggle = '';
  emergencyContactNameToToggle = '';
  currentEmergencyContactStatus = '';

  siteDonutSegments: { color: string; offset: number; length: number }[] = [];

   // Document state
  documents: any[] = [];
  filteredDocuments: any[] = [];
  documentStats: any = null;
  documentsPage = 1;
  documentsRowsPerPage = 8;
  documentsSearch = '';
  documentsCategory = 'All';
  documentsLoading = false;

   // Contact state
   contacts: any[] = [];
   filteredContacts: any[] = [];
   contactsPage = 1;
   contactsRowsPerPage = 10;
   contactsSearch = '';
   contactsStatus = 'All';
   contactsLoading = false;

   // Emergency contact state
   emergencyContacts: EmergencyContact[] = [];
   filteredEmergencyContacts: EmergencyContact[] = [];
   emergencyContactsPage = 1;
   emergencyContactsRowsPerPage = 10;
   emergencyContactsSearch = '';
   emergencyContactsLoading = false;

  get timelineItems(): Array<{ action: string; date: string; by: string; color: string }> {
    const items: Array<{ action: string; date: string; by: string; color: string }> = [];
    const relevantActions = ['Created', 'Activated', 'Deactivated', 'Updated', 'Added', 'Edited', 'Deleted'];
    const seen = new Set<string>();
    for (const activity of this.activities) {
      const action = (activity.action || '').trim();
      if (!relevantActions.includes(action)) continue;
      const key = `${action}-${activity.time}-${activity.by}`;
      if (seen.has(key)) continue;
      seen.add(key);
      let color = 'bg-blue-600';
      if (action === 'Created' || action === 'Added') color = 'bg-emerald-500';
      else if (action === 'Deactivated' || action === 'Deleted') color = 'bg-rose-500';
      else if (action === 'Activated') color = 'bg-emerald-500';
      else if (action === 'Updated' || action === 'Edited') color = 'bg-amber-500';
      items.push({
        action,
        date: activity.time,
        by: activity.by,
        color,
      });
    }
    if (items.length === 0 && this.client?.created) {
      items.push({ action: 'Created', date: this.formatDateTime(this.client.created), by: 'System', color: 'bg-emerald-500' });
    }
    if (items.length === 0 || !items.some(i => i.action === 'Created')) {
      if (this.client?.created) {
        items.unshift({ action: 'Created', date: this.formatDateTime(this.client.created), by: 'System', color: 'bg-emerald-500' });
      }
    }
    return items.slice(0, 10);
  }

  get clientStatusLabel(): string {
    if (!this.client) return 'Active';
    const status = (this.client.status || '').toUpperCase();
    return status === 'ACTIVE' ? 'Active' : status === 'INACTIVE' ? 'Inactive' : (this.client.status || 'Active');
  }

  get clientStatusColor(): string {
    if (!this.client) return 'bg-emerald-500';
    const status = (this.client.status || '').toUpperCase();
    return status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500';
  }

  // Activity log state
  activities: any[] = [];
  filteredActivities: any[] = [];
  activitiesPage = 1;
  activitiesRowsPerPage = 10;
  activitiesTotalPagesFromApi = 1;
  activitiesSearch = '';
  activitiesLoading = false;

   constructor(private route: ActivatedRoute, private router: Router, private clientService: ClientService) {}

   ngOnInit(): void {
     this.clientId = this.route.snapshot.paramMap.get('id') || '';
     this.loadClient();
     this.loadKeys();
     this.loadSites();
     this.loadClientStats();
     this.loadSiteStats();
     this.loadDocuments();
     this.loadDocumentStats();
     this.loadContacts();
     this.loadEmergencyContacts();
     this.loadActivities();
   }

  private loadDocuments(): void {
    if (!this.clientId) return;
    this.documentsLoading = true;
    this.clientService.listDocuments(this.clientId, { page: 0, size: this.documentsRowsPerPage }).subscribe({
      next: (result: any) => {
        this.documents = result?.items ?? [];
        this.filteredDocuments = [...this.documents];
        this.documentsLoading = false;
      },
      error: () => {
        this.documents = [];
        this.filteredDocuments = [];
        this.documentsLoading = false;
      }
    });
  }

  private loadDocumentStats(): void {
    if (!this.clientId) return;
    this.clientService.getDocumentStats(this.clientId).subscribe({
      next: (stats: any) => {
        this.documentStats = stats ?? null;
      },
      error: () => {
        this.documentStats = null;
      }
    });
  }

  private loadContacts(): void {
    if (!this.clientId) return;
    this.contactsLoading = true;
    this.clientService.listContacts(this.clientId, { page: 0, size: this.contactsRowsPerPage }).subscribe({
      next: (result: any) => {
         this.contacts = (result?.items ?? []).map((item: any) => {
           const firstName = item.firstName ?? (item.fullName ? item.fullName.split(' ')[0] : '');
           const lastName = item.lastName ?? (item.fullName ? item.fullName.replace(/^\S+\s*/, '') : '');
           const name = `${firstName} ${lastName}`.trim() || item.fullName || item.name || '—';
           return {
             id: item.id ?? '',
             name: name,
             title: item.jobTitle || '—',
             dept: item.department || '—',
             email: item.email || '—',
             phone: item.phone || '—',
             status: item.status === 'INACTIVE' ? 'Inactive' : 'Active',
             primary: item.primaryContact ?? false,
             initials: this.getInitials(firstName, lastName),
             color: this.getAvatarColor(firstName, lastName),
           };
         });
        this.filteredContacts = [...this.contacts];
        this.contactsLoading = false;
      },
       error: () => {
         this.contacts = [];
         this.filteredContacts = [];
         this.contactsLoading = false;
       }
     });
   }

    private loadEmergencyContacts(): void {
     if (!this.clientId) return;
     this.emergencyContactsLoading = true;
     this.clientService.listEmergencyContacts(this.clientId, { page: 0, size: this.emergencyContactsRowsPerPage }).subscribe({
       next: (result: any) => {
         this.emergencyContacts = (result?.items ?? []).map((item: any) => {
           const firstName = item.firstName ?? (item.fullName ? item.fullName.split(' ')[0] : '');
           const lastName = item.lastName ?? (item.fullName ? item.fullName.replace(/^\S+\s*/, '') : '');
           return {
             id: item.id ?? '',
             firstName: firstName,
             lastName: lastName,
             fullName: item.fullName ?? `${firstName} ${lastName}`.trim(),
             department: item.department || '—',
             phone: item.phone || '—',
             email: item.email || '—',
             availability: item.availability || '—',
             status: item.status === 'Inactive' ? 'Inactive' : 'Active',
             primaryContact: item.primaryContact ?? false,
             notifyFor: item.notifyFor || '—',
             address: item.address || '—',
             notes: item.notes || '',
             clientId: item.clientId,
             initials: this.getInitials(firstName, lastName),
             color: this.getAvatarColor(firstName, lastName),
           };
         });
         this.filteredEmergencyContacts = [...this.emergencyContacts];
         this.emergencyContactsLoading = false;
       },
       error: () => {
         this.emergencyContacts = [];
         this.filteredEmergencyContacts = [];
         this.emergencyContactsLoading = false;
       }
     });
   }

   get emergencyContactsPaginated(): any[] {
     const q = this.emergencyContactsSearch.toLowerCase().trim();
     const data = q ? this.filteredEmergencyContacts : this.emergencyContacts;
     const start = (this.emergencyContactsPage - 1) * this.emergencyContactsRowsPerPage;
     return data.slice(start, start + this.emergencyContactsRowsPerPage);
   }

   get emergencyContactsTotalPages(): number {
     const q = this.emergencyContactsSearch.toLowerCase().trim();
     const data = q ? this.filteredEmergencyContacts : this.emergencyContacts;
     return Math.max(1, Math.ceil(data.length / this.emergencyContactsRowsPerPage));
   }

   get emergencyContactsShowingStart(): number {
     const q = this.emergencyContactsSearch.toLowerCase().trim();
     const data = q ? this.filteredEmergencyContacts : this.emergencyContacts;
     return data.length === 0 ? 0 : (this.emergencyContactsPage - 1) * this.emergencyContactsRowsPerPage + 1;
   }

   get emergencyContactsShowingEnd(): number {
     const q = this.emergencyContactsSearch.toLowerCase().trim();
     const data = q ? this.filteredEmergencyContacts : this.emergencyContacts;
     return Math.min(this.emergencyContactsPage * this.emergencyContactsRowsPerPage, data.length);
   }

   get totalEmergencyContacts(): number {
     const q = this.emergencyContactsSearch.toLowerCase().trim();
     return q ? this.filteredEmergencyContacts.length : this.emergencyContacts.length;
   }

    get activeEmergencyContacts(): number {
      return this.emergencyContacts.filter(c => (c.status || '').toUpperCase() === 'ACTIVE').length;
    }

    get inactiveEmergencyContacts(): number {
      return this.emergencyContacts.filter(c => (c.status || '').toUpperCase() === 'INACTIVE').length;
    }

   get primaryEmergencyContacts(): number {
     return this.emergencyContacts.filter(c => c.primaryContact).length;
   }

   onEmergencyContactsSearch(): void {
     this.emergencyContactsPage = 1;
     const q = this.emergencyContactsSearch.toLowerCase().trim();
     this.filteredEmergencyContacts = this.emergencyContacts.filter((c: EmergencyContact) =>
       (c.fullName + ' ' + c.email + ' ' + c.department).toLowerCase().includes(q)
     );
   }

   emergencyContactsPreviousPage(): void {
     if (this.emergencyContactsPage > 1) this.emergencyContactsPage--;
   }

   emergencyContactsNextPage(): void {
     if (this.emergencyContactsPage < this.emergencyContactsTotalPages) this.emergencyContactsPage++;
   }

   emergencyContactsGoToPage(page: number): void {
     if (page >= 1 && page <= this.emergencyContactsTotalPages) this.emergencyContactsPage = page;
   }

   onEmergencyContactsRowsPerPageChange(event: Event): void {
     const select = event.target as HTMLSelectElement;
     this.emergencyContactsRowsPerPage = parseInt(select.value);
     this.emergencyContactsPage = 1;
   }

viewEmergencyContact(contactId: string): void {
      if (!this.clientId) return;
      this.router.navigate(['/clients', this.clientId, 'view-emergency-contact', contactId]);
    }

    editEmergencyContact(contactId: string): void {
      if (!this.clientId) return;
      this.router.navigate(['/clients', this.clientId, 'add-emergency-contact'], {
        queryParams: { contactId: contactId }
      });
    }

   deleteEmergencyContact(contactId: string): void {
      if (!this.clientId) return;
      const contact = this.emergencyContacts.find(c => c.id === contactId);
      this.emergencyContactIdToDelete = contactId;
      this.emergencyContactNameToDelete = contact?.fullName || 'Emergency Contact';
      this.showDeleteEmergencyContactModal = true;
    }

    onDeleteEmergencyContactConfirmed(): void {
      this.showDeleteEmergencyContactModal = false;
      this.emergencyContactIdToDelete = '';
      this.emergencyContactNameToDelete = '';
      this.loadEmergencyContacts();
      this.showToast('Emergency contact deleted successfully');
    }

    onDeleteEmergencyContactClosed(): void {
      this.showDeleteEmergencyContactModal = false;
      this.emergencyContactIdToDelete = '';
      this.emergencyContactNameToDelete = '';
    }

     addEmergencyContact(): void {
      if (!this.clientId) return;
      this.router.navigate(['/clients', this.clientId, 'add-emergency-contact']);
    }

   toggleEmergencyContactStatus(contactId: string, currentStatus: string): void {
      if (!this.clientId) return;
      const contact = this.emergencyContacts.find(c => c.id === contactId);
      this.emergencyContactIdToToggle = contactId;
      this.emergencyContactNameToToggle = contact?.fullName || 'Emergency Contact';
      this.currentEmergencyContactStatus = currentStatus;
      this.showToggleEmergencyContactStatusModal = true;
    }

    onToggleEmergencyContactStatusConfirmed(): void {
      this.showToggleEmergencyContactStatusModal = false;
      this.emergencyContactIdToToggle = '';
      this.emergencyContactNameToToggle = '';
      this.currentEmergencyContactStatus = '';
      this.loadEmergencyContacts();
      this.showToast('Emergency contact status updated successfully');
    }

    onToggleEmergencyContactStatusClosed(): void {
      this.showToggleEmergencyContactStatusModal = false;
      this.emergencyContactIdToToggle = '';
      this.emergencyContactNameToToggle = '';
      this.currentEmergencyContactStatus = '';
    }

      private loadActivities(): void {
       if (!this.clientId) return;
       this.activitiesLoading = true;
          this.clientService.listAuditLog({ targetType: 'CLIENT', targetId: this.clientId, includeRelated: true, page: 0, size: 200 }).subscribe({
         next: (result: any) => {
           const items = result?.items ?? result?.data?.items ?? [];
           this.activities = items.map((item: any) => {
             const data = item?.data ?? {};
             const actor = item.actor || item.userName || 'System';
              return {
                id: item.id ?? '',
                time: this.formatDateTime(item.createdAt),
                by: actor,
                role: item.userRole || '—',
                initials: this.getInitials(actor),
                avatarColor: this.getAvatarColor(actor),
                action: item.action || '—',
                eventType: item.eventType || '—',
                entity: this.formatTargetType(item.targetType),
                name: this.getActivityEntityName(item) || '—',
                detail1: '',
                ip: item.ipAddress || '—',
                details: item.details || '—',
                reference: item.id ? `#${item.id.slice(0, 8)}` : '—',
                actorUserId: data?.actorUserId || item.userId,
              };
           });
           this.filteredActivities = [...this.activities];
           this.activitiesLoading = false;
         },
          error: () => {
            this.activities = [];
            this.filteredActivities = [];
            this.activitiesLoading = false;
          }
        });
      }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  }

  get contactsPaginated(): any[] {
    const q = this.contactsSearch.toLowerCase().trim();
    const data = q ? this.filteredContacts : this.contacts;
    const start = (this.contactsPage - 1) * this.contactsRowsPerPage;
    return data.slice(start, start + this.contactsRowsPerPage);
  }

  get contactsTotalPages(): number {
    const q = this.contactsSearch.toLowerCase().trim();
    const data = q ? this.filteredContacts : this.contacts;
    return Math.max(1, Math.ceil(data.length / this.contactsRowsPerPage));
  }

  get contactsShowingStart(): number {
    const q = this.contactsSearch.toLowerCase().trim();
    const data = q ? this.filteredContacts : this.contacts;
    return data.length === 0 ? 0 : (this.contactsPage - 1) * this.contactsRowsPerPage + 1;
  }

  get contactsShowingEnd(): number {
    const q = this.contactsSearch.toLowerCase().trim();
    const data = q ? this.filteredContacts : this.contacts;
    return Math.min(this.contactsPage * this.contactsRowsPerPage, data.length);
  }

  get activitiesPaginated(): any[] {
    const q = this.activitiesSearch.toLowerCase().trim();
    const data = q ? this.filteredActivities : this.activities;
    const start = (this.activitiesPage - 1) * this.activitiesRowsPerPage;
    return data.slice(start, start + this.activitiesRowsPerPage);
  }

  get activitiesTotalPages(): number {
    const q = this.activitiesSearch.toLowerCase().trim();
    const data = q ? this.filteredActivities : this.activities;
    return Math.max(1, Math.ceil(data.length / this.activitiesRowsPerPage));
  }

  get activitiesShowingStart(): number {
    const q = this.activitiesSearch.toLowerCase().trim();
    const data = q ? this.filteredActivities : this.activities;
    return data.length === 0 ? 0 : (this.activitiesPage - 1) * this.activitiesRowsPerPage + 1;
  }

  get activitiesShowingEnd(): number {
    const q = this.activitiesSearch.toLowerCase().trim();
    const data = q ? this.filteredActivities : this.activities;
    return Math.min(this.activitiesPage * this.activitiesRowsPerPage, data.length);
  }

  onContactsSearch(): void {
    this.contactsPage = 1;
    const q = this.contactsSearch.toLowerCase().trim();
    this.filteredContacts = this.contacts.filter((c: any) => (c.name + ' ' + c.email + ' ' + c.dept).toLowerCase().includes(q));
  }

  onActivitiesSearch(): void {
    this.activitiesPage = 1;
    const q = this.activitiesSearch.toLowerCase().trim();
    this.filteredActivities = this.activities.filter((a: any) => (a.by + ' ' + a.action + ' ' + a.details).toLowerCase().includes(q));
  }

  contactsPreviousPage(): void {
    if (this.contactsPage > 1) this.contactsPage--;
  }

  contactsNextPage(): void {
    if (this.contactsPage < this.contactsTotalPages) this.contactsPage++;
  }

  contactsGoToPage(page: number): void {
    if (page >= 1 && page <= this.contactsTotalPages) this.contactsPage = page;
  }

  activitiesPreviousPage(): void {
    if (this.activitiesPage > 1) this.activitiesPage--;
  }

  activitiesNextPage(): void {
    if (this.activitiesPage < this.activitiesTotalPages) this.activitiesPage++;
  }

  activitiesGoToPage(page: number): void {
    if (page >= 1 && page <= this.activitiesTotalPages) this.activitiesPage = page;
  }

  private getInitials(first?: string, last?: string): string {
    const a = (first || '').trim();
    const b = (last || '').trim();
    if (!a && !b) return '?';
    return ((a[0] || '') + (b[0] || '')).toUpperCase();
  }

  private getAvatarColor(first?: string, last?: string): string {
    const colors = ['bg-violet-100 text-violet-700','bg-orange-100 text-orange-700','bg-amber-100 text-amber-700','bg-pink-100 text-pink-700','bg-indigo-100 text-indigo-700','bg-emerald-100 text-emerald-700','bg-red-100 text-red-700','bg-teal-100 text-teal-700','bg-brand-100 text-brand-700'];
    const seed = ((first || '') + (last || '')).trim() || 'default';
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = (hash + seed.charCodeAt(i) * 37) % colors.length;
    return colors[hash];
  }

  private formatDateTime(value: any): string {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return String(value);
    const datePart = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const timePart = date.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' });
    return `${datePart}, ${timePart}`;
  }

  private formatDate(value: any): string {
    if (!value) return '--';
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  private formatTargetType(value?: string): string {
    if (!value) return '—';
    return value.charAt(0) + value.slice(1).toLowerCase();
  }

  get documentsPaginated(): any[] {
    const q = this.documentsSearch.toLowerCase().trim();
    const data = q ? this.filteredDocuments : this.documents;
    const start = (this.documentsPage - 1) * this.documentsRowsPerPage;
    return data.slice(start, start + this.documentsRowsPerPage);
  }

  get documentsTotalPages(): number {
    const q = this.documentsSearch.toLowerCase().trim();
    const data = q ? this.filteredDocuments : this.documents;
    return Math.max(1, Math.ceil(data.length / this.documentsRowsPerPage));
  }

  get documentsShowingStart(): number {
    const q = this.documentsSearch.toLowerCase().trim();
    const data = q ? this.filteredDocuments : this.documents;
    return data.length === 0 ? 0 : (this.documentsPage - 1) * this.documentsRowsPerPage + 1;
  }

  get documentsShowingEnd(): number {
    const q = this.documentsSearch.toLowerCase().trim();
    const data = q ? this.filteredDocuments : this.documents;
    return Math.min(this.documentsPage * this.documentsRowsPerPage, data.length);
  }

  get documentCategories(): string[] {
    const categories = Array.from(new Set(this.documents.map(d => d.category).filter(Boolean)));
    return ['All', ...categories.sort()];
  }

  get pdfDocumentCount(): number {
    return this.filteredDocuments.filter(d => (d.documentType || d.fileType || '').toLowerCase().includes('pdf')).length;
  }

  get otherDocumentCount(): number {
    return this.filteredDocuments.length - this.pdfDocumentCount;
  }

  get totalStorageBytes(): number {
    return this.filteredDocuments.reduce((sum, d) => sum + (d.sizeBytes || 0), 0);
  }

  get lastUploadedDate(): string {
    if (this.filteredDocuments.length === 0) return '--';
    const dates = this.filteredDocuments.map(d => d.createdAt).filter(Boolean).sort().reverse();
    const raw = dates[0] || '--';
    if (!raw || raw === '--') return '--';
    return this.formatDate(raw);
  }

  get totalDocuments(): number {
    const q = this.documentsSearch.toLowerCase().trim();
    return q ? this.filteredDocuments.length : this.documents.length;
  }

  onDocumentsSearch(): void {
    this.documentsPage = 1;
    const q = this.documentsSearch.toLowerCase().trim();
    this.filteredDocuments = this.documents.filter(doc => {
      const name = (doc.name || doc.fileName || '').toLowerCase();
      return name.includes(q);
    });
  }

  documentsPreviousPage(): void {
    if (this.documentsPage > 1) this.documentsPage--;
  }

  documentsNextPage(): void {
    if (this.documentsPage < this.documentsTotalPages) this.documentsPage++;
  }

  documentsGoToPage(page: number): void {
    if (page >= 1 && page <= this.documentsTotalPages) this.documentsPage = page;
  }

  onDocumentsRowsPerPageChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.documentsRowsPerPage = parseInt(select.value);
    this.documentsPage = 1;
  }

  viewDocument(docId: string = ''): void {
    if (!this.clientId) return;
    this.router.navigate(['/clients', this.clientId, 'view-document', docId]);
  }

  downloadDocument(docId: string): void {
    const doc = this.documents.find(d => d.id === docId);
    const url = doc?.publicUrl || doc?.storagePath;
    if (!url) {
      this.showToast('Document download URL not available');
      return;
    }
    const link = document.createElement('a');
    link.href = url;
    link.download = doc?.fileName || doc?.name || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  editDocument(docId: string): void {
    if (!this.clientId) return;
    this.router.navigate(['/clients', this.clientId, 'add-document', docId]);
  }

  deleteDocument(docId: string): void {
    const doc = this.documents.find(d => d.id === docId);
    this.documentIdToDelete = docId;
    this.documentNameToDelete = doc?.name || doc?.fileName || 'Document';
    this.showDeleteDocumentModal = true;
  }

  onDeleteDocumentConfirmed(): void {
    this.showDeleteDocumentModal = false;
    this.documentIdToDelete = '';
    this.documentNameToDelete = '';
    this.loadDocuments();
    this.loadDocumentStats();
    this.showToast('Document deleted successfully');
  }

  onDeleteDocumentClosed(): void {
    this.showDeleteDocumentModal = false;
    this.documentIdToDelete = '';
    this.documentNameToDelete = '';
  }

  getDocumentIcon(type = ''): string {
    if (!type) return 'doc';
    const t = type.toLowerCase();
    if (t.includes('pdf')) return 'file-text';
    if (t.includes('image') || t.includes('jpg') || t.includes('png')) return 'image';
    if (t.includes('sheet') || t.includes('xls')) return 'sheet';
    if (t.includes('word') || t.includes('doc')) return 'file-text';
    return 'doc';
  }

  getDocumentColor(type = ''): string {
    if (!type) return 'text-slate-500 bg-slate-100';
    const t = type.toLowerCase();
    if (t.includes('pdf')) return 'text-red-600 bg-red-50';
    if (t.includes('image') || t.includes('jpg') || t.includes('png')) return 'text-blue-600 bg-blue-50';
    if (t.includes('sheet') || t.includes('xls')) return 'text-emerald-600 bg-emerald-50';
    if (t.includes('word') || t.includes('doc')) return 'text-indigo-600 bg-indigo-50';
    return 'text-slate-600 bg-slate-100';
  }

  getCategoryColor(category = ''): string {
    const map: Record<string, string> = {
      'Contract': 'bg-blue-50 text-blue-600',
      'License': 'bg-purple-50 text-purple-600',
      'Insurance': 'bg-amber-50 text-amber-600',
      'Report': 'bg-emerald-50 text-emerald-600',
      'Compliance': 'bg-green-50 text-green-600',
      'Certificate': 'bg-cyan-50 text-cyan-600',
      'General': 'bg-slate-100 text-slate-600',
      'Legal': 'bg-rose-50 text-rose-600',
      'Finance': 'bg-orange-50 text-orange-600',
    };
    return map[category] || 'bg-slate-100 text-slate-600';
  }

  formatSize(bytes = 0): string {
    if (!bytes) return '-';
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
  }

  private loadClientStats(): void {
    this.clientService.getClientStats().subscribe((stats: any) => {
      this.clientStats = stats?.data ?? stats ?? null;
    });
  }

  private loadSiteStats(): void {
    if (!this.clientId) return;
    this.clientService.getSiteStats(this.clientId).subscribe((stats: any) => {
      this.siteStats = stats?.data ?? stats ?? null;
      const total = this.siteStats?.total ?? this.sites.length ?? 0;
      const active = this.siteStats?.active ?? 0;
      const inactive = this.siteStats?.inactive ?? 0;
      const maintenance = 0;
      const planned = 0;

      const activePct = total > 0 ? (active / total) * 100 : 0;
      const inactivePct = total > 0 ? (inactive / total) * 100 : 0;
      const maintenancePct = total > 0 ? (maintenance / total) * 100 : 0;
      const plannedPct = total > 0 ? (planned / total) * 100 : 0;

      const circumference = 2 * Math.PI * 50; // 314.16
      const segments = [
        { color: '#10b981', pct: activePct },
        { color: '#ef4444', pct: inactivePct },
        { color: '#f59e0b', pct: maintenancePct },
        { color: '#a855f7', pct: plannedPct },
      ];

      let cumulativeOffset = 0;
      this.siteDonutSegments = segments.map(seg => {
        const length = (seg.pct / 100) * circumference;
        const offset = -cumulativeOffset;
        cumulativeOffset += length;
        return { color: seg.color, offset, length };
      }).filter(seg => seg.length > 0);
    });
  }

  private loadClient(): void {
    this.loading = true;
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
    if (!orgId || !this.clientId) {
      this.client = null;
      this.loading = false;
      return;
    }
    this.clientService.getClientById(orgId, this.clientId).subscribe((data: Client | undefined) => {
      this.client = data || null;
      if (this.client) {
        this.isClientActive = (this.client.status || '').toUpperCase() === 'ACTIVE';
      }
      this.loading = false;
    });
  }

  private loadKeys(): void {
    this.clientService.getKeysByClient(this.clientId).subscribe((data: KeyRecord[]) => {
      this.keys = data;
      this.filteredKeys = [...this.keys];
    });
  }

  private loadSites(): void {
    this.clientService.getSitesByClient(this.clientId).subscribe((data: SiteRecord[]) => {
      this.sites = data;
      this.filteredSites = [...this.sites];
    });
  }

  get sitesPaginated(): SiteRecord[] {
    const start = (this.sitesPage - 1) * this.sitesRowsPerPage;
    return this.filteredSites.slice(start, start + this.sitesRowsPerPage);
  }

  get sitesTotalPages(): number {
    return Math.ceil(this.filteredSites.length / this.sitesRowsPerPage);
  }

  get sitesShowingStart(): number {
    return this.filteredSites.length === 0 ? 0 : (this.sitesPage - 1) * this.sitesRowsPerPage + 1;
  }

  get sitesShowingEnd(): number {
    return Math.min(this.sitesPage * this.sitesRowsPerPage, this.filteredSites.length);
  }

  get totalKeys(): number {
    return this.keys.length;
  }

  get keysPaginated(): KeyRecord[] {
    const start = (this.keysPage - 1) * this.keysRowsPerPage;
    return this.filteredKeys.slice(start, start + this.keysRowsPerPage);
  }

  get keysTotalPages(): number {
    return Math.ceil(this.filteredKeys.length / this.keysRowsPerPage);
  }

  get keysShowingStart(): number {
    return this.filteredKeys.length === 0 ? 0 : (this.keysPage - 1) * this.keysRowsPerPage + 1;
  }

  get keysShowingEnd(): number {
    return Math.min(this.keysPage * this.keysRowsPerPage, this.filteredKeys.length);
  }

  get keyStatuses(): string[] {
    const statuses = Array.from(new Set(this.keys.map(k => k.status)));
    return ['All', ...statuses.sort()];
  }

  get keyTypes(): string[] {
    const types = Array.from(new Set(this.keys.map(k => k.type)));
    return ['All', ...types.sort()];
  }

  onKeysSearch(): void {
    this.keysPage = 1;
    this.applyKeysFilter();
  }

  onKeysStatusChange(): void {
    this.keysPage = 1;
    this.applyKeysFilter();
  }

  onKeysTypeChange(): void {
    this.keysPage = 1;
    this.applyKeysFilter();
  }

  private applyKeysFilter(): void {
    const q = this.keysSearch.toLowerCase().trim();
    this.filteredKeys = this.keys.filter(item => {
      const matchesSearch = item.keyCode.toLowerCase().includes(q) ||
                            item.name.toLowerCase().includes(q) ||
                            item.siteName.toLowerCase().includes(q) ||
                            item.assignedTo.toLowerCase().includes(q) ||
                            item.storageLocation.toLowerCase().includes(q);
      const matchesStatus = this.keysStatus === 'All' || item.status === this.keysStatus;
      const matchesType = this.keysType === 'All' || item.type === this.keysType;
      return matchesSearch && matchesStatus && matchesType;
    });
  }

  keysPreviousPage(): void {
    if (this.keysPage > 1) {
      this.keysPage--;
    }
  }

  keysNextPage(): void {
    if (this.keysPage < this.keysTotalPages) {
      this.keysPage++;
    }
  }

  keysGoToPage(page: number): void {
    if (page >= 1 && page <= this.keysTotalPages) {
      this.keysPage = page;
    }
  }

  onKeysRowsPerPageChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.keysRowsPerPage = parseInt(select.value);
    this.keysPage = 1;
  }

  get totalJobs(): number {
    return this.sites.reduce((sum, site) => sum + (site.totalJobs || 0), 0);
  }

  get keyStatusStats(): { status: string; count: number; color: string; pct: number }[] {
    const total = this.filteredKeys.length || 1;
    const counts = new Map<string, { count: number; color: string }>();
    this.filteredKeys.forEach(k => {
      const color = this.statusColorFor(k.status, k.statusColor);
      const existing = counts.get(k.status) || { count: 0, color };
      counts.set(k.status, { count: existing.count + 1, color });
    });

    const ordered = ['In Storage', 'Issued', 'In Use', 'Overdue', 'Lost / Damaged'];
    const colorMap: Record<string, string> = {
      'In Storage': 'bg-emerald-500',
      'Issued': 'bg-amber-500',
      'In Use': 'bg-blue-500',
      'Overdue': 'bg-rose-500',
      'Lost': 'bg-slate-400',
      'Lost / Damaged': 'bg-slate-400',
      'Damaged': 'bg-slate-400',
      'Damaged / Lost': 'bg-slate-400',
    };

    return ordered.map(status => {
      const data = counts.get(status) || { count: 0, color: colorMap[status] || 'bg-slate-400' };
      return {
        status,
        count: data.count,
        color: data.color,
        pct: Math.round((data.count / total) * 100)
      };
    });
  }

  get keyDonutSegments(): { color: string; offset: number; length: number }[] {
    const circumference = 2 * Math.PI * 50;
    const stats = this.keyStatusStats;
    const segments = stats.map(s => ({
      color: s.color === 'bg-emerald-500' ? '#10b981' :
             s.color === 'bg-amber-500' ? '#f59e0b' :
             s.color === 'bg-blue-500' ? '#3b82f6' :
             s.color === 'bg-rose-500' ? '#ef4444' : '#94a3b8',
      count: s.count,
      pct: s.pct
    }));

    let cumulativeOffset = 0;
    const all = segments.map(seg => {
      const length = (seg.pct / 100) * circumference;
      const offset = -cumulativeOffset;
      cumulativeOffset += length;
      return { color: seg.color, offset, length, count: seg.count };
    });

    return all.filter(seg => seg.length > 0 && seg.count > 0);
  }

  get keyTypeStats(): { type: string; count: number; color: string; pct: number }[] {
    const total = this.filteredKeys.length || 1;
    const hexMap: Record<string, string> = {
      'Master Key': '#3b82f6',
      'Door Key': '#10b981',
      'Alarm Key': '#8b5cf6',
      'Gate Key': '#f59e0b',
      'Utility Key': '#06b6d4',
      'Office Key': '#6366f1',
      'IT Key': '#8b5cf6',
    };
    const knownTypes = ['Master Key', 'Door Key', 'Alarm Key', 'Gate Key', 'Utility Key', 'Office Key', 'IT Key'];
    const counts = new Map<string, number>();
    this.filteredKeys.forEach(k => {
      counts.set(k.type, (counts.get(k.type) || 0) + 1);
    });
    const others = this.filteredKeys.filter(k => !knownTypes.includes(k.type)).length;
    const stats = knownTypes.map(type => ({
      type,
      count: counts.get(type) || 0,
      color: hexMap[type] || '#94a3b8',
      pct: Math.round(((counts.get(type) || 0) / total) * 100)
    }));
    if (others > 0) {
      stats.push({ type: 'Others', count: others, color: '#94a3b8', pct: Math.round((others / total) * 100) });
    }
    return stats;
  }

  private statusColorFor(status: string, fallback?: string): string {
    if (fallback) return fallback;
    const map: Record<string, string> = {
      'In Storage': 'bg-emerald-500',
      'In Use': 'bg-blue-500',
      'Issued': 'bg-amber-500',
      'Overdue': 'bg-purple-500',
      'Lost': 'bg-rose-500',
      'Lost / Damaged': 'bg-rose-500',
    };
    return map[status] || 'bg-slate-400';
  }

  hexForType(type: string): string {
    const map: Record<string, string> = {
      Office: '#3b82f6',
      Warehouse: '#a855f7',
      Retail: '#f59e0b',
      'Distribution Centre': '#fb923c',
      'Data Centre': '#06b6d4',
      Storage: '#94a3b8',
      'Construction Site': '#f97316',
      'Remote Office': '#14b8a6',
      Other: '#64748b',
    };
    return map[type] || '#94a3b8';
  }

  onSitesSearch(): void {
    this.sitesPage = 1;
    this.applySitesFilter();
  }

  onSitesStatusChange(): void {
    this.sitesPage = 1;
    this.applySitesFilter();
  }

  onSitesTypeChange(): void {
    this.sitesPage = 1;
    this.applySitesFilter();
  }

  private applySitesFilter(): void {
    const q = this.sitesSearch.toLowerCase().trim();
    this.filteredSites = this.sites.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(q) ||
                            item.siteCode.toLowerCase().includes(q) ||
                            item.address.toLowerCase().includes(q) ||
                            item.primaryContactName.toLowerCase().includes(q);
      const matchesStatus = this.sitesStatus === 'All' || item.status === this.sitesStatus;
      const matchesType = this.sitesType === 'All' || item.siteType === this.sitesType;
      return matchesSearch && matchesStatus && matchesType;
    });
  }

  sitesPreviousPage(): void {
    if (this.sitesPage > 1) {
      this.sitesPage--;
    }
  }

  sitesNextPage(): void {
    if (this.sitesPage < this.sitesTotalPages) {
      this.sitesPage++;
    }
  }

  sitesGoToPage(page: number): void {
    if (page >= 1 && page <= this.sitesTotalPages) {
      this.sitesPage = page;
    }
  }

  onRowsPerPageChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.sitesRowsPerPage = parseInt(select.value);
    this.sitesPage = 1;
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'activity') {
      this.loadActivities();
    }
    setTimeout(() => {
      const icons = (window as any).lucide;
      if (icons && icons.createIcons) {
        icons.createIcons();
      }
    }, 0);
  }

  get headerConfig(): { breadcrumbs: { label: string; link?: string }[]; title: string; showActions: boolean; actions: { label: string; icon: string; class?: string }[] } {
    const clientName = this.client?.name || 'Client Details';
    const baseBreadcrumbs = [
      { label: 'Client Management', link: '/clients' },
      { label: 'Clients', link: '/clients' },
      { label: clientName }
    ];

    switch (this.activeTab) {
      case 'keys':
        return {
          breadcrumbs: [...baseBreadcrumbs, { label: 'Keys' }],
          title: clientName,
          showActions: true,
          actions: [
            { label: 'Add New Key', icon: 'plus', class: 'bg-blue-600 hover:bg-blue-700 text-white' },
          ]
        };
      case 'sites':
        return {
          breadcrumbs: [...baseBreadcrumbs, { label: 'Sites' }],
          title: clientName,
          showActions: true,
          actions: [
            { label: 'Add New Site', icon: 'plus', class: 'bg-blue-600 hover:bg-blue-700 text-white' },
           
          ]
        };
      case 'documents':
        return {
          breadcrumbs: [...baseBreadcrumbs, { label: 'Documents' }],
          title: clientName,
          showActions: true,
          actions: []
        };
      case 'jobs':
        return {
          breadcrumbs: [...baseBreadcrumbs, { label: 'Jobs' }],
          title: clientName,
          showActions: false,
          actions: []
        };
      default:
        return {
          breadcrumbs: baseBreadcrumbs,
          title: 'Client Details',
          showActions: false,
          actions: []
        };
    }
  }

  getOrgId(): string {
    return localStorage.getItem('organizationId') || localStorage.getItem('org_id') || '';
  }

  toggleActivationState(): void {
    if (this.isClientActive) {
      this.showDeactivateClientModal = true;
    } else {
      this.showActivateClientModal = true;
    }
  }

  onClientDeactivated(): void {
    this.showDeactivateClientModal = false;
    this.isClientActive = false;
    this.loadClient();
    this.loadKeys();
    this.loadSites();
    this.loadClientStats();
    this.loadSiteStats();
    this.showToast('Client deactivated successfully');
  }

  onClientActivated(): void {
    this.showActivateClientModal = false;
    this.isClientActive = true;
    this.loadClient();
    this.loadKeys();
    this.loadSites();
    this.loadClientStats();
    this.loadSiteStats();
    this.showToast('Client activated successfully');
  }

  showToast(message: string): void {
    const toast = document.getElementById('toastNotification');
    const toastMessage = document.getElementById('toastMessage');
    if (toast && toastMessage) {
      toastMessage.textContent = message;
      toast.classList.remove('translate-x-[150%]');
      setTimeout(() => {
        toast.classList.add('translate-x-[150%]');
      }, 3000);
    }
  }

  triggerAction(actionName: string): void {
    if (actionName === 'Add New Key') {
      this.router.navigate(['/keys/add-key'], { queryParams: { clientId: this.clientId, returnUrl: '/clients/' + this.clientId } });
      return;
    }
    if (actionName === 'Add New Site') {
      this.router.navigate(['/sites/add-site'], { queryParams: { clientId: this.clientId, returnUrl: '/clients/' + this.clientId } });
      return;
    }
    if (actionName === 'Edit Client') {
      this.router.navigate(['/clients/add-client'], { queryParams: { editId: this.clientId } });
      return;
    }
    if (actionName === 'Upload Document') {
      this.uploadDocument();
      return;
    }
    if (actionName === 'Export Client Data') {
      this.exportClientData();
      return;
    }
    if (actionName === 'Refresh Links') {
      this.loadClient();
      this.loadKeys();
      this.loadSites();
      this.showToast('Data refreshed successfully');
      return;
    }
    this.showToast(`Action "${actionName}" triggered`);
  }

  private exportClientData(): void {
    if (!this.client) return;
    const headers = new Headers();
    headers.append('Content-Type', 'text/csv');
    const rows = [
      ['Code', 'Name', 'Email', 'Region', 'Status', 'Sites', 'Users', 'Created On'],
      [this.client.code, this.client.name, this.client.email, this.client.region, this.client.status, String(this.client.sites), String(this.client.users), this.client.created]
    ];
    const csvContent = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${this.client.code || 'client'}-${this.client.name || 'data'}.csv`;
    link.click();
    this.showToast('Client data exported');
  }

  triggerRowAction(action: string, rowId: string): void {
    if (action === 'View') {
      this.router.navigate(['/keys/view-key', rowId], { queryParams: { returnUrl: '/clients/' + this.clientId } });
      return;
    }
    const toast = document.getElementById('toastNotification');
    const toastMessage = document.getElementById('toastMessage');
    if (toast && toastMessage) {
      toastMessage.textContent = `${action} requested for contextual entity target: [${rowId}]`;
      toast.classList.remove('translate-x-[150%]');
      setTimeout(() => {
        toast.classList.add('translate-x-[150%]');
      }, 3500);
    }
  }

  viewSite(siteId: string): void {
    this.router.navigate(['/sites/view-site', siteId], { queryParams: { returnUrl: '/clients/' + this.clientId } });
  }

  toggleSelectAllRows(masterCheckbox: HTMLInputElement): void {
    const rowCheckboxes = document.querySelectorAll('.row-checkbox');
    rowCheckboxes.forEach(cb => {
      (cb as HTMLInputElement).checked = masterCheckbox.checked;
      if (masterCheckbox.checked) {
        (cb as HTMLElement).closest('tr')?.classList.add('bg-blue-50/20');
      } else {
        (cb as HTMLElement).closest('tr')?.classList.remove('bg-blue-50/20');
      }
    });
  }

uploadDocument(): void {
      if (!this.clientId) return;
      this.router.navigate(['/clients', this.clientId, 'add-document']);
    }

   onRowCheckboxChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      checkbox.closest('tr')?.classList.add('bg-blue-50/20');
    } else {
      checkbox.closest('tr')?.classList.remove('bg-blue-50/20');
      const selectAll = document.getElementById('selectAllRows') as HTMLInputElement;
      if (selectAll) selectAll.checked = false;
    }
  }

  toggleDropdown(id: string): void {
    const dropdown = document.getElementById(id);
    if (dropdown) {
      dropdown.classList.toggle('hidden');
    }
  }

  contactStatusClass(status: string): string {
    return status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500';
  }

  viewContact(contactId: string): void {
    if (!this.clientId) return;
    this.router.navigate(['/clients', this.clientId, 'view-contact', contactId]);
  }

  editContact(contactId: string): void {
    if (!this.clientId) return;
    this.router.navigate(['/clients', this.clientId, 'add-contact'], {
      queryParams: { contactId: contactId }
    });
  }

  deleteContact(contactId: string): void {
    if (!this.clientId) return;
    const contact = this.contacts.find(c => c.id === contactId);
    this.contactIdToDelete = contactId;
    this.contactNameToDelete = contact?.name || 'Contact';
    this.showDeleteContactModal = true;
  }

  onDeleteContactConfirmed(): void {
    this.showDeleteContactModal = false;
    this.contactIdToDelete = '';
    this.contactNameToDelete = '';
    this.loadContacts();
    this.showToast('Contact deleted successfully');
  }

  onDeleteContactClosed(): void {
    this.showDeleteContactModal = false;
    this.contactIdToDelete = '';
    this.contactNameToDelete = '';
  }

  toggleContactStatus(contactId: string, currentStatus: string): void {
    if (!this.clientId) return;
    const contact = this.contacts.find(c => c.id === contactId);
    this.contactIdToToggle = contactId;
    this.contactNameToToggle = contact?.name || 'Contact';
    this.currentContactStatus = currentStatus;
    this.showToggleContactStatusModal = true;
  }

  onToggleContactStatusConfirmed(): void {
    this.showToggleContactStatusModal = false;
    this.contactIdToToggle = '';
    this.contactNameToToggle = '';
    this.currentContactStatus = '';
    this.loadContacts();
    this.showToast('Contact status updated successfully');
  }

  onToggleContactStatusClosed(): void {
    this.showToggleContactStatusModal = false;
    this.contactIdToToggle = '';
    this.contactNameToToggle = '';
    this.currentContactStatus = '';
  }

  addContact(): void {
    if (!this.clientId) return;
    this.router.navigate(['/clients', this.clientId, 'add-contact']);
  }

  getActivityIcon(entity: string): { bg: string; color: string; path: string } {
    const map: Record<string, { bg: string; color: string; path: string }> = {
      Site: { bg:"bg-violet-50", color:"text-violet-600", path:'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 6v-3a1 1 0 011-1h2a1 1 0 011 1v3"/>' },
      Key: { bg:"bg-amber-50", color:"text-amber-600", path:'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 11-12 0 6 6 0 0112 0zM3 21l7-7"/>' },
      Job: { bg:"bg-emerald-50", color:"text-emerald-600", path:'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7h-3V5a2 2 0 00-2-2H9a2 2 0 00-2 2v2H4a1 1 0 00-1 1v11a2 2 0 002 2h14a2 2 0 002-2V8a1 1 0 00-1-1zM9 5h6v2H9V5z"/>' },
      Document: { bg:"bg-sky-50", color:"text-sky-600", path:'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>' },
      Contact: { bg:"bg-slate-100", color:"text-slate-600", path:'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>' },
    };
    return map[entity] || { bg:"bg-slate-100", color:"text-slate-600", path:'' };
  }

  getActionColor(action: string): string {
    const map: Record<string, string> = {
      Added: "bg-emerald-50 text-emerald-600",
      Edited: "bg-slate-100 text-slate-500",
      Deleted: "bg-rose-50 text-rose-500",
      Deactivated: "bg-slate-100 text-slate-500",
      Created: "bg-amber-50 text-amber-600",
      Uploaded: "bg-sky-50 text-sky-600",
    };
    return map[action] || "bg-slate-100 text-slate-600";
  }

  private getActivityEntityName(item: any): string {
    const data = item?.data ?? {};
    if (data?.organizationName) {
      return data.organizationName;
    }
    const message = data?.message || item?.details || '';
    const quoted = message.match(/"([^"]+)"/);
    if (quoted && quoted[1]) {
      return quoted[1];
    }
    return '';
  }

  getActivityPageNumbers(): (number | '...')[] {
    const total = this.activitiesTotalPages;
    const current = this.activitiesPage;
    const pages: (number | '...')[] = [];
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push('...');
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (current < total - 2) pages.push('...');
      pages.push(total);
    }
    return pages;
  }
}
