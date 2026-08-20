import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { Plan } from '../../../core/models/subscription.models';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-subscription-plan',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './subscription-plan.component.html',
  styles: ''
})
export class SubscriptionPlanComponent implements OnInit {
  plans: Plan[] = [];
  selectedPlan: Plan | null = null;
  isLoading = false;
  isFetchingPlans = false;
  errorMessage = '';

  unitPrice = 9.99;

  features = [
    { name: 'Users', vals: ['10','1 per seat','30','100'] },
    { name: 'Key Jobs', vals: ['500','Unlimited','2,000','Unlimited'] },
    { name: 'Opening / Closing', vals: [true,true,true,true] },
    { name: 'Loading / Unloading', vals: [true,true,true,true] },
    { name: 'Contractor / Engineer Access', vals: [true,true,true,true] },
    { name: 'Scheduled Jobs', vals: [true,true,true,true] },
    { name: 'Recurring Jobs', vals: [true,true,true,true] },
    { name: 'Mobile Officer Access', vals: [true,true,true,true] },
    { name: 'Key scan / issue / return', vals: [true,true,true,true] },
    { name: 'Audit trail', vals: [true,true,true,true] },
    { name: 'Client Reporting', vals: [true,true,true,true] },
    { name: 'API', vals: [false,false,true,true] },
    { name: 'SSO', vals: [false,false,'optional',true] },
    { name: 'Multi-region', vals: [false,false,true,true] },
    { name: 'Enterprise integrations', vals: [false,false,'optional',true] },
  ];

  constructor(private subscriptionService: SubscriptionService, private router: Router) {}

  ngOnInit(): void {
    this.loadPlans();
  }

  get orgId(): string | null {
    return localStorage.getItem('org_id');
  }

  get shortNames(): Record<string, string> {
    return {};
  }

  get planOrder(): string[] {
    return ['KV_STARTER', 'KV_USER_LICENCE', 'KV_PROFESSIONAL', 'KV_BUSINESS'];
  }

  get displayPlans(): Plan[] {
    return this.sortedPlans.filter(p => p.code !== 'KV_TRIAL');
  }

  get sortedPlans(): Plan[] {
    const order = this.planOrder;
    return [...this.plans].sort((a, b) => {
      const ai = order.indexOf(a.code);
      const bi = order.indexOf(b.code);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
  }

  getFeatureCell(plan: Plan, feature: any): string {
    const idx = this.displayPlans.indexOf(plan);
    if (idx < 0) return '';
    const val = feature.vals[idx];
    if (val === true) return 'check';
    if (val === false) return 'dash';
    if (val === 'optional') return 'optional';
    return val;
  }

  getPlanPrice(plan: Plan): number {
    if (plan.monthlyPriceCents) return plan.monthlyPriceCents / 100;
    const map: Record<string, number> = { KV_STARTER: 49, KV_USER_LICENCE: 9.99, KV_PROFESSIONAL: 129, KV_BUSINESS: 249 };
    return map[plan.code] ?? 0;
  }

  getPlanSites(plan: Plan): number {
    const map: Record<string, number> = { KV_STARTER: 50, KV_USER_LICENCE: 1, KV_PROFESSIONAL: 200, KV_BUSINESS: 999 };
    return map[plan.code] ?? 0;
  }

  getPlanName(plan: Plan): string {
    return plan.name ?? plan.code;
  }

  getSubtotal(plan: Plan): number {
    return this.getPlanSites(plan) * this.unitPrice;
  }

  getVat(plan: Plan): number {
    return this.getPlanPrice(plan) * 0.2;
  }

  getTotal(plan: Plan): number {
    return this.getPlanPrice(plan) + this.getVat(plan);
  }

  selectPlan(plan: Plan) {
    this.selectedPlan = plan;
    this.errorMessage = '';

    const orgId = this.orgId;
    if (!orgId) {
      this.errorMessage = 'Organization not found. Please sign up again.';
      return;
    }

    this.isLoading = true;
    this.subscriptionService.startSubscription(orgId, {
      planId: plan.id,
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

  isSelected(plan: Plan): boolean {
    return this.selectedPlan?.id === plan.id;
  }

  private loadPlans(): void {
    this.isFetchingPlans = true;
    this.subscriptionService.listPlans('key-vault').subscribe({
      next: (res: any) => {
        const planList = Array.isArray(res) ? res : (res?.data ?? []);
        this.plans = planList.filter((p: any) => p.active);
        if (this.plans.length > 0 && !this.selectedPlan) {
          this.selectedPlan = this.plans[0];
        }
        this.isFetchingPlans = false;
      },
      error: () => {
        this.plans = this.getFallbackPlans();
        if (this.plans.length > 0 && !this.selectedPlan) {
          this.selectedPlan = this.plans[0];
        }
        this.isFetchingPlans = false;
        this.errorMessage = '';
      },
    });
  }

  private getFallbackPlans(): Plan[] {
    return [
      { id: '1', code: 'KV_STARTER', name: 'KeyVault Pro Starter', monthlyPriceCents: 4900, annualPriceCents: 49000, currency: 'GBP', trialEligible: false, features: {}, active: true, sortOrder: 10, serviceCode: 'key-vault' },
      { id: '2', code: 'KV_USER_LICENCE', name: 'KeyVault Pro User Licence', monthlyPriceCents: 999, annualPriceCents: 8290, currency: 'GBP', trialEligible: false, features: {}, active: true, sortOrder: 15, serviceCode: 'key-vault' },
      { id: '3', code: 'KV_PROFESSIONAL', name: 'KeyVault Pro Professional', monthlyPriceCents: 12900, annualPriceCents: 129000, currency: 'GBP', trialEligible: false, features: {}, active: true, sortOrder: 20, serviceCode: 'key-vault' },
      { id: '4', code: 'KV_BUSINESS', name: 'KeyVault Pro Business', monthlyPriceCents: 24900, annualPriceCents: 249000, currency: 'GBP', trialEligible: false, features: {}, active: true, sortOrder: 30, serviceCode: 'key-vault' },
    ];
  }
}
