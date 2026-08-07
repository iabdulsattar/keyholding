import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientService } from '../../core/services/client.service';
import { ToastService } from '../../core/services/toast.service';
import { KeyVaultService, KeyAttachment } from '../../core/services/keyvault.service';
import { DeactivateSiteModalComponent } from '../deactivate-site-modal/deactivate-site-modal.component';
import { ActivateSiteModalComponent } from '../activate-site-modal/activate-site-modal.component';
import { DeleteSiteModalComponent } from '../delete-site-modal/delete-site-modal.component';
import { PageBreadcrumbComponent, BreadcrumbItem } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ActivityItem } from '../../shared/components/ui/activity-timeline/activity-timeline.component';

@Component({
  selector: 'app-view-site',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DeactivateSiteModalComponent, ActivateSiteModalComponent, DeleteSiteModalComponent, PageBreadcrumbComponent],
  templateUrl: './view-site.component.html',
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
    .file-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
    .file-card { background: #ffffff; border: 1px solid #e3e6ea; border-radius: 14px; padding: 10px; display: flex; flex-direction: column; box-shadow: 0 1px 2px rgba(16, 24, 40, 0.06), 0 1px 3px rgba(16, 24, 40, 0.04); transition: transform 0.15s ease, box-shadow 0.15s ease; }
    .file-card:hover { transform: translateY(-2px); box-shadow: 0 4px 10px rgba(16, 24, 40, 0.08), 0 2px 4px rgba(16, 24, 40, 0.06); }
    .thumb { width: 100%; aspect-ratio: 16 / 11; border-radius: 8px; overflow: hidden; background: #f1f2f5; display: flex; align-items: center; justify-content: center; margin-bottom: 10px; }
    .thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .thumb.doc-thumb { padding: 6px; }
    .thumb.doc-thumb svg { width: 100%; height: 100%; }
    .file-meta { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .file-info { min-width: 0; }
    .file-name { font-size: 13.5px; font-weight: 600; color: #1f2430; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .file-size { font-size: 12px; color: #8a91a0; margin-top: 2px; }
    .view-btn { flex-shrink: 0; width: 28px; height: 28px; border-radius: 50%; border: none; background: transparent; color: #2f6fed; display: flex; align-items: center; justify-content: center; cursor: pointer; }
    .view-btn:hover { background: rgba(47, 111, 237, 0.1); }
    .view-btn:focus-visible { outline: 2px solid #2f6fed; outline-offset: 2px; }
    .view-btn svg { width: 17px; height: 17px; }
  `]
})
export class ViewSiteComponent implements OnInit {
  activeTab = 'overview';
  siteId = '';
  orgId = '';
  clientId = '';
  site: any = null;
  loading = false;
  attachments: KeyAttachment[] = [];
  attachmentsLoading = false;
  attachmentError = '';

  showDeactivateModal = false;
  showActivateModal = false;
  showDeleteModal = false;
  siteNameToDelete = '';

  activities: ActivityItem[] = [];
  activitiesLoading = false;
  activitiesSearch = '';

  get breadcrumbs(): BreadcrumbItem[] {
    const crumbs: BreadcrumbItem[] = [{ label: 'Sites', link: '/sites/all-sites' }];
    const clientName = this.site?.clientName;
    if (clientName) {
      crumbs.unshift({ label: clientName, link: ['/clients', this.clientId] });
      crumbs.unshift({ label: 'Clients', link: '/clients' });
      crumbs.unshift({ label: 'Client Management', link: '/clients' });
    }
    crumbs.push({ label: 'View Site' });
    return crumbs;
  }

  get returnUrl(): string {
    return this.route.snapshot.queryParamMap.get('returnUrl') || '';
  }

  constructor(private route: ActivatedRoute, private router: Router, private clientService: ClientService, private toast: ToastService, private keyVault: KeyVaultService) {}

  ngOnInit(): void {
    this.siteId = this.route.snapshot.paramMap.get('id') || '';
    if (this.siteId) {
      this.loadSite();
      this.loadAttachments();
      this.loadActivities();
    }
  }

  loadAttachments(): void {
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
    if (!orgId || !this.siteId) return;
    this.attachmentsLoading = true;
    this.attachmentError = '';
    this.keyVault.listSiteAttachments(orgId, this.siteId).subscribe({
      next: (res: any) => {
        const payload = res?.data ?? res ?? [];
        this.attachments = Array.isArray(payload) ? payload : [];
        this.attachmentsLoading = false;
      },
      error: () => {
        this.attachments = [];
        this.attachmentsLoading = false;
        this.attachmentError = 'Unable to load attachments.';
      }
    });
  }

  handleFileUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0] || !this.siteId) return;
    const file = input.files[0];
    if (file.size > 10 * 1024 * 1024) {
      this.toast.error('File size exceeds 10MB limit.');
      input.value = '';
      return;
    }
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
    if (!orgId) return;

    this.keyVault.addSiteAttachment(orgId, this.siteId, file).subscribe({
      next: () => {
        this.toast.success('Attachment uploaded');
        this.loadAttachments();
      },
      error: () => this.toast.error('Failed to upload attachment')
    });
    input.value = '';
  }

  openAttachment(attachment: KeyAttachment): void {
    const path = attachment['publicUrl'] || attachment.storagePath;
    if (!path) {
      this.toast.error('Attachment URL is not available.');
      return;
    }
    window.open(path, '_blank');
  }

  isImage(type = ''): boolean {
    return type.toLowerCase().startsWith('image/');
  }

  formatSize(bytes = 0): string {
    if (!bytes) return '-';
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
  }

  private loadSite(): void {
    this.loading = true;
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
    if (!orgId) {
      this.loading = false;
      return;
    }
    this.orgId = orgId;
    this.clientService.getSiteById(orgId, this.siteId).subscribe((res: any) => {
      const item = res?.data ?? res;
      this.clientId = item?.clientId || item?.client?.id || '';
      this.site = item
        ? {
            ...item,
            address: [item.addressLine1, item.addressLine2, item.city, item.postcode, item.country].filter(Boolean).join(', '),
            region: item.city || item.region || '--',
            clientName: item.clientName || item.client?.name || 'Client',
          }
        : null;
      this.loading = false;
    });
  }

  switchTab(tabId: string): void {
    this.activeTab = tabId;
  }

  get isOverviewActive(): boolean { return this.activeTab === 'overview'; }
  get isLocationActive(): boolean { return this.activeTab === 'location'; }
  get isDetailsActive(): boolean { return this.activeTab === 'details'; }
  get isContactsActive(): boolean { return this.activeTab === 'contacts'; }
  get isAttachmentsActive(): boolean { return this.activeTab === 'attachments'; }
  get isActivityActive(): boolean { return this.activeTab === 'activity'; }

  get isSiteActive(): boolean {
    return this.site?.status === 'ACTIVE' || this.site?.status === 'Active';
  }

  toggleDropdown(): void {
    const el = document.getElementById('actionsDropdown');
    if (el) {
      el.classList.toggle('hidden');
    }
  }

  goBack(): void {
    if (this.returnUrl) {
      this.router.navigateByUrl(this.returnUrl);
    } else if (this.clientId) {
      this.router.navigate(['/clients', this.clientId]);
    } else {
      this.router.navigate(['/sites/all-sites']);
    }
  }

  onEditSite(): void {
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
    const clientId = this.site?.clientId || this.site?.client?.id || '';
    this.router.navigate(['/sites/add-site'], { queryParams: { clientId: clientId, editId: this.siteId, returnUrl: this.returnUrl } });
  }

  onDeactivateSite(): void {
    this.showDeactivateModal = true;
  }

  onReactivateSite(): void {
    this.showActivateModal = true;
  }

  onSiteDeactivated(): void {
    this.showDeactivateModal = false;
    this.toast.success('Site deactivated successfully');
    this.loadSite();
  }

  onSiteReactivated(): void {
    this.showActivateModal = false;
    this.toast.success('Site activated successfully');
    this.loadSite();
  }

  onDeleteSite(): void {
    this.siteNameToDelete = this.site?.name || 'Site';
    this.showDeleteModal = true;
  }

  onDeleteSiteConfirmed(): void {
    this.showDeleteModal = false;
    this.siteNameToDelete = '';
    this.toast.success('Site deleted successfully');
    if (this.returnUrl) {
      this.router.navigateByUrl(this.returnUrl);
    } else {
      const clientId = this.site?.clientId || this.site?.client?.id || '';
      this.router.navigate(['/clients', clientId]);
    }
  }

  onDeleteSiteClosed(): void {
    this.showDeleteModal = false;
    this.siteNameToDelete = '';
  }

  loadActivities(): void {
    if (!this.siteId) return;
    this.activitiesLoading = true;
    this.clientService.listEntityAuditLog('SITE', this.siteId, { page: 0, size: 50 }).subscribe({
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

  deleteSiteAttachment(attachmentId: string): void {
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
    if (!orgId || !this.siteId) return;
    this.keyVault.deleteSiteAttachment(orgId, this.siteId, attachmentId).subscribe({
      next: () => {
        this.toast.success('Attachment removed');
        this.loadAttachments();
      },
      error: () => this.toast.error('Failed to remove attachment')
    });
  }
}
