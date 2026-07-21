import { Component, ElementRef, AfterViewInit, ViewChild, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-rich-text-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RichTextEditorComponent),
      multi: true,
    },
  ],
  template: `
    <div class="border border-gray-200 rounded-xl bg-white overflow-hidden" [class.opacity-60]="disabled">
      <div class="flex items-center gap-1 px-3 py-2 border-b border-gray-100 text-gray-500">
        <button type="button" (mousedown)="$event.preventDefault()" (click)="exec('bold')"
          class="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-50 font-bold text-[13px]" title="Bold">B</button>
        <button type="button" (mousedown)="$event.preventDefault()" (click)="exec('italic')"
          class="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-50 italic text-[13px]" title="Italic">I</button>
        <button type="button" (mousedown)="$event.preventDefault()" (click)="exec('underline')"
          class="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-50 underline text-[13px]" title="Underline">U</button>
        <div class="w-px h-5 bg-gray-200 mx-1"></div>
        <button type="button" (mousedown)="$event.preventDefault()" (click)="exec('insertUnorderedList')"
          class="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-50" title="Bullet list">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>
        </button>
        <button type="button" (mousedown)="$event.preventDefault()" (click)="exec('insertOrderedList')"
          class="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-50" title="Numbered list">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="6" x2="20" y2="6"/><line x1="10" y1="12" x2="20" y2="12"/><line x1="10" y1="18" x2="20" y2="18"/><path d="M4 6h1v4M4 10h2"/><path d="M4 14h2v1.5H4v2h2"/></svg>
        </button>
        <div class="w-px h-5 bg-gray-200 mx-1"></div>
        <button type="button" (mousedown)="$event.preventDefault()" (click)="addLink()"
          class="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-50" title="Insert link">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007.07 0l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.07 0l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
        </button>
      </div>
      <div
        #editor
        class="rte-content px-4 py-3.5 text-sm outline-none resize-none min-h-[140px]"
        contenteditable="true"
        [class.pointer-events-none]="disabled"
        [attr.data-placeholder]="placeholder"
        (input)="onInput($event)"
        (blur)="onTouched()"></div>
      <div class="flex justify-end px-4 py-3 border-t border-gray-100">
        <span class="text-[11px] text-gray-400">{{ charCount }} / {{ maxLength }}</span>
      </div>
    </div>
  `,
  styles: [
    `
      .rte-content { white-space: pre-wrap; word-break: break-word; }
      .rte-content:empty:before { content: attr(data-placeholder); color: #9ca3af; }
      .rte-content ul, .rte-content ol { padding-left: 1.25rem; margin: 0.25rem 0; }
      .rte-content a { color: #4f46e5; text-decoration: underline; }
    `,
  ],
})
export class RichTextEditorComponent implements ControlValueAccessor, AfterViewInit {
  @ViewChild('editor') editorRef!: ElementRef<HTMLDivElement>;
  @Input() placeholder = '';
  @Input() maxLength = 5000;

  charCount = 0;
  disabled = false;

  private html = '';
  onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  ngAfterViewInit(): void {
    this.render();
  }

  writeValue(value: string): void {
    this.html = value || '';
    this.updateCount();
    if (this.editorRef?.nativeElement) {
      this.render();
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: Event): void {
    const target = event.target as HTMLDivElement;
    this.html = target.innerHTML;
    this.updateCount();
    this.onChange(this.html);
  }

  exec(command: string, value: string | null = null): void {
    this.editorRef?.nativeElement.focus();
    document.execCommand(command, false, value ?? undefined);
    this.onInput({ target: this.editorRef.nativeElement } as unknown as Event);
  }

  addLink(): void {
    const url = window.prompt('Enter URL');
    if (!url) return;
    this.exec('createLink', url);
  }

  private render(): void {
    const el = this.editorRef.nativeElement;
    if (el.innerHTML !== this.html) {
      el.innerHTML = this.html;
    }
    this.updateCount();
  }

  private updateCount(): void {
    const tmp = document.createElement('div');
    tmp.innerHTML = this.html;
    this.charCount = (tmp.textContent || '').length;
  }
}
