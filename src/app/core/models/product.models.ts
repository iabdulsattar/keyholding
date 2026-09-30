export interface Product {
  id: string;
  name: string;
  description: string;
  serviceCode: string;
  baseUrl: string;
  planId?: string;
  icon: string;
  iconBg: string;
  status: 'current' | 'subscribed' | 'available' | 'coming-soon';
  actionLabel?: string;
  actionHref?: string;
  descriptionText?: string;
}

export interface ProductSubscriptionRequest {
  serviceCode: string;
  planId: string;
  billingPeriod: 'MONTHLY' | 'ANNUAL';
  useTrial?: boolean;
  paymentMethodId?: string;
  config?: Record<string, any>;
}

export interface EnableServiceRequest {
  serviceCode: string;
  email: string;
  code: string;
  baseUrl?: string;
}

export interface ProductSwitchResponse {
  accessToken: string;
  refreshToken: string;
  organizations: Array<{
    id: string;
    name: string;
    slug: string;
    role?: string;
    subscription?: {
      active: boolean;
      status?: string;
      planCode?: string;
      planName?: string;
      daysUntilExpiry: number | null;
      features?: Record<string, any>;
    };
  }>;
}