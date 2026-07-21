import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-faq-item-two',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rounded-xl border border-gray-200 dark:border-gray-800">
      <button type="button" (click)="toggle.emit()" class="w-full flex items-center justify-between px-5 py-4 text-left">
        <span class="text-sm font-medium text-gray-900 dark:text-white">{{ title }}</span>
      </button>
      <div class="px-5 pb-4 text-sm text-gray-500 dark:text-gray-400" *ngIf="isOpen">
        {{ content }}
      </div>
    </div>
  `,
  styles: ``
})
export class FaqItemTwoComponent {
  @Input() title = '';
  @Input() content = '';
  @Input() isOpen = false;
  @Output() toggle = new EventEmitter<void>();
}
