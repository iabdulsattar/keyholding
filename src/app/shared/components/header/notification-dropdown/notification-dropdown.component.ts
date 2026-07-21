import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { DropdownItemComponent } from '../../ui/dropdown/dropdown-item/dropdown-item.component';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Notification } from '../../../../core/models/notification.models';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-notification-dropdown',
  templateUrl: './notification-dropdown.component.html',
  imports: [CommonModule, RouterModule, DropdownComponent, DropdownItemComponent]
})
export class NotificationDropdownComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);

  isOpen = false;
  notifying = true;

  notifications: Notification[] = [];
  unreadCount = 0;
  loading = false;
  userId: string | null = null;

  ngOnInit(): void {
    this.loadUserId();
  }

  private loadUserId(): void {
    this.authService.getUserId().subscribe({
      next: (id) => {
        this.userId = id;
        this.loadUnreadCount();
        this.loadNotifications();
      },
      error: () => {
        this.userId = null;
      }
    });
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.notifying = false;
      this.loadNotifications();
      if (this.unreadCount > 0 && this.userId) {
        this.notificationService.markAllRead(this.userId).subscribe({
          next: () => {
            this.unreadCount = 0;
            this.notifications = this.notifications.map(n => ({ ...n, read: true }));
          },
          error: () => {}
        });
      }
    }
  }

  closeDropdown(): void {
    this.isOpen = false;
  }

  private loadNotifications(): void {
    if (!this.userId || this.loading) return;
    this.loading = true;
    this.notificationService.list({ userId: this.userId, page: 0, size: 10 }).subscribe({
      next: (data) => {
        this.notifications = data?.notifications ?? [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  private loadUnreadCount(): void {
    if (!this.userId) return;
    this.notificationService.unreadCount(this.userId).subscribe({
      next: (data) => {
        this.unreadCount = data?.count ?? 0;
        this.notifying = this.unreadCount > 0;
      },
      error: () => {
        this.unreadCount = 0;
        this.notifying = false;
      }
    });
  }

  markNotificationRead(notificationId: string): void {
    if (!this.userId) return;
    this.notificationService.markOneRead(notificationId).subscribe({
      next: () => {
        this.notifications = this.notifications.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        );
        this.unreadCount = Math.max(0, this.unreadCount - 1);
        if (this.unreadCount === 0) {
          this.notifying = false;
        }
      },
      error: () => {}
    });
  }

  formatTime(iso: string): string {
    if (!iso) return '';
    const date = new Date(iso);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHr < 24) return `${diffHr} hr ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  }
}
