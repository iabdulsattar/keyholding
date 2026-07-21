import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { Plan } from '../../../core/models/subscription.models';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { AuthPageLayoutComponent } from '../../../layout/auth-page-layout/auth-page-layout.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-subscription-plan',
  imports: [
    RouterModule,
    ButtonComponent,
    AuthPageLayoutComponent,
  ],
  templateUrl: './subscription-plan.component.html',
  styles: ''
})
export class SubscriptionPlanComponent implements OnInit {

  plans: Plan[] = [];
  selectedPlanId: string | null = null;
  isLoading = false;
  isFetchingPlans = false;
  errorMessage = '';

  constructor(private subscriptionService: SubscriptionService, private router: Router) {}

  ngOnInit(): void {
    this.loadPlans();
  }

  private loadPlans(): void {
    this.isFetchingPlans = true;
    this.subscriptionService.listPlans().subscribe({
      next: (plans) => {
        this.plans = plans.filter(p => p.active);
        this.isFetchingPlans = false;
      },
      error: () => {
        this.isFetchingPlans = false;
        this.errorMessage = 'Failed to load plans. Please try again.';
      },
    });
  }

  get orgId(): string | null {
    return localStorage.getItem('org_id');
  }

  selectPlan(planId: string) {
    this.selectedPlanId = planId;
    this.errorMessage = '';

    const orgId = this.orgId;
    if (!orgId) {
      this.errorMessage = 'Organization not found. Please sign up again.';
      return;
    }

    this.isLoading = true;
    this.subscriptionService.startSubscription(orgId, {
      planId,
      billingPeriod: 'MONTHLY',
      useTrial: true,
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/signin']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.detail || 'Failed to start subscription. Please try again.';
      },
    });
  }
}