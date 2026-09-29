import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { AuthService } from '../../../core/services/auth.service';
import { SubscriptionStatusService } from '../../../core/services/subscription-status.service';
import { KeyVaultService } from '../../../core/services/keyvault.service';
import { PermissionService } from '../../../core/services/permission.service';
import { ProductService } from '../../../core/services/product.service';
import { SubscriptionLayoutComponent } from '../../../layout/subscription-layout/subscription-layout.component';
import { Plan } from '../../../core/models/subscription.models';
import { CommonModule } from '@angular/common';

const SERVICE_CODE = 'key-vault';

// Used when the plans endpoint returns nothing usable, matching the trial plan
// the sign-in flow starts.
const FALLBACK_TRIAL_PLAN_ID = '5ab78dd5-96ea-4dcc-9c89-66f9bed45368';

@Component({
  selector: 'app-subscription-trial-start',
  imports: [
    CommonModule,
    RouterModule,
    SubscriptionLayoutComponent,
  ],
  templateUrl: './subscription-trial-start.component.html',
  styles: ''
})
export class SubscriptionTrialStartComponent implements OnInit {
  userName = '';
  userEmail = '';
  userRole = '';
  orgName = '';
  orgId: string | null = null;
  isLoading = false;
  errorMessage = '';
  trialPlan: Plan | null = null;
  checkingSubscription = true;
  private referrerUrl: string | null = null;

  constructor(
    private subscriptionService: SubscriptionService,
    private authService: AuthService,
    private subStatus: SubscriptionStatusService,
    private keyVaultService: KeyVaultService,
    private permissionService: PermissionService,
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Captured before any navigation so "Not Now" can hand the user back to
    // the app that sent them into this external-login link.
    this.referrerUrl = this.resolveReferrer();

    const params = this.route.snapshot.queryParamMap;
    const refreshToken = params.get('refreshToken') ?? params.get('token');
    const serviceCode = params.get('serviceCode') || SERVICE_CODE;

    if (refreshToken) {
      this.resolveFromRefreshToken(refreshToken, serviceCode);
      return;
    }

    this.loadPage();
  }

  /** External http(s) page that linked here; null when it was a direct visit. */
  private resolveReferrer(): string | null {
    const referrer = document.referrer;
    if (!referrer) return null;

    try {
      const url = new URL(referrer);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
      // Same-origin referrers are in-app navigations, not an external host.
      if (url.origin === window.location.origin) return null;
      return url.href;
    } catch {
      return null;
    }
  }

  notNow(): void {
    if (this.referrerUrl) {
      window.location.href = this.referrerUrl;
      return;
    }
    this.router.navigate(['/signin']);
  }

