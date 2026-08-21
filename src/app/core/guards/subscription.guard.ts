import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SubscriptionService } from '../services/subscription.service';
import { catchError, map, of } from 'rxjs';

const ALLOWED_PATHS_WITHOUT_SUBSCRIPTION = [
  '/subscription-plan',
  '/subscription',
  '/subscription/complete',
  '/signin',
  '/login',
  '/signup',
  '/forgot-password',
  '/forgot-passwordcheck',
  '/confirm-password',
  '/reset-password',
  '/verification',
  '/subscription-trial-start',
  '/subscription-trial-ready',
  '/activate-account',
];

export const subscriptionGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const subscriptionService = inject(SubscriptionService);

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

  const orgId = localStorage.getItem('org_id') || localStorage.getItem('organizationId');
  if (!orgId) {
    return router.createUrlTree(['/signin'], {
      queryParams: { returnUrl: currentUrl },
    });
  }

  return subscriptionService.getSubscription(orgId, 'key-vault').pipe(
    map((res: any) => {
      const payload = res?.data ?? res ?? {};
      const sub = payload.subscription ?? payload ?? {};
      const isActive = sub?.status === 'ACTIVE';
      const isTrial = sub?.status === 'TRIALING' || sub?.status === 'TRIAL';
      const trialEnd = sub?.trialEnd || sub?.currentPeriodEnd;
      const isTrialExpired = isTrial && trialEnd && new Date(trialEnd) < new Date();
      
      if (!isActive && (!isTrial || isTrialExpired)) {
        return router.createUrlTree(['/subscription-plan'], {
          queryParams: { returnUrl: currentUrl },
        });
      }
      return true;
    }),
    catchError(() => {
      return of(router.createUrlTree(['/subscription-plan'], {
        queryParams: { returnUrl: currentUrl },
      }));
    })
  );
};