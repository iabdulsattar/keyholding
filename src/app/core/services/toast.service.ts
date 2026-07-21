import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
  duration?: number;
  createdAt: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toasts: Toast[] = [];
  private toastSubject = new Subject<Toast[]>();
  private idCounter = 0;

  get toasts$(): Observable<Toast[]> {
    return this.toastSubject.asObservable();
  }

  success(message: string, duration = 4000): void {
    this.show({ type: 'success', message, duration });
  }

  error(message: string, duration = 5000): void {
    this.show({ type: 'error', message, duration });
  }

  warning(message: string, duration = 4000): void {
    this.show({ type: 'warning', message, duration });
  }

  info(message: string, duration = 4000): void {
    this.show({ type: 'info', message, duration });
  }

  show(toast: Omit<Toast, 'id' | 'createdAt'>): void {
    const id = ++this.idCounter;
    const createdAt = Date.now();
    this.toasts = [...this.toasts, { ...toast, id, createdAt }];
    this.toastSubject.next([...this.toasts]);

    if (toast.duration !== 0) {
      setTimeout(() => this.dismiss(id), toast.duration ?? 4000);
    }
  }

  dismiss(id: number): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.toastSubject.next([...this.toasts]);
  }

  dismissAll(): void {
    this.toasts = [];
    this.toastSubject.next([]);
  }
}
