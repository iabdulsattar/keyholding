import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, tap, switchMap, catchError } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { SubscriptionService } from './subscription.service';
import { KeyVaultService } from './keyvault.service';
import { Product, ProductSubscriptionRequest, EnableServiceRequest, ProductSwitchResponse } from '../models/product.models';
import { ServiceInfo } from '../models/subscription.models';

/**
 * This deployment *is* KeyVault Pro, so it is the default "current" product
 * when no explicit service code has been stored for the session.
 */
const OWN_SERVICE_CODE = 'key-vault';

// Local product definitions with UI metadata (icons, URLs, plan IDs)
const LOCAL_PRODUCTS: Product[] = [
  {
    id: 'keyvault',
    name: 'KeyVault ',
    description: 'Enterprise Key Management',
    serviceCode: 'key-vault',
    baseUrl: 'https://sbskeyvault.workalert.uk',
    planId: 'f28006cf-1174-4042-859a-8a3d2e78d60f',
    icon: '<path d="M12 3 5 6v5c0 4.500 3 8 7 10 4-2 7-5.500 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
    iconBg: 'bg-violet-700',
    status: 'current',
    actionLabel: 'Explore KeyVault ',
    descriptionText: 'Securely register, issue, track and audit every key across your organisation.',
  },
  {
    id: 'edob',
    name: 'eDOB',
    description: 'Digital Occurrence Management',
    serviceCode: 'edob',
    baseUrl: 'https://sbsedob.workalert.uk',
    icon: '<path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.500 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
    iconBg: 'bg-blue-600',
    status: 'available',
    actionLabel: 'Switch to eDOB',
    descriptionText: 'Record and manage digital occurrence certificates for every work location.',
  },
];

