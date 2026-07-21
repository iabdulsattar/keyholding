import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class IdleService {
  private readonly TIMEOUT_MS = 30 * 60 * 1000;
  private readonly EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
  private timerId: any = null;
  private isRunning = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private ngZone: NgZone,
  ) {}

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.resetTimer();
    this.ngZone.runOutsideAngular(() => {
      this.EVENTS.forEach(event => document.addEventListener(event, this.onActivity, true));
    });
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;
    this.clearTimer();
    this.EVENTS.forEach(event => document.removeEventListener(event, this.onActivity, true));
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  private onActivity = () => {
    this.ngZone.run(() => this.resetTimer());
  };

  private onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      this.ngZone.run(() => this.resetTimer());
    } else {
      this.clearTimer();
    }
  };

  private resetTimer(): void {
    this.clearTimer();
    this.timerId = setTimeout(() => {
      this.logout();
    }, this.TIMEOUT_MS);
  }

  private clearTimer(): void {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  private logout(): void {
    this.stop();
    this.authService.clearTokens();
    this.router.navigate(['/signin']);
  }
}