  /**
   * External entry point: always exchange the refresh token from the link
   * first and persist that response (tokens, org, service access, subscribed
   * services). Only then decide where the user goes: a `subscribedServices`
   * entry for this serviceCode means the org is already subscribed and lands
   * straight on the dashboard; anything else falls through to the trial page.
   */
  private async resolveFromRefreshToken(refreshToken: string, serviceCode: string): Promise<void> {
    try {
      const res: any = await firstValueFrom(this.authService.refreshForService({ refreshToken }, serviceCode));

      const accessToken = res?.access_token ?? res?.tokens?.access_token;
      const newRefreshToken = res?.refresh_token ?? res?.tokens?.refresh_token;
      const refreshExpiresIn = res?.refresh_expires_in ?? res?.tokens?.refresh_expires_in;
      const accessExpiresIn = res?.expires_in ?? res?.tokens?.expires_in;

      if (!accessToken) {
        this.errorMessage = 'The sign-in link could not be verified. Please sign in again.';
        this.checkingSubscription = false;
        this.loadPage();
        return;
      }

      // ---- persist the refresh response before any redirect decision ----
      const expiresAt = String(this.authService.computeSessionExpiry(
        accessToken,
        refreshExpiresIn,
        accessExpiresIn,
        this.authService.isRemembered()
      ));
      this.authService.storeSession(accessToken, newRefreshToken ?? null, expiresAt, this.authService.isRemembered(), serviceCode);

      // ---- Organization context (mirrors the sign-in flow) ----
      const orgs = res?.organizations ?? res?.tokens?.organizations ?? [];
      if (orgs[0]?.id) {
        this.storeOrg(orgs[0].id, orgs[0].name);
      } else {
        this.authService.me(accessToken).subscribe({
          next: (profile: any) => {
            const profileOrgs = profile?.organizations ?? [];
            if (profileOrgs.length > 0) {
              this.storeOrg(profileOrgs[0].id, profileOrgs[0].name);
            }
          },
          error: () => {},
        });
      }

      this.authService.getSession(accessToken).subscribe({
        next: (session: any) => {
          const sessionOrgs = session?.organizations ?? [];
          if (sessionOrgs.length > 0) {
            this.storeOrg(sessionOrgs[0].id, sessionOrgs[0].name);
          }
        },
        error: () => {},
      });

      this.permissionService.setOrgRole(orgs?.[0]?.role);

      // ---- Service access (grants) exactly as the sign-in flow stores them ----
      const serviceAccess = res?.serviceAccess ?? res?.tokens?.serviceAccess;
      if (serviceAccess) {
        this.permissionService.setServiceAccess(serviceAccess as any);
      }

      // ---- Subscribed services cache used by the subscription guard ----
      const subscribedServices = res?.subscribedServices ?? res?.tokens?.subscribedServices ?? [];
      this.subStatus.setFromSubscribedServices(subscribedServices, serviceCode);
      this.productService.setCurrentProductByServiceCode(serviceCode);

      const hasSubscription = this.hasServiceSubscription(subscribedServices, serviceCode);
      const hasServiceAccess = this.permissionService.canAccessService(serviceCode);

      // Only a fully entitled org skips the trial flow. Everything else -
      // unsubscribed, or subscribed without the service grant - goes through
      // the start-subscription + enable-service chain on this page.
      if (hasSubscription && hasServiceAccess) {
        this.router.navigate(['/']);
        return;
      }
    } catch {
      this.errorMessage = 'The sign-in link is invalid or has expired. Please sign in again.';
    }

    this.checkingSubscription = false;
    this.loadPage();
  }

  /** Presence of the serviceCode in `subscribedServices` means already subscribed. */
  private hasServiceSubscription(subscribedServices: any[], serviceCode: string): boolean {
    const list = Array.isArray(subscribedServices) ? subscribedServices : [];
    return list.some((s: any) => s?.serviceCode === serviceCode);
  }

  private loadPage(): void {
    this.orgId = this.getOrgId();
    this.orgName = this.authService.getOrgName() || '';

    const token = this.authService.getAccessToken();
    if (token) {
      this.authService.me(token).subscribe({
        next: (profile: any) => {
          const user = profile?.user || profile?.data || profile;
          this.userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'User';
          this.userEmail = user.email || '';
          this.userRole = this.extractRole(profile);

          const org = profile?.organizations?.[0];
          if (org?.id && !this.orgId) {
            this.storeOrg(org.id, org.name);
            this.orgId = org.id;
            this.orgName = org.name || this.orgName;
          }
        },
        error: () => {
          this.userName = 'User';
        }
      });
    }

    this.loadTrialPlan();
  }

  private storeOrg(id: string, name?: string): void {
    const store = this.authService.isRemembered() ? localStorage : sessionStorage;
    store.setItem('org_id', id);
    store.setItem('organizationId', id);
    localStorage.setItem('org_id', id);
    localStorage.setItem('organizationId', id);
    if (name) {
      store.setItem('org_name', name);
      store.setItem('organizationName', name);
      localStorage.setItem('org_name', name);
      localStorage.setItem('organizationName', name);
    }
  }

  private getOrgId(): string | null {
    return (
      sessionStorage.getItem('org_id') ||
      sessionStorage.getItem('organizationId') ||
      localStorage.getItem('org_id') ||
      localStorage.getItem('organizationId') ||
      null
    );
  }

  private extractRole(profile: any): string {
    const orgs = profile?.organizations || [];
    if (orgs.length > 0 && orgs[0].role) {
      return orgs[0].role;
    }
    const org = profile?.organization;
    if (org?.role) {
      return org.role;
    }
    return '';
  }

  private loadTrialPlan(): void {
    this.subscriptionService.listPlans(SERVICE_CODE).subscribe({
      next: (res: any) => {
        const planList = this.extractPlans(res);
        this.trialPlan =
          planList.find((p: any) => p.trialEligible && p.active) ||
          planList.find((p: any) => p.trialEligible) ||
          planList.find((p: any) => p.active) ||
          planList[0] ||
          null;
      },
      error: () => {
        this.errorMessage = 'Failed to load trial details. Please try again.';
      }
    });
  }

