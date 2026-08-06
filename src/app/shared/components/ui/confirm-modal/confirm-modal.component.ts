import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './confirm-modal.component.html',
  styles: ``
})
export class ConfirmModalComponent {
  readonly title = input<string>('');
  readonly message = input<string>('');
  readonly confirmText = input<string>('Confirm');
  readonly cancelText = input<string>('Cancel');
  readonly confirmClass = input<string>('bg-red-500 hover:bg-red-600');
  readonly icon = input<string>('');
  readonly submitting = input(false);
  readonly errorMessage = input('');

  readonly close = output<void>();
  readonly confirmed = output<void>();
}
