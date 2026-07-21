import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PermissionService } from '../services/permission.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshQueue: Array<(token: string | null) => void> = [];

  // Refresh the access token this many ms before it actually expires,
  // so the user never hits a 401 mid-request.
  private readonly REFRESH_THRESHOLD_MS = 60 * 1000;

  private readonly DEFAULT_EXPIRY_MS = 24 * 60 * 60 * 1000;

  constructor(
    private router: Router,
    private authService: AuthService,
    private permissionService: PermissionService,
  ) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (this.isPublicAuthPath(req.url)) {
      return next.handle(req);
    }

    const token = this.getAccessToken();

    if (!token) {
      return next.handle(req);
    }

    const exp = this.decodeExp(token);
    const timeToExpiry = exp !== null ? exp - Date.now() : null;

    if (timeToExpiry !== null && timeToExpiry < this.REFRESH_THRESHOLD_MS) {
      return this.refreshAndProceed(req, next);
    }

    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });

    return next.handle(req).pipe(
      catchError((err) => {
        if (err instanceof HttpErrorResponse && err.status === 401) {
          return this.refreshAndProceed(req, next);
        }
        return throwError(() => err);
      })
    );
  }

  private refreshAndProceed(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (this.isRefreshing) {
      return new Observable<HttpEvent<unknown>>((observer) => {
        this.refreshQueue.push((token) => {
          if (!token) {
            observer.error(new HttpErrorResponse({ status: 401 }));
            observer.complete();
            return;
          }
          next
            .handle(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }))
            .subscribe({
              next: (res) => observer.next(res),
              error: (e) => observer.error(e),
              complete: () => observer.complete(),
            });
        });
      });
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.clearTokens();
      this.router.navigate(['/signin']);
      return throwError(() => new HttpErrorResponse({ status: 401 }));
    }

    this.isRefreshing = true;
    console.log('[AuthInterceptor] Refreshing access token...');
    return from(this.authService.refresh({ refreshToken })).pipe(
      switchMap((res: any) => {
        this.isRefreshing = false;
        const newToken = res?.access_token;
        const newRefreshToken = res?.refresh_token;

        if (!newToken) {
          console.error('[AuthInterceptor] Refresh response missing access_token');
          this.flushQueue(null);
          this.clearTokens();
          this.router.navigate(['/signin']);
          return throwError(() => new HttpErrorResponse({ status: 401 }));
        }

        this.setAccessToken(newToken);
        if (newRefreshToken) {
          this.setRefreshToken(newRefreshToken);
        }
        console.log('[AuthInterceptor] Token refreshed successfully');
        this.flushQueue(newToken);
        return next.handle(req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }));
      }),
      catchError((err) => {
        this.isRefreshing = false;
        this.flushQueue(null);
        this.clearTokens();
        console.error('[AuthInterceptor] Token refresh failed', err);
        this.router.navigate(['/signin']);
        return throwError(() => err);
      })
    );
  }

  private flushQueue(token: string | null) {
    this.refreshQueue.forEach((callback) => callback(token));
    this.refreshQueue = [];
  }

  private isPublicAuthPath(url: string): boolean {
    const publicPaths = [
      '/api/v1/auth/signup',
      '/api/v1/auth/login',
      '/api/v1/auth/signup/verify-otp',
      '/api/v1/auth/login/verify-2fa',
      '/api/v1/auth/password/request-reset',
      '/api/v1/auth/password/reset',
      '/api/v1/auth/invitations',
      '/api/v1/auth/refresh',
    ];
    return publicPaths.some((path) => url.includes(path));
  }

  private decodeExp(token: string): number | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      const payload = JSON.parse(
        atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
      );
      return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  }

  private getAccessToken(): string | null {
    return this.authService.getAccessToken();
  }

  private getRefreshToken(): string | null {
    return this.authService.getRefreshToken();
  }

  private setAccessToken(token: string) {
    const exp = this.decodeExp(token) ?? Date.now() + this.DEFAULT_EXPIRY_MS;
    const expiresAt = String(exp);
    this.authService.setTokens(token, this.getRefreshToken(), expiresAt);
  }

  private setRefreshToken(token: string) {
    this.authService.setRefreshToken(token);
  }

  private clearTokens() {
    this.authService.clearTokens();
    this.permissionService.clear();
  }
}
