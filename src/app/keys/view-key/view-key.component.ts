import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { KeyVaultService, KeyAttachment } from '../../core/services/keyvault.service';
import { ToastService } from '../../core/services/toast.service';
import { DeactivateKeyModalComponent } from '../deactivate-key-modal/deactivate-key-modal.component';
import { ReactivateKeyModalComponent } from '../reactivate-key-modal/reactivate-key-modal.component';

@Component({
  selector: 'app-view-key',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DeactivateKeyModalComponent, ReactivateKeyModalComponent],
  templateUrl: './view-key.component.html',
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  `]
})
export class ViewKeyComponent implements OnInit {
  activeTab = 'overview';
  keyId = '';
  orgId = '';
  keyCode = '';
  clientId = '';
  attachments: KeyAttachment[] = [];
  attachmentsLoading = false;
  attachmentPreviews: { file: File; url: string }[] = [];
  attachmentError = '';
  attachmentSuccess = '';

  key: any = {};
  keyStatusClass = 'bg-slate-100 text-slate-600';
  keyTypeName = '';
  keyCategoryName = '';
  siteName = '';
  clientName = '';
  showDeactivateModal = false;
  showReactivateModal = false;

  constructor(private route: ActivatedRoute, private router: Router, private keyVault: KeyVaultService, private toast: ToastService) {}

  ngOnInit(): void {
    this.orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id') || '';
    this.keyId = this.route.snapshot.paramMap.get('id') || '';
    if (this.keyId) {
      this.loadKeyDetails();
      this.loadAttachments();
    }
  }

  private loadKeyDetails(): void {
    if (!this.orgId || !this.keyId) return;
    this.keyVault.getKey(this.orgId, this.keyId).subscribe({
      next: (res: any) => {
        const item = res?.data ?? res;
        if (!item) return;
        this.key = item;
        this.keyCode = item.code || item.keyCode || '';
        this.clientId = item.clientId || '';
        this.keyTypeName = item.keyTypeName || item.typeName || item.type || '';
        this.keyCategoryName = item.keyCategoryName || item.categoryName || item.category || '';
        this.siteName = item.siteName || item.site?.name || '';
        this.clientName = item.clientName || item.client?.name || '';
        this.updateStatusFromApi(item.status);
      },
      error: () => {}
    });
  }

  private updateStatusFromApi(apiStatus?: string): void {
    const isInactive = (apiStatus || '').toUpperCase() === 'INACTIVE';
    this.key.status = isInactive ? 'inactive' : 'active';
    this.keyStatusClass = isInactive ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-600';
  }

  get statusLabel(): string {
    return this.key.status === 'inactive' ? 'Inactive' : 'Active';
  }

  get isActive(): boolean {
    return this.key.status !== 'inactive';
  }

  switchTab(tabId: string): void {
    this.activeTab = tabId;
    if (tabId === 'attachments' && this.keyId && !this.attachments.length && !this.attachmentsLoading) {
      this.loadAttachments();
    }
  }

  get isOverviewActive(): boolean { return this.activeTab === 'overview'; }
  get isMovementsActive(): boolean { return this.activeTab === 'movements'; }
  get isAuditActive(): boolean { return this.activeTab === 'audit'; }
  get isJobsActive(): boolean { return this.activeTab === 'jobs'; }
  get isAttachmentsActive(): boolean { return this.activeTab === 'attachments'; }
  get isNotesActive(): boolean { return this.activeTab === 'notes'; }
  get attachmentSidebarLabel(): string {
    const first = this.attachments[0];
    if (!first?.fileName) return 'MASTER-IMG';
    const parts = first.fileName.split('.');
    const ext = parts.pop();
    return ext ? ext.toUpperCase() : 'MASTER-IMG';
  }

  toggleDropdown(): void {
    const el = document.getElementById('moreDropdown');
    if (el) el.classList.toggle('hidden');
  }

  onEditKey(): void {
    this.router.navigate(['/keys/add-key'], { queryParams: { clientId: this.clientId, editId: this.keyId } });
  }

  onDeleteKey(): void {
    if (!this.orgId || !this.keyId) return;
    if (!confirm('Are you sure you want to delete this key? This action cannot be undone.')) return;
    this.keyVault.deleteKey(this.orgId, this.keyId).subscribe({
      next: () => {
        this.toast.success('Key deleted successfully.');
        this.router.navigate(['/keys']);
      },
      error: () => this.toast.error('Failed to delete key. Please try again.')
    });
  }

  onDeactivateKey(): void {
    this.showDeactivateModal = true;
  }

  onReactivateKey(): void {
    this.showReactivateModal = true;
  }

  onKeyDeactivated(): void {
    this.showDeactivateModal = false;
    this.key.status = 'inactive';
    this.keyStatusClass = 'bg-slate-100 text-slate-500';
    this.toast.success('Key deactivated successfully.');
  }

  onKeyReactivated(): void {
    this.showReactivateModal = false;
    this.key.status = 'active';
    this.keyStatusClass = 'bg-emerald-50 text-emerald-600';
    this.toast.success('Key reactivated successfully.');
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text);
  }

  loadAttachments(): void {
    if (!this.orgId || !this.keyId) return;
    this.attachmentsLoading = true;
    this.attachmentError = '';
    this.keyVault.listKeyAttachments(this.orgId, this.keyId).subscribe({
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

  onAttachmentSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !this.keyId) return;
    Array.from(input.files).forEach(file => {
      this.keyVault.addKeyAttachment(this.orgId, this.keyId, file, file.name, file.type || 'application/octet-stream', file.size).subscribe({
        next: () => {
          this.toast.success('Attachment uploaded');
          this.loadAttachments();
        },
        error: () => this.toast.error('Failed to upload attachment')
      });
    });
    input.value = '';
  }

  deleteAttachment(attachmentId: string): void {
    if (!this.orgId || !this.keyId) return;
    this.keyVault.deleteKeyAttachment(this.orgId, this.keyId, attachmentId).subscribe({
      next: () => {
        this.toast.success('Attachment removed');
        this.loadAttachments();
      },
      error: () => this.toast.error('Failed to remove attachment')
    });
  }

  downloadAttachment(attachment: any): void {
    const url = attachment.storagePath;
    if (!url) {
      this.toast.error('Attachment URL is not available.');
      return;
    }
    window.open(url, '_blank');
  }

  iconForType(type = ''): string {
    const t = type.toLowerCase();
    if (t.includes('image')) return 'image';
    if (t.includes('pdf')) return 'pdf';
    return 'doc';
  }

  formatSize(bytes = 0): string {
    if (!bytes) return '-';
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
  }

  isImage(type = ''): boolean {
    return type.toLowerCase().startsWith('image/');
  }
}
