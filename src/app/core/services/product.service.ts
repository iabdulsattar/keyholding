import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, tap, switchMap, catchError } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { SubscriptionService } from './subscription.service';
import { KeyVaultService } from './keyvault.service';
import { Product, ProductSubscriptionRequest, EnableServiceRequest, ProductSwitchResponse } from '../models/product.models';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private products: Product[] = [
    {
      id: 'keyvault',
      name: 'KeyVault Pro',
      description: 'Enterprise Key Management',
      serviceCode: 'key-vault',
      baseUrl: 'https://sbskeyvault.workalert.uk',
      planId: 'f28006cf-1174-4042-859a-8a3d2e78d60f',
      icon: '<path d="M12 3 5 6v5c0 4.500 3 8 7 10 4-2 7-5.500 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
      iconBg: 'bg-violet-700',
      status: 'available',
      actionLabel: 'Explore KeyVault Pro',
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
      status: 'coming-soon',
    },
    {
      id: 'misentinel',
      name: 'MiSentinelSOS',
      description: 'Lone Worker Safety',
      serviceCode: 'misentinel',
      baseUrl: 'https://sbsmisentinel.workalert.uk',
      icon: '<path d="M12 3 5 6v5c0 4.500 3 8 7 10 4-2 7-5.500 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
      iconBg: 'bg-emerald-600',
      status: 'coming-soon',
    },
  ];

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

  /** Get the external login URL for a product (e.g., to share via email) */
  getExternalLoginUrl(productId: string, refreshToken: string): string | null {
    const product = this.getProductById(productId);
    if (!product) return null;
    const baseUrl = window.location.origin;
    return `${baseUrl}/external-login?refreshToken=${encodeURIComponent(refreshToken)}&serviceCode=${product.serviceCode}`;
  }

  /** Get all available products for quick login links */
  getAvailableProducts(): Product[] {
    return this.products.filter(p => p.status !== 'coming-soon');
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

    console.log('[ProductService] Switching to product:', product.id, 'serviceCode:', product.serviceCode);
    console.log('[ProductService] Using refresh token (first 20 chars):', refreshToken.substring(0, 20) + '...');

    return this.auth.refreshForService({ refreshToken }, product.serviceCode).pipe(
      tap((res: any) => {
        console.log('[ProductService] Switch response:', res);
        const newAccessToken = res?.access_token ?? res?.tokens?.access_token;
        const newRefreshToken = res?.refresh_token ?? res?.tokens?.refresh_token;
        const organizations = res?.organizations ?? res?.tokens?.organizations;

        if (newAccessToken) {
          this.auth.setTokens(newAccessToken, newRefreshToken, String(Date.now() + 24 * 60 * 60 * 1000), product.serviceCode);
        }

        this.setCurrentProductByServiceCode(product.serviceCode);
      }),
      catchError((error) => {
        console.error('[ProductService] Switch failed:', error);
        console.error('[ProductService] Error status:', error?.status);
        console.error('[ProductService] Error body:', error?.error);
        throw error;
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

  setCurrentProductByServiceCode(serviceCode: string): void {
    const product = this.products.find(p => p.serviceCode === serviceCode);
    if (product) {
      this.currentProductId = product.id;
      this.products = this.products.map(p => ({
        ...p,
        status: p.id === product.id ? 'current' : p.status
      }));
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