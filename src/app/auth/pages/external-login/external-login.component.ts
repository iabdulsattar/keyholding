import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ProductService } from '../../../core/services/product.service';
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
            <p class="mt-4 text-slate-600">Signing you in...</p>
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

  loading = true;
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

    const res = await this.authService.refreshForService({ refreshToken }, serviceCode).toPromise();

    const newAccessToken = res?.['access_token'] ?? res?.['tokens']?.['access_token'];
    const newRefreshToken = res?.['refresh_token'] ?? res?.['tokens']?.['refresh_token'];
    const organizations = res?.['organizations'] ?? res?.['tokens']?.['organizations'];

    if (!newAccessToken) {
      throw new Error('No access token received');
    }

    this.authService.setTokens(newAccessToken, newRefreshToken, String(Date.now() + 24 * 60 * 60 * 1000), serviceCode);
    this.productService.setCurrentProductByServiceCode(serviceCode);

    this.loading = false;

    setTimeout(() => {
      this.router.navigate(['/']);
    }, 1500);
  }
}