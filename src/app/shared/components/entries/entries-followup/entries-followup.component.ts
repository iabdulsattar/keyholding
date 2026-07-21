import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonComponent } from '../../ui/button/button.component';
import { TableEntry } from '../entries-table/entries-table.component';

@Component({
  selector: 'app-entries-followup',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './entries-followup.component.html',
})
export class EntriesFollowupComponent {
  @Input() entry: TableEntry | null = null;
  @Output() edit = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  formatDateTime(iso: string): string {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  typeBadgeClass(code: string): string {
    switch (code) {
      case 'INCIDENT':
        return 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400';
      case 'HANDOVER':
        return 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400';
      case 'FOLLOW_UP':
        return 'bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400';
      case 'BASIC':
      default:
        return 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400';
    }
  }

  statusDotClass(code: string): string {
    switch (code) {
      case 'IN_PROGRESS':
        return 'bg-amber-500';
      case 'COMPLETED':
        return 'bg-emerald-500';
      case 'CANCELLED':
        return 'bg-rose-500';
      case 'ASSIGNED':
      case 'NEW':
      default:
        return 'bg-brand-500';
    }
  }

  priorityDotClass(code: string): string {
    switch (code) {
      case 'MEDIUM':
        return 'bg-amber-500';
      case 'HIGH':
      case 'CRITICAL':
        return 'bg-rose-500';
      case 'LOW':
      case 'NORMAL':
      default:
        return 'bg-gray-400';
    }
  }

  initials(name: string): string {
    if (!name || name === '-') return '?';
    return name
      .split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  onEdit() {
    this.edit.emit();
  }

  onClose() {
    this.close.emit();
  }
}
