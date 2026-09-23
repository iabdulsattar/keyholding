import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable, from, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { SubscriptionStatusService, ALLOWED_PATHS_WITHOUT_SUBSCRIPTION } from '../services/subscription-status.service';

export const subscriptionGuard: CanActivateFn = (route, state): boolean | UrlTree | Observable<boolean | UrlTree> => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const subStatus = inject(SubscriptionStatusService);

  const currentUrl = state.url;
  if (ALLOWED_PATHS_WITHOUT_SUBSCRIPTION.some(path => currentUrl.startsWith(path))) {
    return true;
  }

  const token = authService.getAccessToken();
  if (!token) {
    return router.createUrlTree(['/signin'], {
      queryParams: { returnUrl: currentUrl },
    });
  }

  const orgId = subStatus.getOrgId();
  if (!orgId) {
    return router.createUrlTree(['/signin'], {
      queryParams: { returnUrl: currentUrl },
    });
  }

  // Synchronous cache check: if we have a recent active subscription in localStorage,
  // skip the API call entirely for instant navigation.
  if (subStatus.isCachedActive()) {
    // Also verify the cache timestamp is reasonably fresh (within 5 minutes).
    const ts = localStorage.getItem('sub_check_ts');
    if (ts && Date.now() - Number(ts) < 300_000) {
      return true;
    }
  }

  // Fall back to async check via the shared service.
  return from(subStatus.checkNow()).pipe(
    map(() =>
      subStatus.isActive()
        ? true
        : router.createUrlTree(['/subscription-plan'], {
            queryParams: { returnUrl: currentUrl },
          })
    ),
    catchError(() =>
      of(
        router.createUrlTree(['/subscription-plan'], {
          queryParams: { returnUrl: currentUrl },
        })
      )
    )
  );
};
