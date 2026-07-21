import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, OnChanges, SimpleChanges, OnDestroy, AfterViewInit } from '@angular/core';
import flatpickr from 'flatpickr';
import { LabelComponent } from '../label/label.component';
import "flatpickr/dist/flatpickr.css";

@Component({
  selector: 'app-datetime-picker',
  imports: [LabelComponent],
  templateUrl: './datetime-picker.component.html',
  styles: ``
})
export class DateTimePickerComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() id?: string;
  @Input() label?: string;
  @Input() placeholder: string = 'Select date & time';
  @Input() value?: string;
  @Input() defaultDate?: string | Date;

  @Output() valueChange = new EventEmitter<string>();

  @ViewChild('dateTimeInput', { static: false }) dateTimeInput!: ElementRef<HTMLInputElement>;

  private flatpickrInstance: flatpickr.Instance | undefined;

  ngAfterViewInit() {
    if (!this.dateTimeInput || !this.dateTimeInput.nativeElement) {
      console.error('DateTimePickerComponent: dateTimeInput reference not found');
      return;
    }

    try {
      this.flatpickrInstance = flatpickr(this.dateTimeInput.nativeElement, {
        enableTime: true,
        time_24hr: true,
        dateFormat: 'Y-m-d H:i',
        minuteIncrement: 5,
        defaultDate: (this.value || this.defaultDate) as any,
        onChange: (_selectedDates, dateStr) => {
          this.valueChange.emit(dateStr.replace(' ', 'T'));
        }
      });
    } catch (error) {
      console.error('DateTimePickerComponent: Failed to initialize flatpickr:', error);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!changes['value'] || !this.flatpickrInstance) return;
    try {
      const current = changes['value'].currentValue;
      const previous = changes['value'].previousValue;
      if (current === previous) return;
      if (current) {
        this.flatpickrInstance.setDate(current, false);
      } else {
        this.flatpickrInstance.clear(false);
      }
    } catch (error) {
      console.error('DateTimePickerComponent: Error updating date in ngOnChanges:', error);
    }
  }

  ngOnDestroy() {
    if (this.flatpickrInstance) {
      this.flatpickrInstance.destroy();
    }
  }
}