  /** Plans arrive either bare, under `data`, or nested in `data.plans/items`. */
  private extractPlans(res: any): any[] {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.plans)) return res.data.plans;
    if (Array.isArray(res?.data?.items)) return res.data.items;
    if (Array.isArray(res?.plans)) return res.plans;
    if (Array.isArray(res?.items)) return res.items;
    return [];
  }

  private get planId(): string {
    return this.trialPlan?.id || FALLBACK_TRIAL_PLAN_ID;
  }

  /**
   * The org id can arrive with the refresh response, live in storage from an
   * earlier session, or only be visible through the profile endpoints - so
   * resolve it again right before starting instead of failing on a stale null.
   */
  private async resolveOrgId(): Promise<string | null> {
    if (this.orgId) return this.orgId;

    const stored = this.getOrgId();
    if (stored) {
      this.orgId = stored;
      return stored;
    }

    const token = this.authService.getAccessToken();
    if (!token) return null;

    const sources: Array<Promise<any>> = [
      firstValueFrom(this.authService.me(token)).catch(() => null),
      firstValueFrom(this.authService.getSession(token)).catch(() => null),
      firstValueFrom(this.authService.listOrganizations(token)).catch(() => null),
    ];

    for (const source of sources) {
      const res: any = await source;
      const org = res?.organizations?.[0] ?? res?.organization ?? (res?.id ? res : null);
      if (org?.id) {
        this.storeOrg(org.id, org.name);
        this.orgId = org.id;
        this.orgName = org.name || this.orgName;
        return org.id;
      }
    }

    return null;
  }

  async startTrial(): Promise<void> {
    if (this.isLoading) return;

    this.isLoading = true;
    this.errorMessage = '';

    const orgId = await this.resolveOrgId();
    if (!orgId) {
      this.isLoading = false;
      this.errorMessage = 'We could not find your organisation. Please sign in again and retry.';
      return;
    }

    this.subscriptionService.startSubscription(orgId, {
      planId: this.planId,
      billingPeriod: 'MONTHLY',
      useTrial: true,
      config: {},
    }, SERVICE_CODE).subscribe({
      next: (res) => {
        this.subStatus.setFromResponse(res);
        // The start response frequently omits `effectiveExpiry`; record the
        // trial window explicitly so the dashboard guard does not treat the
        // fresh trial as expired on the next navigation.
        this.subStatus.onTrialStarted(SERVICE_CODE, this.trialDays);
        this.enableKeyVault(orgId);
      },
      error: (err) => {
        // Already subscribed (just missing the service grant): continue to the
        // enable step instead of blocking the user on an error.
        if (this.isAlreadySubscribedError(err)) {
          this.subStatus.onTrialStarted(SERVICE_CODE, this.trialDays);
          this.enableKeyVault(orgId);
          return;
        }
        this.isLoading = false;
        this.errorMessage = err?.error?.detail || err?.error?.message || 'Failed to start trial. Please try again.';
      }
    });
  }

  private isAlreadySubscribedError(err: any): boolean {
    if (!err) return false;
    if (err.status === 409) return true;
    const message = String(err?.error?.detail ?? err?.error?.message ?? err?.message ?? '').toLowerCase();
    return /already (subscribed|exists)|existing subscription|subscription exists/.test(message);
  }

  /** Grant this org access to the key-vault service so the dashboard is usable. */
  private enableKeyVault(orgId: string | null | undefined): void {
    if (!orgId) {
      this.checkingSubscription = false;
      this.loadPage();
      return;
    }

    this.keyVaultService.enableService(orgId, SERVICE_CODE, this.userEmail, '').subscribe({
      next: () => this.onTrialActivated(),
      error: () => this.onTrialActivated()
    });
  }

  private onTrialActivated(): void {
    this.permissionService.setServiceAccess([
      ...(this.permissionService.getServiceAccess() ?? []).filter(
        (g) => g.serviceCode !== SERVICE_CODE
      ),
      { serviceCode: SERVICE_CODE, wildcard: false, permissions: [], roles: [] }
    ]);

    this.isLoading = false;
    this.router.navigate(['/subscription-trial-ready']);
  }

  get trialDays(): number {
    return this.trialPlan?.trialDays || 14;
  }

  get todayLabel(): string {
    return new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  get trialEndLabel(): string {
    const date = new Date();
    date.setDate(date.getDate() + this.trialDays);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
}
