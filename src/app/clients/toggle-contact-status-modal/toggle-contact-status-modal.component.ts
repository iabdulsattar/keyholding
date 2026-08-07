import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { ClientService } from '../../core/services/client.service';

@Component({
  selector: 'app-toggle-contact-status-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './toggle-contact-status-modal.component.html',
  styles: ``
})
export class ToggleContactStatusModalComponent {
  readonly contactId = input.required<string>();
  readonly contactName = input.required<string>();
  readonly currentStatus = input.required<string>();
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

  get isDeactivate(): boolean {
    return this.currentStatus() === 'Active';
  }

  get title(): string {
    return this.isDeactivate ? 'Deactivate Contact' : 'Activate Contact';
  }

  get buttonText(): string {
    return this.isDeactivate ? 'Deactivate' : 'Activate';
  }

  get iconBorder(): string {
    return this.isDeactivate ? 'border-amber-400' : 'border-emerald-400';
  }

  get buttonClass(): string {
    return this.isDeactivate ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600';
  }

  confirm(): void {
    if (!this.contactId() || !this.clientId()) return;
    this.submitting = true;
    this.statusMessage = '';
    this.statusType = '';
    const request$ = this.isDeactivate
      ? this.clientService.deactivateContact(this.clientId(), this.contactId())
      : this.clientService.reactivateContact(this.clientId(), this.contactId());
    request$.subscribe({
      next: () => {
        this.submitting = false;
        this.statusType = 'success';
        this.statusMessage = `Contact ${this.isDeactivate ? 'deactivated' : 'activated'} successfully.`;
        setTimeout(() => this.confirmed.emit(), 900);
      },
      error: (err: any) => {
        this.submitting = false;
        this.statusType = 'error';
        this.statusMessage = err?.error?.message || err?.message || `Failed to ${this.isDeactivate ? 'deactivate' : 'activate'} contact. Please try again.`;
      }
    });
  }
}
