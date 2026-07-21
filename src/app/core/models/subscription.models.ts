// -------- Plans --------
export interface Plan {
  id: string;
  code: string;
  name: string;
  description?: string;
  monthlyPriceCents: number;
  annualPriceCents: number;
  currency: string;
  trialEligible: boolean;
  trialDays?: number;
  features: Record<string, any>;
  active: boolean;
  sortOrder: number;
  stripePriceIdMonthly?: string;
  stripePriceIdAnnual?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface CreatePlanRequest {
  code: string;
  name: string;
  description?: string;
  monthlyPriceCents: number;
  annualPriceCents: number;
  currency?: string;
  trialEligible?: boolean;
  trialDays?: number;
  features?: Record<string, any>;
  active?: boolean;
  sortOrder?: number;
}

// -------- Subscriptions --------
export type SubscriptionStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'CANCELLED' | 'TRIALING' | 'PAST_DUE';
export type BillingPeriod = 'MONTHLY' | 'ANNUAL';

export interface Subscription {
  id: string;
  organizationId: string;
  planId: string;
  planCode?: string;
  planName?: string;
  status: SubscriptionStatus;
  billingPeriod: BillingPeriod;
  trialEnd?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: string;
  startDate: string;
  endDate?: string;
  stripeSubscriptionId?: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export interface StartSubscriptionRequest {
  planId: string;
  billingPeriod: BillingPeriod;
  useTrial?: boolean;
  paymentMethodId?: string;
}

export interface StartSubscriptionResponse {
  subscription: Subscription;
  [key: string]: any;
}

export interface ChangePlanRequest {
  newPlanId: string;
  billingPeriod: BillingPeriod;
}

export interface ChangePlanResponse {
  subscription: Subscription;
  [key: string]: any;
}

export interface CancelSubscriptionRequest {
  cancelAtPeriodEnd: boolean;
  reason?: string;
}

export interface CancelSubscriptionResponse {
  subscription: Subscription;
  [key: string]: any;
}

export interface ListSubscriptionsResponse {
  subscriptions: Subscription[];
  [key: string]: any;
}

export interface SubscriptionHistoryResponse {
  subscriptions: Subscription[];
  total: number;
  [key: string]: any;
}

// -------- Subscription Check (gating) --------
export interface SubscriptionCheckResponse {
  active: boolean;
  status?: string;
  planCode?: string;
  planName?: string;
  features: Record<string, any>;
  [key: string]: any;
}