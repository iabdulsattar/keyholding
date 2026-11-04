export interface Environment {
  production: boolean;
  OPENROUTER_API_URL: string;
  OPENROUTER_API_KEY: string;
  OPENROUTER_MODEL: string;
  stripePublishableKey: string;
  trialPlanId: string;
  apiBase: string;
  socketUrl: string;
  productUrls: Record<string, string>;
}