import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { UserService } from '../../core/services/user.service';
import { DeactivateReason } from '../../core/models/user.models';

@Component({
  selector: 'app-deactivate-user-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './deactivate-user-modal.component.html',
  styles: ``
})
export class DeactivateUserModalComponent {
  readonly user = input.required<any>();
  readonly orgId = input<string>('');
  readonly close = output<void>();
  readonly deactivated = output<void>();

  reasons: { label: string; value: DeactivateReason }[] = [
    { label: 'Employee exit', value: 'LEFT_COMPANY' },
    { label: 'Policy violation', value: 'POLICY_VIOLATION' },
    { label: 'Extended leave', value: 'TEMPORARY_LEAVE' },
    { label: 'Duplicate account', value: 'ROLE_CHANGE' },
    { label: 'Other', value: 'OTHER' },
  ];

  selectedReason: DeactivateReason | '' = '';
  additionalNote = '';
  submitting = false;
  statusMessage = '';
  statusType: '' | 'success' | 'error' = '';

  constructor(private userService: UserService) {}

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
    if (!this.user()?.id || !this.selectedReason) return;
    const orgId = this.orgId();
    if (!orgId) {
      this.statusType = 'error';
      this.statusMessage = 'Organization context is missing. Please reload the page and try again.';
      return;
    }
    this.submitting = true;
    this.statusMessage = '';
    this.statusType = '';
    this.userService.deactivateUser(orgId, this.user().id, {
      reason: this.selectedReason,
      note: this.additionalNote || undefined,
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.statusType = 'success';
        this.statusMessage = `${this.user()?.name || 'User'} has been deactivated successfully.`;
        setTimeout(() => this.deactivated.emit(), 900);
      },
      error: (err: any) => {
        this.submitting = false;
        this.statusType = 'error';
        this.statusMessage = err?.error?.message || err?.message || 'Failed to deactivate user. Please try again.';
      }
    });
  }
}
