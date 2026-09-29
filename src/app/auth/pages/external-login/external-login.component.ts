import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ProductService } from '../../../core/services/product.service';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { SubscriptionStatusService } from '../../../core/services/subscription-status.service';
import { KeyVaultService } from '../../../core/services/keyvault.service';
import { PermissionService, ServiceAccessGrant } from '../../../core/services/permission.service';
import { ToastService } from '../../../core/services/toast.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-external-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-slate-50">
      <div class="bg-white rounded-xl shadow-sm p-8 max-w-md w-full mx-4">
        @if (loading) {
          <div class="text-center">
            <div class="inline-block animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent"></div>
            <p class="mt-4 text-slate-600">{{ loadingMessage }}</p>
          </div>
        } @else if (error) {
          <div class="text-center">
            <svg class="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <h2 class="mt-4 text-lg font-semibold text-slate-900">Unable to Sign In</h2>
            <p class="mt-2 text-slate-600">{{ error }}</p>
            <a routerLink="/signin" class="mt-6 inline-block text-blue-600 hover:underline">Go to Sign In</a>
          </div>
        } @else {
          <div class="text-center">
            <svg class="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            <h2 class="mt-4 text-lg font-semibold text-slate-900">Signed In Successfully</h2>
            <p class="mt-2 text-slate-600">Redirecting to {{ productName }}...</p>
          </div>
        }
      </div>
    </div>
  `
})
export class ExternalLoginComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private productService = inject(ProductService);
  private subscriptionService = inject(SubscriptionService);
  private subStatus = inject(SubscriptionStatusService);
  private keyVault = inject(KeyVaultService);
  private permissionService = inject(PermissionService);
  private toast = inject(ToastService);

  loading = true;
  loadingMessage = 'Signing you in...';
  error: string | null = null;
  productName = '';

  ngOnInit(): void {
    this.route.queryParams.subscribe(async (params) => {
      const refreshToken = params['refreshToken'];
      const serviceCode = params['serviceCode'];

      if (!refreshToken || !serviceCode) {
        this.loading = false;
        this.error = 'Invalid link: missing refresh token or service code';
        return;
      }

      try {
        await this.handleExternalLogin(refreshToken, serviceCode);
      } catch (err: any) {
        this.loading = false;
        this.error = err.message || 'Failed to sign in with the provided link';
      }
    });
  }

  private async handleExternalLogin(refreshToken: string, serviceCode: string): Promise<void> {
    const product = this.productService.getProductByServiceCode(serviceCode);
    this.productName = product?.name || serviceCode;

    console.log('[ExternalLogin] Starting full login flow for:', serviceCode);

    try {
      // Step 1: Exchange refresh token for target service
      this.loadingMessage = 'Exchanging tokens...';
      const res = await this.authService.refreshForService({ refreshToken }, serviceCode).toPromise();
      console.log('[ExternalLogin] Refresh response:', res);

      const tokens = res?.['tokens'] ?? res;
      const newAccessToken = tokens?.['access_token'];
      const newRefreshToken = tokens?.['refresh_token'];
      const organizations = tokens?.['organizations'];

      if (!newAccessToken) {
        console.error('[ExternalLogin] No access token in response:', res);
        throw new Error('No access token received from server');
      }

      // Step 2: Store tokens and set current product
      this.authService.setTokens(newAccessToken, newRefreshToken, String(Date.now() + 24 * 60 * 60 * 1000), serviceCode);
      this.productService.setCurrentProductByServiceCode(serviceCode);

      // Step 3: Store organization ID
      let orgId = organizations?.[0]?.id || organizations?.[0]?.organizationId;
      if (!orgId) {
        // Fetch organizations if not in response
        try {
          const orgs = await this.authService.listOrganizations(newAccessToken).toPromise();
          orgId = orgs?.organizations?.[0]?.id || orgs?.organizations?.[0]?.organizationId;
        } catch (e) {
          console.warn('[ExternalLogin] Could not fetch organizations:', e);
        }
      }
      if (orgId) {
        localStorage.setItem('org_id', orgId);
        localStorage.setItem('organizationId', orgId);
        sessionStorage.setItem('org_id', orgId);
        sessionStorage.setItem('organizationId', orgId);
        console.log('[ExternalLogin] Stored org_id:', orgId);
      }

      // Step 4: Store permissions from response
      const serviceAccess = tokens?.['serviceAccess'] || [];
      this.permissionService.setServiceAccess(serviceAccess);
      const orgRole = organizations?.[0]?.role;
      this.permissionService.setOrgRole(orgRole);

      // Step 5: Check subscription for the target service
      this.loadingMessage = 'Checking subscription...';
      if (orgId) {
        try {
          const subRes = await this.subscriptionService.getSubscription(orgId, serviceCode).toPromise();
          console.log('[ExternalLogin] Subscription response:', subRes);
          this.subStatus.setFromResponse(subRes);
        } catch (subErr) {
          console.warn('[ExternalLogin] Subscription check failed:', subErr);
        }
      }

      // Step 6: Enable service if needed (similar to login flow)
      // Note: External login uses refresh token exchange which should grant access directly
      // No email/OTP needed since user is already authenticated
      const hasServiceAccess = (this.permissionService.getServiceAccess() ?? []).some(
        (g: ServiceAccessGrant) => g.serviceCode === serviceCode
      );

      if (!hasServiceAccess && orgId) {
        this.loadingMessage = 'Enabling service...';
        try {
          // Try to enable the service - pass empty strings as we have valid tokens
          await this.keyVault.enableService(orgId, serviceCode, '', '').toPromise();
          this.permissionService.setServiceAccess([
            ...(this.permissionService.getServiceAccess() ?? []),
            { serviceCode, wildcard: false, permissions: [], roles: [] }
          ]);
        } catch (enableErr) {
          console.warn('[ExternalLogin] Service enable failed:', enableErr);
          // Continue anyway - token exchange may have already granted access
        }
      }

      // Step 7: Final token refresh to ensure fresh tokens
      this.loadingMessage = 'Finalizing...';
      try {
        const finalRes = await this.authService.refreshForService({ refreshToken: newRefreshToken || '' }, serviceCode).toPromise();
        const finalTokens = finalRes?.['tokens'] ?? finalRes;
        const finalAccessToken = finalTokens?.['access_token'];
        const finalRefreshToken = finalTokens?.['refresh_token'];
        
        if (finalAccessToken) {
          this.authService.setTokens(finalAccessToken, finalRefreshToken, String(Date.now() + 24 * 60 * 60 * 1000), serviceCode);
        }
      } catch (e) {
        console.warn('[ExternalLogin] Final refresh failed:', e);
      }

      // Step 8: Trigger subscription status check
      this.subStatus.checkNow();

      this.loading = false;

      setTimeout(() => {
        this.router.navigate(['/']);
      }, 1500);
    } catch (err: any) {
      console.error('[ExternalLogin] Error:', err);
      console.error('[ExternalLogin] Error status:', err?.status);
      console.error('[ExternalLogin] Error body:', err?.error);
      throw err;
    }
  }
}