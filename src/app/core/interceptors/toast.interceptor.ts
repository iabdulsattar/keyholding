import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ToastService } from '../services/toast.service';

@Injectable()
export class ToastInterceptor implements HttpInterceptor {
  private readonly PUBLIC_PATHS = [
    '/api/v1/auth/signup',
    '/api/v1/auth/login',
    '/api/v1/auth/signup/verify-otp',
    '/api/v1/auth/login/verify-2fa',
    '/api/v1/auth/password/request-reset',
    '/api/v1/auth/password/reset',
    '/api/v1/auth/invitations',
    '/api/v1/auth/refresh',
    '/api/v1/auth/logout',
  ];

  private readonly MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

  constructor(private toastService: ToastService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (this.isPublicPath(req.url)) {
      return next.handle(req);
    }

    return next.handle(req).pipe(
      tap((event) => {
        if (event && typeof event === 'object' && 'body' in (event as any)) {
          this.handleSuccess(req, (event as any).body);
        }
      }),
      catchError((err) => {
        if (err instanceof HttpErrorResponse) {
          this.handleError(err);
        }
        return throwError(() => err);
      })
    );
  }

  private handleSuccess(req: HttpRequest<unknown>, body: any): void {
    if (!this.MUTATION_METHODS.has(req.method)) {
      return;
    }

    const message = this.extractSuccessMessage(body);
    if (message) {
      this.toastService.success(message);
    }
  }

  private extractSuccessMessage(body: any): string | null {
    if (!body || typeof body !== 'object') {
      return null;
    }

    if (body.message && typeof body.message === 'string') {
      return body.message;
    }

    return null;
  }

  private handleError(err: HttpErrorResponse): void {
    if (err.status === 401) {
      return;
    }

    const message = this.getErrorMessage(err);
    if (message) {
      this.toastService.error(message);
    }
  }

  private getErrorMessage(err: HttpErrorResponse): string | null {
    const detail = err.error?.detail;
    const message = err.error?.message;

    if (detail && typeof detail === 'string') {
      return detail;
    }

    if (message && typeof message === 'string') {
      return message;
    }

    switch (err.status) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'A conflict occurred. The resource may already exist.';
      case 422:
        return 'Validation failed. Please check the form and try again.';
      case 500:
        return 'Server error. Please try again later.';
      case 503:
        return 'Service unavailable. Please try again later.';
      default:
        return err.message || 'An unexpected error occurred. Please try again.';
    }
  }

  private isPublicPath(url: string): boolean {
    return this.PUBLIC_PATHS.some((path) => url.includes(path));
  }
}
