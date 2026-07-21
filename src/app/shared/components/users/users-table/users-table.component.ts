import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

export interface TableUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
  status: 'Active' | 'Inactive';
  lastLogin: string;
  created: string;
  img: number;
  raw: any;
}

@Component({
  selector: 'app-users-table',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './users-table.component.html',
})
export class UsersTableComponent {
  @Input() users: TableUser[] = [];
  @Input() loading = false;
  @Input() total = 0;
  @Input() page = 0;
  @Input() size = 10;
  @Input() showingText = '';
  @Input() currentUserId: string | null = null;

  @Output() rowClick = new EventEmitter<TableUser>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() resendCredentials = new EventEmitter<TableUser>();

  searchTerm = '';

  get filteredUsers(): TableUser[] {
    if (!this.currentUserId) return this.users;
    return this.users.filter((u) => u.id !== this.currentUserId);
  }

  get filteredTotal(): number {
    return this.filteredUsers.length;
  }

  openMenuId: string | null = null;

  toggleMenu(user: TableUser, event: MouseEvent) {
    event.stopPropagation();
    this.openMenuId = this.openMenuId === user.id ? null : user.id;
  }

  closeMenu() {
    this.openMenuId = null;
  }

  onResendCredentials(user: TableUser, event: MouseEvent) {
    event.stopPropagation();
    this.openMenuId = null;
    this.resendCredentials.emit(user);
  }

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
}
