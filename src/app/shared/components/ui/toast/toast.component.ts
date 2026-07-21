import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styles: [`
    @keyframes toast-in {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    .toast-item {
      animation: toast-in 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
    @keyframes toast-progress {
      from { width: 100%; }
      to { width: 0%; }
    }
    .toast-progress {
      animation: toast-progress linear forwards;
    }
  `]
})
export class ToastComponent implements OnDestroy {
  private toastService = inject(ToastService);
  toasts = this.toastService.toasts$;

  dismiss(id: number): void {
    this.toastService.dismiss(id);
  }

  getProgressStyle(toast: Toast): { animationDuration: string; display: string } {
    const duration = toast.duration ?? 4000;
    if (duration === 0) {
      return { animationDuration: '0s', display: 'none' };
    }
    return { animationDuration: `${duration}ms`, display: 'block' };
  }

  getIcon(type: Toast['type']): string {
    switch (type) {
      case 'success':
        return `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
      case 'error':
        return `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
      case 'warning':
        return `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
      case 'info':
      default:
        return `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }
  }

  getTypeStyles(type: Toast['type']): { container: string; icon: string; progress: string } {
    switch (type) {
      case 'success':
        return {
          container: 'bg-white border-green-200 shadow-green-100',
          icon: 'text-green-600 bg-green-50',
          progress: 'bg-green-500'
        };
      case 'error':
        return {
          container: 'bg-white border-red-200 shadow-red-100',
          icon: 'text-red-600 bg-red-50',
          progress: 'bg-red-500'
        };
      case 'warning':
        return {
          container: 'bg-white border-amber-200 shadow-amber-100',
          icon: 'text-amber-600 bg-amber-50',
          progress: 'bg-amber-500'
        };
      case 'info':
      default:
        return {
          container: 'bg-white border-indigo-200 shadow-indigo-100',
          icon: 'text-indigo-600 bg-indigo-50',
          progress: 'bg-indigo-500'
        };
    }
  }

  ngOnDestroy(): void {}
}
