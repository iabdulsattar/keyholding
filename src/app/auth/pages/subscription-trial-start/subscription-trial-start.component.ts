import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { AuthService } from '../../../core/services/auth.service';
import { SubscriptionLayoutComponent } from '../../../layout/subscription-layout/subscription-layout.component';
import { Plan } from '../../../core/models/subscription.models';
import { CommonModule } from '@angular/common';

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
  orgName = '';
  orgId: string | null = null;
  isLoading = false;
  errorMessage = '';
  trialPlan: Plan | null = null;

  constructor(
    private subscriptionService: SubscriptionService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.orgId = this.getOrgId();
    this.orgName = this.authService.getOrgName() || '';

    const token = this.authService.getAccessToken();
    if (token) {
      this.authService.me(token).subscribe({
        next: (profile: any) => {
          const user = profile?.user || profile?.data || profile;
          this.userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'User';
          this.userEmail = user.email || '';
        },
        error: () => {
          this.userName = 'User';
        }
      });
    }

    this.loadTrialPlan();
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

  private loadTrialPlan(): void {
    this.subscriptionService.listPlans().subscribe({
      next: (plans) => {
        this.trialPlan = plans.find(p => p.trialEligible && p.active) || null;
      },
      error: () => {
        this.errorMessage = 'Failed to load trial details. Please try again.';
      }
    });
  }

  startTrial(): void {
    if (!this.trialPlan || !this.orgId) {
      this.errorMessage = 'Missing plan or organization details. Please try again.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.subscriptionService.startSubscription(this.orgId, {
      planId: this.trialPlan.id,
      billingPeriod: 'MONTHLY',
      useTrial: true,
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/signin']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.detail || 'Failed to start trial. Please try again.';
      }
    });
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
    const end = new Date();
    end.setDate(end.getDate() + this.trialDays);
    return end.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
}
