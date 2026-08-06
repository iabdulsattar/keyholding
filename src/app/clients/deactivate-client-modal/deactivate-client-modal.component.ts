import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { ClientService } from '../../core/services/client.service';
import { RichSelectComponent, RichSelectOption } from '../../shared/components/form/rich-select/rich-select.component';

@Component({
  selector: 'app-deactivate-client-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, RichSelectComponent],
  templateUrl: './deactivate-client-modal.component.html',
  styles: ``
})
export class DeactivateClientModalComponent {
  readonly client = input.required<any>();
  readonly orgId = input<string>('');
  readonly close = output<void>();
  readonly confirmed = output<void>();

  reasons: RichSelectOption[] = [
    { value: 'CONTRACT_ENDED', label: 'Contract ended' },
    { value: 'NON_PAYMENT', label: 'Non-payment' },
    { value: 'SERVICE_NOT_NEEDED', label: 'Service no longer needed' },
    { value: 'MERGED_ACQUIRED', label: 'Merged / Acquired' },
    { value: 'OTHER', label: 'Other' },
  ];

  selectedReason: string = '';
  additionalNote = '';
  submitting = false;
  statusMessage = '';
  statusType: '' | 'success' | 'error' = '';

  constructor(private clientService: ClientService) {}

  cancel(): void {
    this.close.emit();
  }

  isOtherSelected(): boolean {
    return this.selectedReason === 'OTHER';
  }

  canSubmit(): boolean {
    if (!this.selectedReason) return false;
    if (this.selectedReason === 'OTHER' && !this.additionalNote.trim()) return false;
    return true;
  }

  confirm(): void {
    if (!this.client()?.id || !this.selectedReason) return;
    const orgId = this.orgId();
    if (!orgId) {
      this.statusType = 'error';
      this.statusMessage = 'Organization context is missing. Please reload the page and try again.';
      return;
    }
    this.submitting = true;
    this.statusMessage = '';
    this.statusType = '';
    this.clientService.deactivateClient(this.client().id).subscribe({
      next: () => {
        this.submitting = false;
        this.statusType = 'success';
        this.statusMessage = `${this.client()?.name || 'Client'} has been deactivated successfully.`;
        setTimeout(() => this.confirmed.emit(), 900);
      },
      error: (err: any) => {
        this.submitting = false;
        this.statusType = 'error';
        this.statusMessage = err?.error?.message || err?.message || 'Failed to deactivate client. Please try again.';
      }
    });
  }
}
