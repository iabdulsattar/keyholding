import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { KeyVaultService } from '../../core/services/keyvault.service';

@Component({
  selector: 'app-delete-key-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './delete-key-modal.component.html',
  styles: ``
})
export class DeleteKeyModalComponent {
  readonly key = input.required<any>();
  readonly orgId = input<string>('');
  readonly close = output<void>();
  readonly confirmed = output<void>();

  submitting = false;
  statusMessage = '';
  statusType: '' | 'success' | 'error' = '';

  constructor(private keyVault: KeyVaultService) {}

  cancel(): void {
    this.close.emit();
  }

  confirm(): void {
    if (!this.key()?.id || !this.orgId()) return;
    this.submitting = true;
    this.statusMessage = '';
    this.statusType = '';
    this.keyVault.deleteKey(this.orgId(), this.key().id).subscribe({
      next: () => {
        this.submitting = false;
        this.statusType = 'success';
        this.statusMessage = 'Key deleted successfully.';
        setTimeout(() => this.confirmed.emit(), 900);
      },
      error: (err: any) => {
        this.submitting = false;
        this.statusType = 'error';
        this.statusMessage = err?.error?.message || err?.message || 'Failed to delete key. Please try again.';
      }
    });
  }
}
