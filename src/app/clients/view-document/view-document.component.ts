import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientService } from '../../core/services/client.service';
import { SafeUrlPipe } from '../../shared/pipe/safe-url.pipe';

@Component({
  selector: 'app-view-document',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SafeUrlPipe],
  templateUrl: './view-document.component.html',
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  `]
})
export class ViewDocumentComponent implements OnInit {
  clientId = '';
  clientName = 'Metro Security Services';
  docId = '';

  document: any = null;
  previewType: 'pdf' | 'image' | 'other' = 'other';

  constructor(private route: ActivatedRoute, private router: Router, private clientService: ClientService) {}

  ngOnInit(): void {
    this.clientId = this.route.snapshot.paramMap.get('id') || '';
    this.docId = this.route.snapshot.paramMap.get('docId') || '';
    this.loadClientName();
    if (this.clientId && this.docId) {
      this.clientService.getDocument(this.clientId, this.docId).subscribe({
        next: (res: any) => {
          this.document = res?.data ?? res ?? {};
          if (this.document?.isPdf) {
            this.previewType = 'pdf';
          } else if (this.document?.isImage) {
            this.previewType = 'image';
          } else {
            this.previewType = 'other';
          }
        },
        error: () => {
          this.document = {};
        }
      });
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

  get documentName(): string {
    return this.document?.name || this.document?.fileName || 'Document';
  }

  get category(): string {
    return this.document?.category || 'General';
  }

  get documentType(): string {
    return this.document?.documentType || this.document?.contentType || this.document?.fileType || '—';
  }

  get size(): string {
    const bytes = this.document?.sizeBytes || this.document?.fileSize || 0;
    if (!bytes) return '—';
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
  }

  get uploadedBy(): string {
    return this.document?.uploadedByUserName || '—';
  }

  get uploadDate(): string {
    return this.formatDateTime(this.document?.createdAt);
  }

  get lastModified(): string {
    return this.formatDateTime(this.document?.updatedAt);
  }

  get description(): string {
    return this.document?.description || '—';
  }

  get previewUrl(): string {
    return this.document?.publicUrl || this.document?.downloadUrl || this.document?.url || '';
  }

  get hasPublicUrl(): boolean {
    return !!this.document?.publicUrl;
  }

  goBack(): void {
    this.router.navigate(['/clients', this.clientId]);
  }

  toggleDropdown(id: string): void {
    const dropdown = document.getElementById(id);
    if (dropdown) {
      dropdown.classList.toggle('hidden');
    }
  }

  downloadDocument(): void {
    if (!this.docId) return;
    this.clientService.downloadDocument(this.clientId, this.docId).subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.documentName || 'document';
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => alert('Failed to download document.')
    });
  }

  openInNewTab(): void {
    if (!this.previewUrl) return;
    if (this.hasPublicUrl) {
      window.open(this.previewUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    this.clientService.downloadDocument(this.clientId, this.docId).subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener,noreferrer');
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
      error: () => alert('Failed to open document in new tab.')
    });
  }

  shareDocument(): void {
    console.log('Share document:', this.docId);
  }

  viewDocumentHistory(): void {
    console.log('View document history:', this.docId);
  }

  deleteDocument(): void {
    if (!confirm('Are you sure you want to delete this document?')) return;
    this.clientService.deleteDocument(this.clientId, this.docId).subscribe({
      next: () => {
        this.router.navigate(['/clients', this.clientId]);
      },
      error: () => alert('Failed to delete document.')
    });
  }

  private formatDateTime(value: any): string {
    if (!value) return '—';
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return String(value);
    const datePart = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const timePart = date.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' });
    return `${datePart}, ${timePart}`;
  }
}
