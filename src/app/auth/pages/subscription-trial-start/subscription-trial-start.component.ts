import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { AuthService } from '../../../core/services/auth.service';
import { SubscriptionStatusService } from '../../../core/services/subscription-status.service';
import { KeyVaultService } from '../../../core/services/keyvault.service';
import { PermissionService } from '../../../core/services/permission.service';
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

  constructor(
    private subscriptionService: SubscriptionService,
    private authService: AuthService,
    private subStatus: SubscriptionStatusService,
    private keyVaultService: KeyVaultService,
    private permissionService: PermissionService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const refreshToken = params.get('refreshToken') ?? params.get('token');
    const serviceCode = params.get('serviceCode') || SERVICE_CODE;

    if (refreshToken) {
      this.resolveFromRefreshToken(refreshToken, serviceCode);
      return;
    }

    this.loadPage();
  }

  /**
   * External entry point: exchange the refresh token from the link, then look at
   * `subscribedServices`. An org that already has key-vault (active or trial)
   * never sees this page - it goes straight into the app.
   */
  private async resolveFromRefreshToken(refreshToken: string, serviceCode: string): Promise<void> {
    try {
      const res: any = await firstValueFrom(this.authService.refreshForService({ refreshToken }, serviceCode));

      const accessToken = res?.access_token ?? res?.tokens?.access_token;
      const newRefreshToken = res?.refresh_token ?? res?.tokens?.refresh_token;

      if (!accessToken) {
        this.errorMessage = 'The sign-in link could not be verified. Please sign in again.';
        this.checkingSubscription = false;
        this.loadPage();
        return;
      }

      this.authService.setTokens(
        accessToken,
        newRefreshToken,
        String(Date.now() + 24 * 60 * 60 * 1000),
        serviceCode
      );

      const organizations = res?.organizations ?? res?.tokens?.organizations ?? [];
      if (organizations[0]?.id) {
        this.storeOrg(organizations[0].id, organizations[0].name);
      }

      const subscribedServices = res?.subscribedServices ?? res?.tokens?.subscribedServices ?? [];
      this.subStatus.setFromSubscribedServices(subscribedServices, serviceCode);

      if (this.subStatus.isActive()) {
        this.router.navigate(['/']);
        return;
      }
    } catch {
      this.errorMessage = 'The sign-in link is invalid or has expired. Please sign in again.';
    }

    this.checkingSubscription = false;
    this.loadPage();
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
        this.enableKeyVault(orgId);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.detail || err?.error?.message || 'Failed to start trial. Please try again.';
      }
    });
  }

  /** Grant this org access to the key-vault service so the dashboard is usable. */
  private enableKeyVault(orgId: string): void {
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
