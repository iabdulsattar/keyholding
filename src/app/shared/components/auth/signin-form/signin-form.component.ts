import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { PermissionService, ServiceAccessGrant } from '../../../../core/services/permission.service';
import { Router } from '@angular/router';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { KeyVaultService } from '../../../../core/services/keyvault.service';
import { SubscriptionService } from '../../../../core/services/subscription.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-signin-form',
  imports: [
    RouterModule,
    FormsModule,
    InputFieldComponent,
    ButtonComponent
  ],
  templateUrl: './signin-form.component.html',
  styles: ''
})
export class SigninFormComponent {

  constructor(
    private authService: AuthService,
    private permissionService: PermissionService,
    private router: Router,
    private keyVault: KeyVaultService,
    private subscriptionService: SubscriptionService,
    private toast: ToastService,
  ) {}

  showPassword = false;
  isChecked = false;

  email = '';
  password = '';

  isLoading = false;
  emailError = '';
  passwordError = '';

  // ---- OTP (2FA) step ----
  requiresOtp = false;
  challengeToken = '';
  otpSentTo = '';
  d1 = '';
  d2 = '';
  d3 = '';
  d4 = '';
  d5 = '';
  d6 = '';
  digitError = false;

  get otpCode(): string {
    return [this.d1, this.d2, this.d3, this.d4, this.d5, this.d6].map(d => (d ?? '').toString()).join('');
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  private resetOtpStep() {
    this.d1 = this.d2 = this.d3 = this.d4 = this.d5 = this.d6 = '';
    this.digitError = false;
  }

  onOtpPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pasted = (event.clipboardData?.getData('text') ?? '').replace(/\s+/g, '');
    const digits = pasted.replace(/\D/g, '').slice(0, 6);
    if (digits.length !== 6) return;
    this.d1 = digits[0];
    this.d2 = digits[1];
    this.d3 = digits[2];
    this.d4 = digits[3];
    this.d5 = digits[4];
    this.d6 = digits[5];
  }

  backToSignIn() {
    this.requiresOtp = false;
    this.challengeToken = '';
    this.resetOtpStep();
  }

