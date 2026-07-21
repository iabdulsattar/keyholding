import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const token = authService.getAccessToken();

  if (!token) {
    return router.createUrlTree(['/signin'], {
      queryParams: { returnUrl: state.url },
    });
  }

  const expiresAt = authService.isRemembered()
    ? localStorage.getItem('session_expires_at')
    : sessionStorage.getItem('session_expires_at');

  if (expiresAt && Number(expiresAt) < Date.now()) {
    authService.clearTokens();
    return router.createUrlTree(['/signin'], {
      queryParams: { returnUrl: state.url },
    });
  }

  return true;
};
