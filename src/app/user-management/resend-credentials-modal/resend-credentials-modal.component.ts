import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-resend-credentials-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './resend-credentials-modal.component.html',
  styles: ``
})
export class ResendCredentialsModalComponent {
  readonly user = input.required<any>();
  readonly orgId = input<string>('');
  readonly close = output<void>();
  readonly sent = output<void>();

  sending = false;
  statusMessage = '';
  statusType: '' | 'success' | 'error' = '';

  constructor(private userService: UserService) {}

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

    this.sending = true;
    this.statusMessage = '';
    this.statusType = '';

    const payload = { email: this.user()?.email, password: '' };

    this.userService.resendCredentials(orgId, this.user().id, payload).subscribe({
      next: () => {
        this.sending = false;
        this.statusType = 'success';
        this.statusMessage = `Login credentials sent to ${this.user()?.email || 'the user'} successfully.`;
        setTimeout(() => this.sent.emit(), 900);
      },
      error: (err: any) => {
        this.sending = false;
        this.statusType = 'error';
        this.statusMessage = err?.error?.message || err?.message || 'Failed to resend credentials. Please try again.';
      }
    });
  }
}