  resendOtp() {
    if (!this.email.trim()) {
      this.toast.error('Email is missing. Please go back and try again.');
      return;
    }
    this.isLoading = true;
    this.authService.login({ email: this.email, password: this.password, serviceCode: 'key-vault' }).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res?.challengeToken) {
          this.challengeToken = res.challengeToken;
        }
        this.resetOtpStep();
        this.toast.success('A new verification code has been sent to your email.');
      },
      error: () => {
        this.isLoading = false;
        this.toast.error('Failed to resend the code. Please try again.');
      }
    });
  }

  onVerifyOtp() {
    this.isLoading = true;
    this.digitError = false;

    const code = this.otpCode.replace(/\s+/g, '').trim();
    if (!/^\d{6}$/.test(code)) {
      this.isLoading = false;
      this.digitError = true;
      this.toast.error('Enter the 6-digit verification code.');
      return;
    }

    this.authService.verify2fa({ challengeToken: this.challengeToken, code }).subscribe({
      next: (res: any) => {
        const accessToken = res?.access_token ?? res?.tokens?.access_token;
        const refreshToken = res?.refresh_token ?? res?.tokens?.refresh_token;
        if (accessToken) {
          this.finalizeLogin({ tokens: { access_token: accessToken, refresh_token: refreshToken } });
        } else {
          this.toast.success('Verification successful. Completing sign-in...');
          this.authService.login({ email: this.email, password: this.password, serviceCode: 'key-vault' }).subscribe({
            next: (loginRes: any) => {
              this.finalizeLogin(loginRes);
            },
            error: () => {
              this.isLoading = false;
              this.toast.error('Verification succeeded but automatic sign-in failed. Please sign in manually.');
            }
          });
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        const detail = err?.error?.detail || err?.error?.message;
        this.toast.error(detail ? `Verification failed: ${detail}` : 'Invalid or expired code. Please try again.');
      }
    });
  }

  private decodeExp(token: string): number | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  }

  private validateForm(): boolean {
    let isValid = true;
    this.emailError = '';
    this.passwordError = '';

    if (!this.email.trim()) {
      this.emailError = 'Email is required';
      isValid = false;
    }

    if (!this.password) {
      this.passwordError = 'Password is required';
      isValid = false;
    }

    return isValid;
  }

  onSignIn() {
    this.isLoading = true;
    this.emailError = '';
    this.passwordError = '';

    if (!this.validateForm()) {
      this.isLoading = false;
      return;
    }

    this.authService.login({ email: this.email, password: this.password, serviceCode: 'key-vault' }).subscribe({
      next: (res) => {
        const data = res as any;

        if (data?.requiresOtp || data?.challengeToken) {
          this.requiresOtp = true;
          this.challengeToken = data?.challengeToken ?? '';
          this.otpSentTo = this.email;
          this.resetOtpStep();
          this.isLoading = false;
          return;
        }

        this.finalizeLogin(data);
      },
      error: (err) => {
        console.error('Login error:', err);
        this.isLoading = false;

        if (err.status === 401) {
          this.toast.error('Invalid email or password. Please try again.');
        } else if (err.status === 400) {
          this.toast.error(err.error?.detail || 'Please check your input and try again.');
        } else {
          this.toast.error('An error occurred. Please try again later.');
        }
      }
    });
  }

  private finalizeLogin(data: any) {
    const accessToken = data?.tokens?.access_token ?? data?.access_token;
    const refreshToken = data?.tokens?.refresh_token ?? data?.refresh_token;

    if (!accessToken) {
      this.isLoading = false;
      this.toast.error('Login succeeded but no access token was returned. Please contact support.');
      return;
    }

    const exp = this.decodeExp(accessToken);
    const expiresAt = String(exp ?? Date.now() + 24 * 60 * 60 * 1000);

    localStorage.setItem('access_token_saas', accessToken);
    localStorage.setItem('refresh_token', refreshToken ?? '');

    if (this.isChecked) {
      localStorage.setItem('remember_device', 'true');
      localStorage.setItem('session_expires_at', expiresAt);
    } else {
      localStorage.removeItem('remember_device');
      localStorage.removeItem('session_expires_at');
      sessionStorage.setItem('access_token_saas', accessToken);
      sessionStorage.setItem('refresh_token', refreshToken ?? '');
      sessionStorage.setItem('session_expires_at', expiresAt);
    }

    const orgs = data?.tokens?.organizations ?? data?.organizations ?? [];
    const storeOrg = (id: string, name?: string) => {
      localStorage.setItem('org_id', id);
      localStorage.setItem('organizationId', id);
      if (name) {
        localStorage.setItem('organizationName', name);
        localStorage.setItem('org_name', name);
      }
    };
    if (orgs?.length > 0) {
      storeOrg(orgs[0].id, orgs[0].name);
    } else {
      this.authService.me(accessToken).subscribe({
        next: (profile: any) => {
          const profileOrgs = profile?.organizations ?? [];
          if (profileOrgs?.length > 0) {
            storeOrg(profileOrgs[0].id, profileOrgs[0].name);
          }
        },
        error: () => {
        }
      });
    }

    this.authService.getSession(accessToken).subscribe({
      next: (session: any) => {
        const sessionOrgs = session?.organizations ?? [];
        if (sessionOrgs?.length > 0) {
          storeOrg(sessionOrgs[0].id, sessionOrgs[0].name);
        }
        if (sessionOrgs[0]?.subscription?.active === false) {
          console.log('Subscription not active — frontend should route to plan-selection page');
        }
      },
      error: () => {
      }
    });

    this.permissionService.setServiceAccess((data?.serviceAccess as ServiceAccessGrant[]) ?? data?.tokens?.serviceAccess);

    const orgRole = orgs?.length > 0 ? orgs[0].role : undefined;
    this.permissionService.setOrgRole(orgRole);

    const hasKeyVaultAccess = (this.permissionService.getServiceAccess() ?? []).some(
      (g) => g.serviceCode === 'key-vault'
    );
    console.log('[Signin] hasKeyVaultAccess=', hasKeyVaultAccess);

    const finalizeAndNavigate = () => {
      console.log('[Signin] finalizeAndNavigate -> startTrialIfNeeded');
      this.startTrialIfNeeded(() => {
        this.isLoading = false;
        this.toast.success('Login successful! Redirecting...');
        setTimeout(() => this.router.navigate(['/']), 600);
      });
    };

    if (!hasKeyVaultAccess) {
      const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
      if (orgId) {
        this.keyVault.enableService(orgId, 'key-vault', this.email, this.otpCode || '').subscribe({
          next: () => {
            this.permissionService.setServiceAccess([
              ...(this.permissionService.getServiceAccess() ?? []),
              { serviceCode: 'key-vault', wildcard: false, permissions: [], roles: [] }
            ]);
            finalizeAndNavigate();
          },
          error: () => {
            this.permissionService.setServiceAccess([
              ...(this.permissionService.getServiceAccess() ?? []),
              { serviceCode: 'key-vault', wildcard: false, permissions: [], roles: [] }
            ]);
            finalizeAndNavigate();
          }
        });
      } else {
        finalizeAndNavigate();
      }
    } else {
      finalizeAndNavigate();
    }
  }

  private startTrialIfNeeded(done: () => void): void {
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
    console.log('[Signin] startTrialIfNeeded orgId=', orgId, 'subscription_started=', localStorage.getItem('subscription_started'));
    if (!orgId || localStorage.getItem('subscription_started')) {
      console.log('[Signin] startTrialIfNeeded skipped');
      done();
      return;
    }

    console.log('[Signin] calling startSubscription planId=5ab78dd5-96ea-4dcc-9c89-66f9bed45368');
    this.subscriptionService.startSubscription(orgId, {
      planId: '5ab78dd5-96ea-4dcc-9c89-66f9bed45368',
      billingPeriod: 'MONTHLY',
      useTrial: true,
    }).subscribe({
      next: () => {
        console.log('[Signin] startSubscription next');
        localStorage.setItem('subscription_started', 'true');
        done();
      },
      error: (err) => {
        console.log('[Signin] startSubscription error', err);
        done();
      }
    });
  }
}

