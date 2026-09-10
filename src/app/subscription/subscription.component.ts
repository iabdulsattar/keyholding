import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SubscriptionService } from '../core/services/subscription.service';
import { Plan } from '../core/models/subscription.models';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './subscription.component.html',
  styles: ``
})
export class SubscriptionComponent implements OnInit {
  loading = true;
  error = false;
  errorMessage = '';

  trial: any = null;
  usage: any = null;
  plan: any = null;
  planDetails: Plan | null = null;
  serviceCode = '';

  constructor(
    private subscriptionService: SubscriptionService,
  ) {}

  ngOnInit(): void {
    this.usage = {
      users: 0,
      usersLimit: 10,
      usersLimitLabel: '10 users',
      sites: 0,
      keys: 0,
      jobs: 0,
      customers: 0,
      storage: 0,
    };
    this.loadSubscription();
    this.loadUsage();
  }

  private getOrgId(): string | null {
    const remember = localStorage.getItem('remember_device');
    if (remember === 'true') {
      return localStorage.getItem('org_id') || localStorage.getItem('organizationId') || null;
    }
    return (
      sessionStorage.getItem('org_id') ||
      sessionStorage.getItem('organizationId') ||
      localStorage.getItem('org_id') ||
      localStorage.getItem('organizationId') ||
      null
    );
  }

  private loadSubscription(): void {
    const orgId = this.getOrgId();
    if (!orgId) {
      this.loading = false;
      this.error = true;
      this.errorMessage = 'Organization not found.';
      return;
    }

    this.subscriptionService.getSubscription(orgId, 'key-vault').subscribe({
      next: (res: any) => {
        this.loading = false;
        const payload = res?.data ?? res ?? {};
        const sub = payload.subscription ?? payload ?? {};
        this.applySubscriptionData(sub);
        this.parseFeatures(payload.features || sub.features);
      },
      error: (err) => {
        this.loading = false;
        this.error = true;
        this.errorMessage = err?.error?.detail || 'Failed to load subscription details.';
      }
    });
  }

  private loadUsage(): void {
    const orgId = this.getOrgId();
    if (!orgId) return;

    this.subscriptionService.getUsage(orgId, 'key-vault').subscribe({
      next: (res: any) => {
        const payload = res?.data ?? res ?? {};
        if (payload.features && Array.isArray(payload.features)) {
          this.parseFeatures(payload.features);
        } else {
          this.usage = {
            ...this.usage,
            users: payload.usersWithAccess ?? 0,
            sites: payload.sites ?? 0,
            keys: payload.keys ?? 0,
            jobs: payload.jobs ?? 0,
            customers: payload.clients ?? payload.customers ?? 0,
            storage: payload.storageLocations ?? payload.storage ?? 0,
          };
        }
      },
      error: () => {
        // keep default zeros already set in subscription init
      }
    });
  }

  private parseFeatures(featuresArray: any[]): void {
    if (!featuresArray || !Array.isArray(featuresArray)) return;

    const featureMap: Record<string, any> = {};
    featuresArray.forEach(f => {
      if (f?.feature) {
        featureMap[f.feature] = f;
      }
    });

    const usersFeat = featureMap['users'];
    const sitesFeat = featureMap['sites'];
    const keysFeat = featureMap['keys'];
    const jobsFeat = featureMap['jobs'];

    this.usage = {
      users: usersFeat?.used ?? 0,
      usersLimit: usersFeat?.unlimited ? Infinity : usersFeat?.limit ?? 10,
      usersLimitLabel: usersFeat?.unlimited ? 'Unlimited' : (usersFeat?.limit ? `${usersFeat.limit} users` : '-'),
      sites: sitesFeat?.used ?? 0,
      keys: keysFeat?.used ?? 0,
      jobs: jobsFeat?.used ?? 0,
      customers: 0,
      storage: 0,
    };
  }

  private applySubscriptionData(sub: any): void {
    this.serviceCode = sub.serviceCode || '';

    const status = sub.status?.toUpperCase();
    const isTrial = sub.trial === true || status === 'TRIAL' || status === 'TRIALING';
    const effectiveExpiry = sub.effectiveExpiry || sub.currentPeriodEnd || sub.trialEnd;
    const subObj = sub.subscription || sub;

    this.trial = {
      active: isTrial,
      startDate: sub.startDate || sub.createdAt || sub.currentPeriodStart || subObj?.createdAt || subObj?.startDate || subObj?.currentPeriodStart ? this.formatDate(sub.startDate || sub.createdAt || sub.currentPeriodStart || subObj?.createdAt || subObj?.startDate || subObj?.currentPeriodStart) : '-',
      endDate: effectiveExpiry ? this.formatDate(effectiveExpiry) : '-',
      daysRemaining: effectiveExpiry ? this.daysUntil(effectiveExpiry) : 0,
    };

    const planName = sub.planName || subObj?.planName || sub.planCode || subObj?.planCode || this.formatServiceCode(sub.serviceCode);
    this.plan = {
      name: planName || 'No Active Plan',
      type: isTrial ? (sub.billingPeriod || subObj?.billingPeriod || 'Free Trial') : planName,
      duration: isTrial ? 'Trial' : (sub.billingPeriod || subObj?.billingPeriod || '-'),
      startDate: sub.currentPeriodStart || subObj?.currentPeriodStart ? this.formatDate(sub.currentPeriodStart || subObj?.currentPeriodStart) : '-',
      endDate: effectiveExpiry ? this.formatDate(effectiveExpiry) : '-',
      autoConversion: isTrial ? (sub.autoRenew ? 'Yes' : 'No') : (subObj?.cancelAtPeriodEnd ? 'No' : 'Yes'),
    };

    if (!isTrial && sub.planId) {
      this.subscriptionService.getPlan(sub.planId).subscribe({
        next: (res: any) => {
          this.planDetails = res?.data ?? null;
          if (this.planDetails?.name) {
            this.plan = { ...this.plan, name: this.planDetails.name };
          }
        },
        error: () => {
          this.planDetails = null;
        }
      });
    } else {
      this.planDetails = null;
    }
  }

  private formatDate(iso: string): string {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  get serviceCodeLabel(): string {
    return this.formatServiceCode(this.serviceCode);
  }

  private formatServiceCode(code: string): string {
    if (!code) return '';
    return code
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private daysUntil(iso: string): number {
    if (!iso) return 0;
    const target = new Date(iso);
    const now = new Date();
    if (isNaN(target.getTime())) return 0;
    const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }
}
