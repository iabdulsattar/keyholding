import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';

export interface Option {
  value: string;
  text: string;
}

@Component({
  selector: 'app-multi-select',
  imports: [CommonModule],
  templateUrl: './multi-select.component.html',
})
export class MultiSelectComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {

  @Input() label: string = '';
  @Input() options: Option[] = [];
  @Input() defaultSelected: string[] = [];
  @Input() disabled: boolean = false;
  @Output() selectionChange = new EventEmitter<string[]>();

  selectedOptions: string[] = [];
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

  ngOnInit() {
    this.selectedOptions = [...this.defaultSelected];
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['defaultSelected']) {
      this.selectedOptions = [...(changes['defaultSelected'].currentValue || [])];
    }
    if (changes['options']) {
      const current = changes['options'].currentValue || [];
      this.selectedOptions = this.selectedOptions.filter(v => current.some((o: Option) => o.value === v));
    }
  }

  toggleDropdown() {
    if (!this.disabled) this.isOpen = !this.isOpen;
  }

  handleSelect(optionValue: string) {
    if (this.selectedOptions.includes(optionValue)) {
      this.selectedOptions = this.selectedOptions.filter(v => v !== optionValue);
    } else {
      this.selectedOptions = [...this.selectedOptions, optionValue];
    }
    this.selectionChange.emit([...this.selectedOptions]);
  }

  removeOption(value: string) {
    this.selectedOptions = this.selectedOptions.filter(opt => opt !== value);
    this.selectionChange.emit([...this.selectedOptions]);
  }

  get selectedValuesText(): string[] {
    return this.selectedOptions
      .map(value => this.options.find(option => option.value === value)?.text || '')
      .filter(Boolean);
  }
}
