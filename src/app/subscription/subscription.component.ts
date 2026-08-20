import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { KeyVaultService } from '../core/services/keyvault.service';
import { AuthService } from '../core/services/auth.service';

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
    private keyVaultService: KeyVaultService,
    private authService: AuthService,
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

    this.keyVaultService.getSubscriptionUsage(orgId).subscribe({
      next: (res: any) => {
        this.loading = false;
        const payload = res?.data ?? res ?? {};
        const sub = payload.subscription ?? {};

        this.usage = {
          users: payload.usersWithAccess ?? 0,
          usersLimit: sub.features?.max_users ?? 10,
          sites: payload.sites ?? 0,
          keys: payload.keys ?? 0,
          jobs: payload.jobs ?? 0,
          customers: payload.clients ?? 0,
          storage: payload.storageLocations ?? 0,
        };

        const isTrial = !!sub.trial && !!sub.active;
        this.trial = {
          active: isTrial,
          startDate: sub.effectiveStart ? this.formatDate(sub.effectiveStart) : '-',
          endDate: sub.effectiveExpiry ? this.formatDate(sub.effectiveExpiry) : '-',
          daysRemaining: sub.effectiveExpiry ? this.daysUntil(sub.effectiveExpiry) : 0,
        };

        this.plan = {
          name: sub.planName || 'No Active Plan',
          type: sub.billingPeriod || (isTrial ? 'Free Trial' : 'Inactive'),
          duration: isTrial ? 'Trial' : (sub.billingPeriod || '-'),
          startDate: sub.effectiveStart ? this.formatDate(sub.effectiveStart) : '-',
          endDate: sub.effectiveExpiry ? this.formatDate(sub.effectiveExpiry) : '-',
          autoConversion: isTrial ? 'Yes' : 'No',
        };
      },
      error: (err) => {
        this.loading = false;
        this.error = true;
        this.errorMessage = err?.error?.detail || 'Failed to load subscription details.';
      }
    });

    this.keyVaultService.getSubscription(orgId).subscribe({
      next: (res: any) => {
        const payload = res?.data ?? res ?? {};
        const sub = payload.subscription ?? payload ?? {};
        this.plan = {
          name: sub.planName || this.plan?.name || 'No Active Plan',
          type: sub.billingPeriod || this.plan?.type || 'Inactive',
          duration: sub.billingPeriod || this.plan?.duration || '-',
          startDate: sub.effectiveStart ? this.formatDate(sub.effectiveStart) : (this.plan?.startDate || '-'),
          endDate: sub.effectiveExpiry ? this.formatDate(sub.effectiveExpiry) : (this.plan?.endDate || '-'),
          autoConversion: this.plan?.autoConversion || 'No',
        };
        const isTrial = !!sub.trial && !!sub.active;
        this.trial = {
          active: isTrial,
          startDate: sub.effectiveStart ? this.formatDate(sub.effectiveStart) : (this.trial?.startDate || '-'),
          endDate: sub.effectiveExpiry ? this.formatDate(sub.effectiveExpiry) : (this.trial?.endDate || '-'),
          daysRemaining: sub.effectiveExpiry ? this.daysUntil(sub.effectiveExpiry) : (this.trial?.daysRemaining || 0),
        };
      },
      error: () => {
        // subscription status is optional if usage already loaded
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
