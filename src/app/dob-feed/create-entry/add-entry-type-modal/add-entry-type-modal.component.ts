import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../shared/components/ui/modal/modal.component';
import { EdobService } from '../../../core/services/edob.service';

@Component({
  selector: 'app-add-entry-type-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './add-entry-type-modal.component.html',
  styles: ``
})
export class AddEntryTypeModalComponent {
  readonly orgId = input.required<string>();
  readonly type = input<'incident' | 'handover'>('incident');
  readonly close = output<void>();
  readonly created = output<any>();

  name = '';
  color = '';
  description = '';
  isSubmitting = false;
  errorMessage = '';

  colorOptions = [
    { value: '', label: 'None' },
    { value: 'red', label: 'Red' },
    { value: 'orange', label: 'Orange' },
    { value: 'yellow', label: 'Yellow' },
    { value: 'green', label: 'Green' },
    { value: 'blue', label: 'Blue' },
    { value: 'purple', label: 'Purple' },
    { value: 'pink', label: 'Pink' },
    { value: 'gray', label: 'Gray' },
  ];

  get title(): string {
    return this.type() === 'incident' ? 'Add Incident Type' : 'Add Handover Type';
  }

  constructor(private edobService: EdobService) {}

  cancel(): void {
    this.close.emit();
  }

  confirm(): void {
    const trimmedName = this.name.trim();
    if (!trimmedName) return;

    this.isSubmitting = true;
    this.errorMessage = '';

    const orgId = this.orgId();
    if (!orgId) {
      this.errorMessage = 'Organization context is missing.';
      this.isSubmitting = false;
      return;
    }

    const code = trimmedName.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '') || (this.type() === 'incident' ? 'INCIDENT_TYPE' : 'HANDOVER_TYPE');

    const payload: any = {
      code,
      name: trimmedName,
      active: true,
    };
    if (this.color) payload.color = this.color;
    if (this.description.trim()) payload.description = this.description.trim();

    const service = this.type() === 'incident'
      ? this.edobService.createIncidentType(orgId, payload)
      : this.edobService.createHandoverType(orgId, payload);

    service.subscribe({
      next: (t: any) => {
        this.isSubmitting = false;
        this.name = '';
        this.color = '';
        this.description = '';
        this.created.emit(t);
        this.close.emit();
      },
      error: (err: any) => {
        this.isSubmitting = false;
        this.errorMessage = err?.error?.message || err?.message || 'Failed to create entry type. Please try again.';
      }
    });
  }
}
