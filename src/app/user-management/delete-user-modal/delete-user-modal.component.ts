import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { KeyVaultService } from '../../core/services/keyvault.service';

@Component({
  selector: 'app-delete-user-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './delete-user-modal.component.html',
  styles: ``
})
export class DeleteUserModalComponent {
  readonly user = input.required<any>();
  readonly orgId = input<string>('');
  readonly close = output<void>();
  readonly deleted = output<void>();

  deleting = false;
  statusMessage = '';
  statusType: '' | 'success' | 'error' = '';

  constructor(private keyVault: KeyVaultService) {}

  cancel(): void {
    this.close.emit();
  }

  confirm(): void {
    if (!this.user()?.id) return;
    const orgId = this.orgId();
    if (!orgId) {
      this.statusType = 'error';
      this.statusMessage = 'Organization context is missing. Please reload the page and try again.';
      return;
    }

    this.deleting = true;
    this.statusMessage = '';
    this.statusType = '';

    this.keyVault.removeUserFromKeyVault(orgId, this.user().id).subscribe({
      next: () => {
        this.deleting = false;
        this.statusType = 'success';
        this.statusMessage = `${this.user()?.name || 'User'} has been deleted successfully.`;
        setTimeout(() => this.deleted.emit(), 900);
      },
      error: (err: any) => {
        this.deleting = false;
        this.statusType = 'error';
        this.statusMessage = err?.error?.message || err?.message || 'Failed to delete user. Please try again.';
      }
    });
  }
}
