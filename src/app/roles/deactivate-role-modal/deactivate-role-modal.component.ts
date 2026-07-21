import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';

@Component({
  selector: 'app-deactivate-role-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './deactivate-role-modal.component.html',
  styles: ``
})
export class DeactivateRoleModalComponent {
  readonly role = input.required<any>();
  readonly orgId = input<string>('');
  readonly isOpen = input<boolean>(false);
  readonly close = output<void>();
  readonly confirm = output<void>();

  cancel(): void {
    this.close.emit();
  }

  onConfirm(): void {
    this.confirm.emit();
  }
}
