import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';

export interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-single-select',
  imports: [CommonModule],
  templateUrl: './single-select.component.html',
})
export class SingleSelectComponent implements AfterViewInit, OnDestroy {
  @Input() options: SelectOption[] = [];
  @Input() placeholder: string = 'Select an option';
  @Input() value: string = '';
  @Input() disabled: boolean = false;
  @Input() className: string = '';

  @Output() valueChange = new EventEmitter<string>();

  isOpen = false;

  @ViewChild('containerRef') containerRef!: ElementRef<HTMLDivElement>;

  private handleClickOutside = (event: MouseEvent) => {
    if (
      this.isOpen &&
      this.containerRef &&
      !this.containerRef.nativeElement.contains(event.target as Node)
    ) {
      this.isOpen = false;
    }
  };

  ngAfterViewInit() {
    document.addEventListener('mousedown', this.handleClickOutside);
  }

  ngOnDestroy() {
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  toggleDropdown() {
    if (!this.disabled) this.isOpen = !this.isOpen;
  }

  select(option: SelectOption) {
    this.value = option.value;
    this.isOpen = false;
    this.valueChange.emit(option.value);
  }

  get selectedLabel(): string {
    return this.options.find((o) => o.value === this.value)?.label || '';
  }
}
