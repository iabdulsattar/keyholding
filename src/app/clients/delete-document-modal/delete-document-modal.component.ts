import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { ClientService } from '../../core/services/client.service';

@Component({
  selector: 'app-delete-document-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './delete-document-modal.component.html',
  styles: ``
})
export class DeleteDocumentModalComponent {
  readonly documentId = input.required<string>();
  readonly documentName = input.required<string>();
  readonly clientId = input.required<string>();
  readonly close = output<void>();
  readonly confirmed = output<void>();

  submitting = false;
  statusMessage = '';
  statusType: '' | 'success' | 'error' = '';

  constructor(private clientService: ClientService) {}

  cancel(): void {
    this.close.emit();
  }

  confirm(): void {
    if (!this.documentId() || !this.clientId()) return;
    this.submitting = true;
    this.statusMessage = '';
    this.statusType = '';
    this.clientService.deleteDocument(this.clientId(), this.documentId()).subscribe({
      next: () => {
        this.submitting = false;
        this.statusType = 'success';
        this.statusMessage = 'Document deleted successfully.';
        setTimeout(() => this.confirmed.emit(), 900);
      },
      error: (err: any) => {
        this.submitting = false;
        this.statusType = 'error';
        this.statusMessage = err?.error?.message || err?.message || 'Failed to delete document. Please try again.';
      }
    });
  }
}
