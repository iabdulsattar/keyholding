import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SubscriptionService } from './subscription.service';
import { AuthService } from './auth.service';

export type SubscriptionStatus = 'unknown' | 'active' | 'trial' | 'expired';

export const ALLOWED_PATHS_WITHOUT_SUBSCRIPTION = [
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

@Injectable({ providedIn: 'root' })
export class SubscriptionStatusService {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly sub = inject(SubscriptionService);

  readonly status = signal<SubscriptionStatus>('unknown');
  readonly effectiveExpiry = signal<number | null>(null);
  readonly loading = signal(false);

  readonly isActive = computed(() => this.status() === 'active' || this.status() === 'trial');

  readonly daysRemaining = computed(() => {
    const exp = this.effectiveExpiry();
    if (!exp) return 0;
    const diff = Math.ceil((exp - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  });

  private lastOrgId: string | null = null;

  constructor() {
    effect(() => {
      const st = this.status();
      if (st !== 'expired') return;
      const url = this.router.url;
      if (ALLOWED_PATHS_WITHOUT_SUBSCRIPTION.some(p => url.startsWith(p))) return;
      this.router.navigate(['/subscription-plan'], { queryParams: { returnUrl: url } });
    });
  }

  getOrgId(): string | null {
    const store = this.auth.isRemembered() ? localStorage : sessionStorage;
    return store.getItem('org_id') || store.getItem('organizationId') || null;
  }

  async checkNow(): Promise<void> {
    const orgId = this.getOrgId();
    if (!orgId) {
      this.status.set('expired');
      return;
    }

    if (orgId === this.lastOrgId) {
      const lastCheck = localStorage.getItem('sub_check_ts');
      if (lastCheck && Date.now() - Number(lastCheck) < 60_000) {
        this.restoreFromCache();
        return;
      }
    }

    this.loading.set(true);
    try {
      const res: any = await firstValueFrom(this.sub.getSubscription(orgId, 'key-vault'));
      this.applyResult(res);
      this.lastOrgId = orgId;
      localStorage.setItem('sub_check_ts', String(Date.now()));
    } catch {
      this.status.set('expired');
    } finally {
      this.loading.set(false);
    }
  }

  setFromResponse(res: any): void {
    this.applyResult(res);
    const orgId = this.getOrgId();
    if (orgId) this.lastOrgId = orgId;
    localStorage.setItem('sub_check_ts', String(Date.now()));
  }

  private applyResult(res: any): void {
    const payload = res?.data ?? res ?? {};
    const subObj = payload.subscription ?? payload ?? {};

    const statusUpper = subObj?.status?.toUpperCase();
    const isTrial =
      subObj?.trial === true || statusUpper === 'TRIAL' || statusUpper === 'TRIALING';
    const isActive = subObj?.status === 'ACTIVE';
    const effectiveExpiry =
      subObj?.effectiveExpiry || subObj?.trialEnd || subObj?.currentPeriodEnd;
    const isTrialExpired =
      isTrial && effectiveExpiry && new Date(effectiveExpiry) < new Date();

    if (isActive) {
      this.status.set('active');
    } else if (isTrial && !isTrialExpired) {
      this.status.set('trial');
    } else {
      this.status.set('expired');
    }

    const expTime = effectiveExpiry ? new Date(effectiveExpiry).getTime() : null;
    this.effectiveExpiry.set(expTime);

    localStorage.setItem(
      'subscribed_services',
      JSON.stringify([{ serviceCode: 'key-vault', status: isActive ? 'ACTIVE' : statusUpper, effectiveExpiry }])
    );
  }

  onCheckoutSuccess(): void {
    this.status.set('active');
    this.effectiveExpiry.set(null);
    localStorage.setItem('subscribed_services', JSON.stringify([{ serviceCode: 'key-vault', status: 'ACTIVE' }]));
    localStorage.setItem('sub_check_ts', String(Date.now()));
  }

  isCachedActive(): boolean {
    const cached = localStorage.getItem('subscribed_services');
    if (!cached) return false;
    try {
      const services = JSON.parse(cached);
      return services.some((s: any) => s.status === 'ACTIVE');
    } catch {
      return false;
    }
  }

  private restoreFromCache(): void {
    const cached = localStorage.getItem('subscribed_services');
    if (!cached) return;
    try {
      const services = JSON.parse(cached);
      const active = services.some((s: any) => s.status === 'ACTIVE');
      const trial = services.some((s: any) => {
        const st = s.status?.toUpperCase();
        return st === 'TRIAL' || st === 'TRIALING';
      });
      const exp = services[0]?.effectiveExpiry
        ? new Date(services[0].effectiveExpiry).getTime()
        : null;

      if (active) {
        this.status.set('active');
      } else if (trial && exp && exp > Date.now()) {
        this.status.set('trial');
      } else if (trial && (!exp || exp <= Date.now())) {
        this.status.set('expired');
      }
      if (exp) this.effectiveExpiry.set(exp);
    } catch {
      // ignore parse errors
    }
  }

  isNavVisible(itemName: string): boolean {
    const st = this.status();
    if (st === 'expired') {
      return itemName === 'Subscription';
    }
    return true;
  }
}
