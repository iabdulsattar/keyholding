import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientService } from '../../core/services/client.service';
import { ToastService } from '../../core/services/toast.service';
import { KeyVaultService, KeyAttachment } from '../../core/services/keyvault.service';

@Component({
  selector: 'app-view-site',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './view-site.component.html',
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  `]
})
export class ViewSiteComponent implements OnInit {
  activeTab = 'overview';
  siteId = '';
  site: any = null;
  loading = false;
  attachments: KeyAttachment[] = [];
  attachmentsLoading = false;
  attachmentError = '';

  constructor(private route: ActivatedRoute, private router: Router, private clientService: ClientService, private toast: ToastService, private keyVault: KeyVaultService) {}

  ngOnInit(): void {
    this.siteId = this.route.snapshot.paramMap.get('id') || '';
    if (this.siteId) {
      this.loadSite();
      this.loadAttachments();
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
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
    if (!orgId) return;

    this.keyVault.addSiteAttachment(orgId, this.siteId, file, file.name, file.type || 'application/octet-stream', file.size).subscribe({
      next: () => {
        this.toast.success('Attachment uploaded');
        this.loadAttachments();
      },
      error: () => this.toast.error('Failed to upload attachment')
    });
    input.value = '';
  }

  openAttachment(attachment: KeyAttachment): void {
    const path = attachment.storagePath;
    if (!path) {
      this.toast.error('Attachment path is not available.');
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
    this.clientService.getSiteById(orgId, this.siteId).subscribe((res: any) => {
      const item = res?.data ?? res;
      this.site = item
        ? {
            ...item,
            siteCode: item.code,
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

  onEditSite(): void {
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
    const clientId = this.site?.clientId || this.site?.client?.id || '';
    this.router.navigate(['/sites/add-site'], { queryParams: { clientId: clientId, editId: this.siteId } });
  }

  onDeactivateSite(): void {
    if (!confirm('Are you sure you want to deactivate this site?')) return;
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
    if (!orgId) return;
    this.clientService.deactivateSite(orgId, this.siteId).subscribe({
      next: () => {
        this.toast.success('Site deactivated successfully');
        this.loadSite();
      },
      error: () => this.toast.error('Failed to deactivate site')
    });
  }

  onReactivateSite(): void {
    if (!confirm('Are you sure you want to activate this site?')) return;
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
    if (!orgId) return;
    this.clientService.reactivateSite(orgId, this.siteId).subscribe({
      next: () => {
        this.toast.success('Site activated successfully');
        this.loadSite();
      },
      error: () => this.toast.error('Failed to activate site')
    });
  }

  onDeleteSite(): void {
    if (!confirm('Are you sure you want to delete this site? This action cannot be undone.')) return;
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
    if (!orgId) return;
    this.clientService.deleteSite(orgId, this.siteId).subscribe({
      next: () => {
        this.toast.success('Site deleted successfully');
        const clientId = this.site?.clientId || this.site?.client?.id || '';
        this.router.navigate(['/clients', clientId]);
      },
      error: () => this.toast.error('Failed to delete site')
    });
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
