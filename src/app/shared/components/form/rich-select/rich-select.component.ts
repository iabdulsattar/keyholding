import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export interface RichSelectOption {
  value: string;
  label: string;
  description?: string;
  iconSvg?: string;
  iconBg?: string;
}

@Component({
  selector: 'app-rich-select',
  imports: [CommonModule, FormsModule],
  templateUrl: './rich-select.component.html',
  styles: ``
})
export class RichSelectComponent implements AfterViewInit, OnDestroy {
  @Input() options: RichSelectOption[] = [];
  @Input() value: string = '';
  @Input() placeholder: string = 'Select an option';
  @Input() disabled: boolean = false;
  @Input() showSearch: boolean = false;
  @Input() allowAddNew: boolean = false;
  @Input() addNewLabel: string = 'Add new';
  @Input() panelWidth: 'full' | 'wide' = 'full';

  @Output() valueChange = new EventEmitter<string>();
  @Output() addNew = new EventEmitter<void>();

  @ViewChild('containerRef') containerRef!: ElementRef<HTMLDivElement>;

  isOpen = false;
  searchTerm = '';

  readonly checkSvg =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';

  constructor(private sanitizer: DomSanitizer) {}

  ngAfterViewInit() {
    document.addEventListener('mousedown', this.handleClickOutside);
  }

  ngOnDestroy() {
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  private handleClickOutside = (event: MouseEvent) => {
    if (this.isOpen && this.containerRef && !this.containerRef.nativeElement.contains(event.target as Node)) {
      this.isOpen = false;
    }
  };

  get selectedOption(): RichSelectOption | undefined {
    return this.options.find((o) => o.value === this.value);
  }

  get filteredOptions(): RichSelectOption[] {
    if (!this.searchTerm.trim()) return this.options;
    const q = this.searchTerm.toLowerCase();
    return this.options.filter((o) => o.label.toLowerCase().includes(q));
  }

  toggle(): void {
    if (!this.disabled) this.isOpen = !this.isOpen;
  }

  onSearch(value: string): void {
    this.searchTerm = value;
  }

  select(option: RichSelectOption): void {
    this.value = option.value;
    this.isOpen = false;
    this.searchTerm = '';
    this.valueChange.emit(option.value);
  }

  onAddNew(): void {
    this.isOpen = false;
    this.addNew.emit();
  }

  html(markup: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(markup || '');
  }
}
