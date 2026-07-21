import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-reactivate-user-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './reactivate-user-modal.component.html',
  styles: ``
})
export class ReactivateUserModalComponent {
  readonly user = input.required<any>();
  readonly orgId = input<string>('');
  readonly close = output<void>();
  readonly reactivated = output<void>();

  submitting = false;
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
    this.submitting = true;
    this.statusMessage = '';
    this.statusType = '';
    this.userService.reactivateUser(orgId, this.user().id).subscribe({
      next: () => {
        this.submitting = false;
        this.statusType = 'success';
        this.statusMessage = `${this.user()?.name || 'User'} has been reactivated successfully.`;
        setTimeout(() => this.reactivated.emit(), 900);
      },
      error: (err: any) => {
        this.submitting = false;
        this.statusType = 'error';
        this.statusMessage = err?.error?.message || err?.message || 'Failed to reactivate user. Please try again.';
      }
    });
  }
}
