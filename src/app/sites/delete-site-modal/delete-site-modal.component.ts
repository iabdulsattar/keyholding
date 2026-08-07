import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { ClientService } from '../../core/services/client.service';

@Component({
  selector: 'app-delete-site-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './delete-site-modal.component.html',
  styles: ``
})
export class DeleteSiteModalComponent {
  readonly siteId = input.required<string>();
  readonly siteName = input.required<string>();
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
    if (!this.siteId() || !this.clientId()) return;
    this.submitting = true;
    this.statusMessage = '';
    this.statusType = '';
    this.clientService.deleteSite(this.clientId(), this.siteId()).subscribe({
      next: () => {
        this.submitting = false;
        this.statusType = 'success';
        this.statusMessage = 'Site deleted successfully.';
        setTimeout(() => this.confirmed.emit(), 900);
      },
      error: (err: any) => {
        this.submitting = false;
        this.statusType = 'error';
        this.statusMessage = err?.error?.message || err?.message || 'Failed to delete site. Please try again.';
      }
    });
  }
}
