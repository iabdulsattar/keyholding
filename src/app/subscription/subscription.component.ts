import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SubscriptionService } from '../core/services/subscription.service';

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

  constructor(
    private subscriptionService: SubscriptionService,
  ) {}

  ngOnInit(): void {
    this.loadSubscription();
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

        this.usage = {
          users: payload.usersWithAccess ?? payload.users ?? 0,
          usersLimit: sub.features?.max_users ?? 10,
          sites: payload.sites ?? 0,
          keys: payload.keys ?? 0,
          jobs: payload.jobs ?? 0,
          customers: payload.clients ?? payload.customers ?? 0,
          storage: payload.storageLocations ?? payload.storage ?? 0,
        };

        const isTrial = sub.status === 'TRIAL' || !!sub.trial;
        this.trial = {
          active: isTrial,
          startDate: sub.trialStart || sub.currentPeriodStart ? this.formatDate(sub.trialStart || sub.currentPeriodStart) : '-',
          endDate: sub.trialEnd || sub.currentPeriodEnd ? this.formatDate(sub.trialEnd || sub.currentPeriodEnd) : '-',
          daysRemaining: sub.trialEnd || sub.currentPeriodEnd ? this.daysUntil(sub.trialEnd || sub.currentPeriodEnd) : 0,
        };

        this.plan = {
          name: sub.planName || 'No Active Plan',
          type: sub.billingPeriod || (isTrial ? 'Free Trial' : 'Inactive'),
          duration: isTrial ? 'Trial' : (sub.billingPeriod || '-'),
          startDate: sub.currentPeriodStart ? this.formatDate(sub.currentPeriodStart) : '-',
          endDate: sub.currentPeriodEnd ? this.formatDate(sub.currentPeriodEnd) : '-',
          autoConversion: isTrial ? 'Yes' : 'No',
        };
      },
      error: (err) => {
        this.loading = false;
        this.error = true;
        this.errorMessage = err?.error?.detail || 'Failed to load subscription details.';
      }
    });
  }

  private formatDate(iso: string): string {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
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
