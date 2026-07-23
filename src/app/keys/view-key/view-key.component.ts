import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { KeyVaultService, KeyAttachment } from '../../core/services/keyvault.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-view-key',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
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
  attachments: KeyAttachment[] = [];
  attachmentsLoading = false;
  attachmentPreviews: { file: File; url: string }[] = [];
  attachmentError = '';
  attachmentSuccess = '';

  constructor(private route: ActivatedRoute, private router: Router, private keyVault: KeyVaultService, private toast: ToastService) {}

  ngOnInit(): void {
    this.orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id') || '';
    this.keyId = this.route.snapshot.paramMap.get('id') || '';
    if (this.keyId) {
      this.loadAttachments();
    }
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
      const reader = new FileReader();
      reader.onload = () => {
        this.keyVault.addKeyAttachment(this.orgId, this.keyId, {
          fileName: file.name,
          contentType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
          storagePath: reader.result as string,
        }).subscribe({
          next: () => {
            this.toast.success('Attachment uploaded');
            this.loadAttachments();
          },
          error: () => this.toast.error('Failed to upload attachment')
        });
      };
      reader.readAsDataURL(file);
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