@Injectable({ providedIn: 'root' })
export class ProductService {
  private products: Product[] = [...LOCAL_PRODUCTS];
  private servicesLoaded = false;
  private servicesLoading = false;
  private currentProductId: string | null = null;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private subscriptionService: SubscriptionService,
    private keyVaultService: KeyVaultService
  ) {}

  getProducts(): Product[] {
    return this.products;
  }

  /** Load services from API and merge with local definitions */
  loadServicesFromApi(): Observable<Product[]> {
    if (this.servicesLoaded || this.servicesLoading) {
      return of(this.products);
    }
    this.servicesLoading = true;
    return this.subscriptionService.listServices().pipe(
      switchMap((services: ServiceInfo[]) => {
        this.mergeServices(services);
        this.servicesLoaded = true;
        // Fetch all active subscriptions to ensure subscribed status is accurate
        const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
        if (orgId) {
          return this.fetchAllActiveSubscriptions(orgId).pipe(
            tap((activeServiceCodes) => {
              // Merge with existing cached subscriptions
              const cached = this.getSubscribedServiceCodes();
              const merged = [...new Set([...cached, ...activeServiceCodes])];
              localStorage.setItem('subscribed_services', JSON.stringify(
                merged.map(code => ({ serviceCode: code, status: 'ACTIVE' }))
              ));
            }),
            map(() => this.products),
            catchError(() => of(this.products))
          );
        }
        return of(this.products);
      }),
      tap(() => {
        this.servicesLoading = false;
        this.syncStatusesFromSubscriptions();
      }),
      catchError(() => {
        this.servicesLoading = false;
        this.syncStatusesFromSubscriptions();
        return of(this.products);
      })
    );
  }

  /** Merge API services with local product definitions */
  private mergeServices(services: ServiceInfo[]): void {
    for (const svc of services) {
      const isActive = (svc as any).active === true;
      const existing = this.products.find(p => p.serviceCode === svc.code);
      if (existing) {
        // Update name/description from API
        existing.name = svc.name || existing.name;
        existing.description = svc.description || existing.description;
        // Store active flag for status computation
        (existing as any).apiActive = isActive;
      } else {
        // New service from API - add with defaults
        this.products.push({
          id: svc.code,
          name: svc.name,
          description: svc.description || '',
          serviceCode: svc.code,
          baseUrl: (svc as any).baseUrl || '',
          planId: (svc as any).planId || '',
          icon: (svc as any).icon || '<path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.500 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
          iconBg: (svc as any).iconBg || 'bg-slate-600',
          status: 'available',
          actionLabel: `Switch to ${svc.name}`,
          descriptionText: svc.description || '',
          apiActive: isActive,
        });
      }
    }
  }

  /** Service codes the identity service reports as subscribed for this org. */
  getSubscribedServiceCodes(): string[] {
    const cached = localStorage.getItem('subscribed_services');
    if (!cached) return [];
    try {
      const parsed = JSON.parse(cached);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((s: any) => s?.serviceCode).filter(Boolean);
    } catch {
      return [];
    }
  }

  /** Fetch all active subscription service codes from subscription history API */
  fetchAllActiveSubscriptions(orgId: string): Observable<string[]> {
    return this.subscriptionService.getSubscriptionHistory(orgId).pipe(
      map((res: any) => {
        const data = res?.data ?? res ?? {};
        const history = data.content ?? data.items ?? data.data ?? data ?? [];
        return history
          .filter((sub: any) => sub?.status === 'ACTIVE' || sub?.status === 'TRIALING')
          .map((sub: any) => sub?.serviceCode)
          .filter(Boolean);
      }),
      catchError(() => of([]))
    );
  }

  /**
   * This deployment *is* KeyVault Pro, so it is always the "current" product -
   * the stored service code may be left over from another app on the same
   * domain and must not move the badge onto a different product.
   */
  private getStoredServiceCode(): string {
    return OWN_SERVICE_CODE;
  }

  /**
   * Recompute each product's status from the persisted subscription list:
   * - this app's own service is `current`
   * - API active: true + subscribed → `subscribed` (shown as "active")
   * - API active: true + not subscribed → `available`
   * - API active: false → `available`
   * - no API active flag (local-only) → fallback to baseUrl check
   */
  syncStatusesFromSubscriptions(serviceCode?: string): void {
    const active = OWN_SERVICE_CODE;
    const subscribed = this.getSubscribedServiceCodes();

    this.currentProductId = this.products.find(p => p.serviceCode === active)?.id ?? null;

    this.products = this.products.map((p) => {
      const isCurrent = !!active && p.serviceCode === active;
      const isSubscribed = subscribed.includes(p.serviceCode);
      const apiActive = (p as any).apiActive === true;
      const hasBaseUrl = !!p.baseUrl;

      let status: Product['status'] = p.status;
      if (isCurrent) {
        status = 'current';
      } else if (apiActive) {
        // Service is active in the platform
        if (isSubscribed) {
          // Org is subscribed to this active service
          status = 'subscribed';
        } else {
          // Active service but org not subscribed - available to enable
          status = 'available';
        }
      } else if (!apiActive && (p as any).apiActive === false) {
        // Service exists but is inactive in platform - still show as available
        status = 'available';
      } else if (hasBaseUrl) {
        // Local-only product with baseUrl (deployed but no API flag yet)
        status = isSubscribed ? 'subscribed' : 'available';
      } else if (p.status === 'current') {
        status = 'coming-soon';
      }

      return { ...p, status };
    });
  }

  getProductById(id: string): Product | undefined {
    return this.products.find(p => p.id === id);
  }

  getProductByServiceCode(serviceCode: string): Product | undefined {
    return this.products.find(p => p.serviceCode === serviceCode);
  }

  setCurrentProduct(productId: string): void {
    this.currentProductId = productId;
  }

  getCurrentProduct(): Product | undefined {
    if (this.currentProductId) {
      return this.products.find(p => p.id === this.currentProductId);
    }
    return this.products.find(p => p.status === 'current');
  }

  getCurrentServiceCode(): string | null {
    const current = this.getCurrentProduct();
    return current?.serviceCode ?? null;
  }

  startSubscription(orgId: string, request: ProductSubscriptionRequest, token?: string): Observable<any> {
    return this.subscriptionService.startSubscription(orgId, request, request.serviceCode, token).pipe(
      tap(() => this.invalidateCache(orgId, request.serviceCode))
    );
  }

  startSubscriptionForProduct(orgId: string, productId: string, billingPeriod: 'MONTHLY' | 'ANNUAL' = 'MONTHLY', useTrial = true, token?: string): Observable<any> {
    const product = this.getProductById(productId);
    if (!product || !product.planId) {
      throw new Error(`Product ${productId} not found or missing planId`);
    }

    const request: ProductSubscriptionRequest = {
      serviceCode: product.serviceCode,
      planId: product.planId,
      billingPeriod,
      useTrial,
    };

    return this.startSubscription(orgId, request, token);
  }

  getSubscription(orgId: string, serviceCode: string): Observable<any> {
    return this.subscriptionService.getSubscription(orgId, serviceCode);
  }

  enableService(orgId: string, request: EnableServiceRequest): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(this.auth.getAccessToken() ? { Authorization: `Bearer ${this.auth.getAccessToken()}` } : {})
    });

    const payload = { email: request.email, code: request.code, baseUrl: request.baseUrl };

    return this.api.post<any>(
      `/api/v1/users/organizations/${orgId}/services/${request.serviceCode}/enable`,
      payload,
      headers
    );
  }

  switchToProduct(productId: string, orgId: string, email: string, otpCode: string): Observable<ProductSwitchResponse> {
    const product = this.getProductById(productId);
    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    return this.enableService(orgId, {
      serviceCode: product.serviceCode,
      email,
      code: otpCode,
      baseUrl: product.baseUrl
    }).pipe(
      switchMap(() => this.refreshTokenForProduct(product.serviceCode))
    );
  }

  // Switch to product using existing refresh token (no OTP required)
  switchToProductWithRefreshToken(productId: string): Observable<ProductSwitchResponse> {
    const product = this.getProductById(productId);
    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    const refreshToken = this.auth.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available. Please log in first.');
    }

    return this.auth.refreshForService({ refreshToken }, product.serviceCode).pipe(
      tap((res: any) => {
        const newAccessToken = res?.access_token ?? res?.tokens?.access_token;
        const newRefreshToken = res?.refresh_token ?? res?.tokens?.refresh_token;
        const organizations = res?.organizations ?? res?.tokens?.organizations;

        if (newAccessToken) {
          this.auth.setTokens(newAccessToken, newRefreshToken, String(Date.now() + 24 * 60 * 60 * 1000), product.serviceCode);
        }

        this.setCurrentProductByServiceCode(product.serviceCode);
      }),
      map((res: any) => ({
        accessToken: res?.access_token ?? res?.tokens?.access_token,
        refreshToken: res?.refresh_token ?? res?.tokens?.refresh_token,
        organizations: res?.organizations ?? res?.tokens?.organizations ?? []
      }))
    );
  }

  private refreshTokenForProduct(serviceCode: string): Observable<ProductSwitchResponse> {
    const refreshToken = this.auth.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    return this.auth.refreshForService({ refreshToken }, serviceCode).pipe(
      tap((res: any) => {
        const newAccessToken = res?.access_token ?? res?.tokens?.access_token;
        const newRefreshToken = res?.refresh_token ?? res?.tokens?.refresh_token;
        const organizations = res?.organizations ?? res?.tokens?.organizations;

        if (newAccessToken) {
          this.auth.setTokens(newAccessToken, newRefreshToken, String(Date.now() + 24 * 60 * 60 * 1000), serviceCode);
        }

        this.setCurrentProductByServiceCode(serviceCode);
      }),
      map((res: any) => ({
        accessToken: res?.access_token ?? res?.tokens?.access_token,
        refreshToken: res?.refresh_token ?? res?.tokens?.refresh_token,
        organizations: res?.organizations ?? res?.tokens?.organizations ?? []
      }))
    );
  }

  /**
   * Cross-app product switch: hand the refresh token to the target product's
   * external-login endpoint, which exchanges it, persists the response and
   * routes the user on. Mirrors the behaviour of the other Sentinel apps.
   */
  redirectToProduct(productId: string): void {
    const product = this.getProductById(productId);
    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }
    if (product.serviceCode === this.getStoredServiceCode()) {
      throw new Error('You are already using this product.');
    }
    if (!product.baseUrl) {
      throw new Error(`Product ${productId} has no application URL configured`);
    }

    const refreshToken = this.auth.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available. Please log in first.');
    }

    const target = `${product.baseUrl.replace(/\/+$/, '')}/external-login`
      + `?token=${encodeURIComponent(refreshToken)}`
      + `&serviceCode=${encodeURIComponent(product.serviceCode)}`;

    window.location.href = target;
  }

  setCurrentProductByServiceCode(serviceCode: string): void {
    const product = this.products.find(p => p.serviceCode === serviceCode);
    if (product) {
      this.currentProductId = product.id;
      this.syncStatusesFromSubscriptions(serviceCode);
    }
  }

  private invalidateCache(orgId: string, serviceCode: string): void {
    this.subscriptionService['invalidateSubscriptionCache'](orgId, serviceCode);
  }

  refreshTokenForCurrentProduct(): Observable<ProductSwitchResponse> {
    const serviceCode = this.getCurrentServiceCode();
    if (!serviceCode) {
      throw new Error('No current product selected');
    }
    return this.refreshTokenForProduct(serviceCode);
  }
}