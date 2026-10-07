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
  private recentMessages = new Map<string, number>(); // message -> timestamp
  private readonly DEDUPE_WINDOW_MS = 2000; // don't show same message within 2s

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

  private show(toast: Omit<Toast, 'id' | 'createdAt'>): void {
    // Dedupe: don't show identical message within DEDUPE_WINDOW_MS
    const now = Date.now();
    const lastShown = this.recentMessages.get(toast.message);
    if (lastShown && now - lastShown < this.DEDUPE_WINDOW_MS) {
      return; // skip duplicate
    }
    this.recentMessages.set(toast.message, now);

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
