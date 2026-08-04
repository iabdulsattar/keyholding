import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { ClientService } from '../../core/services/client.service';

@Component({
  selector: 'app-deactivate-site-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './deactivate-site-modal.component.html',
  styles: ``
})
export class DeactivateSiteModalComponent {
  readonly site = input.required<any>();
  readonly orgId = input<string>('');
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
    if (!this.site()?.id || !this.orgId()) return;
    this.submitting = true;
    this.statusMessage = '';
    this.statusType = '';
    this.clientService.deactivateSite(this.orgId(), this.site().id).subscribe({
      next: () => {
        this.submitting = false;
        this.statusType = 'success';
        this.statusMessage = 'Site deactivated successfully.';
        setTimeout(() => this.confirmed.emit(), 900);
      },
      error: (err: any) => {
        this.submitting = false;
        this.statusType = 'error';
        this.statusMessage = err?.error?.message || err?.message || 'Failed to deactivate site. Please try again.';
      }
    });
  }
}
