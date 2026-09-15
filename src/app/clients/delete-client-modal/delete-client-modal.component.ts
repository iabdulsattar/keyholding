import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { ClientService } from '../../core/services/client.service';

@Component({
  selector: 'app-delete-client-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './delete-client-modal.component.html',
  styles: ``
})
export class DeleteClientModalComponent {
  readonly client = input.required<any>();
  readonly orgId = input<string>('');
  readonly close = output<void>();
  readonly confirmed = output<void>();

  confirmValue = '';
  password = '';
  submitting = false;
  statusMessage = '';
  statusType: '' | 'success' | 'error' = '';

  constructor(private clientService: ClientService) {}

  cancel(): void {
    this.close.emit();
  }

  canSubmit(): boolean {
    if (this.submitting) return false;
    if (this.confirmValue.trim() !== 'DELETE') return false;
    if (!this.password.trim()) return false;
    return true;
  }

  confirm(): void {
    if (!this.client()?.id) return;
    const orgId = this.orgId();
    if (!orgId) {
      this.statusType = 'error';
      this.statusMessage = 'Organization context is missing. Please reload the page and try again.';
      return;
    }
    if (!this.canSubmit()) return;
    this.submitting = true;
    this.statusMessage = '';
    this.statusType = '';
    this.clientService.deleteClient(this.client().id).subscribe({
      next: () => {
        this.submitting = false;
        this.statusType = 'success';
        this.statusMessage = `${this.client()?.name || 'Client'} has been deleted successfully.`;
        setTimeout(() => this.confirmed.emit(), 900);
      },
      error: (err: any) => {
        this.submitting = false;
        this.statusType = 'error';
        this.statusMessage = err?.error?.message || err?.message || 'Failed to delete client. Please try again.';
      }
    });
  }
}
