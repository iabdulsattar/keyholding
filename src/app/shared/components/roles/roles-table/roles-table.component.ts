import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Role } from '../../../../core/models/edob.models';

@Component({
  selector: 'app-roles-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './roles-table.component.html',
})
export class RolesTableComponent {
  @Input() roles: Role[] = [];
  @Input() loading = false;
  @Input() total = 0;
  @Input() page = 0;
  @Input() size = 10;
  @Input() showingText = '';

  @Output() rowClick = new EventEmitter<Role>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() roleDeactivate = new EventEmitter<Role>();
  @Output() roleReactivate = new EventEmitter<Role>();
  @Output() roleDelete = new EventEmitter<Role>();

  searchTerm = '';
  openMenuId: string | null = null;

  get totalPages(): number {
    const safeTotal = Number(this.total) || 0;
    const safeSize = Number(this.size) || 10;
    return Math.max(1, Math.ceil(safeTotal / safeSize));
  }

  get visiblePages(): (number | '...')[] {
    const pages: (number | '...')[] = [];
    const total = this.totalPages;
    const current = Number(this.page) || 0;
    if (total <= 7) {
      for (let i = 0; i < total; i++) pages.push(i);
      return pages;
    }
    pages.push(0);
    if (current > 2) pages.push('...');
    const start = Math.max(1, current - 1);
    const end = Math.min(total - 2, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (current < total - 3) pages.push('...');
    pages.push(total - 1);
    return pages;
  }

  onSearchInput(value: string) {
    this.searchTerm = value;
    this.searchChange.emit(value);
  }

  goToPage(page: number) {
    const target = Number(page);
    if (Number.isInteger(target) && target >= 0 && target < this.totalPages) {
      this.pageChange.emit(target);
    }
  }

  getStatusClass(role: Role): string {
    return role.active
      ? 'bg-green-50 text-green-600'
      : 'bg-slate-100 text-slate-500';
  }

  toggleMenu(roleId: string, event: Event): void {
    event.stopPropagation();
    this.openMenuId = this.openMenuId === roleId ? null : roleId;
  }

  closeMenu(): void {
    this.openMenuId = null;
  }

  onRowClick(event: Event, role: Role): void {
    const target = event.target as HTMLElement | null;
    if (target && target.closest('[data-actions]')) return;
    this.rowClick.emit(role);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement | null;
    if (target && target.closest('[data-actions]')) return;
    this.openMenuId = null;
  }

  getColorClass(color?: string): string {
    const map: Record<string, string> = {
      purple: 'bg-purple-50 text-purple-700',
      blue: 'bg-blue-50 text-blue-700',
      green: 'bg-green-50 text-green-700',
      orange: 'bg-orange-50 text-orange-700',
      red: 'bg-red-50 text-red-700',
      teal: 'bg-teal-50 text-teal-700',
      gray: 'bg-gray-100 text-gray-700',
    };
    return map[color || ''] || 'bg-slate-100 text-slate-700';
  }
}
