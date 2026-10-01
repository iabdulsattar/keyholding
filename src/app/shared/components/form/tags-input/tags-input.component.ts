import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tags-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tags-input.component.html',
})
export class TagsInputComponent {
  @Input() tags: string[] = [];
  @Input() placeholder = 'name@company.com';
  @Input() pattern: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  @Input() invalidMessage = 'Please enter a valid email address';
  @Input() disabled = false;
  @Input() duplicateMessage = 'This email is already added';

  @Output() tagsChange = new EventEmitter<string[]>();

  @ViewChild('tagInput') tagInput?: ElementRef<HTMLInputElement>;

  draft = '';
  draftInvalid = false;
  duplicateError = false;

  get inputSize(): number {
    return Math.max(this.draft.length, 1);
  }

  get containerClasses(): string {
    if (this.draftInvalid) return 'border-red-400 ring-2 ring-red-100';
    if (this.duplicateError) return 'border-amber-400 ring-2 ring-amber-100';
    return 'border-slate-200 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100';
  }

  focusInput(): void {
    if (!this.disabled) this.tagInput?.nativeElement.focus();
  }

  onDraftInput(): void {
    this.draftInvalid = false;
    this.duplicateError = false;
  }

  onKeydown(event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;
    const key = event.key;

    if (key === 'Enter' || key === ',' || key === ';' || key === 'Tab') {
      event.preventDefault();
      this.draft = input.value;
      this.commit();
      return;
    }

    if (key === 'Escape') {
      event.preventDefault();
      this.cancel();
      return;
    }

    if (key === 'Backspace' && input.value === '' && this.tags.length > 0) {
      this.remove(this.tags[this.tags.length - 1], event);
    }
  }

  onPaste(event: ClipboardEvent): void {
    const pasted = event.clipboardData?.getData('text') ?? '';
    if (!pasted) return;

    const candidates = pasted
      .split(/[,;\s]+/)
      .map(v => v.trim().toLowerCase())
      .filter(Boolean);

    const current = this.draft.trim().toLowerCase();
    const values = current ? [current, ...candidates] : candidates;
    const valid = values.filter(v => this.pattern.test(v));
    const unique = valid.filter((v, i) => valid.indexOf(v) === i && !this.tags.some(t => t.toLowerCase() === v));

    if (unique.length === 0) {
      event.preventDefault();
      this.draftInvalid = true;
      return;
    }

    event.preventDefault();
    this.tagsChange.emit([...this.tags, ...unique]);
    this.cancel();
  }

  commit(): void {
    const value = this.draft.trim().toLowerCase();

    if (!value) {
      this.cancel();
      return;
    }

    if (!this.pattern.test(value)) {
      this.draftInvalid = true;
      return;
    }

    if (this.tags.some(t => t.toLowerCase() === value)) {
      this.duplicateError = true;
      return;
    }

    this.tagsChange.emit([...this.tags, value]);
    this.cancel();
  }

  cancel(): void {
    this.draft = '';
    this.draftInvalid = false;
    this.duplicateError = false;
  }

  remove(tag: string, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.tagsChange.emit(this.tags.filter(t => t !== tag));
    this.focusInput();
  }
}
