import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { InputFieldComponent } from '../../form/input/input-field.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { CheckboxComponent } from '../../form/input/checkbox.component';
import { AuthService } from '../../../../core/services/auth.service';
import { PermissionService, ServiceAccessGrant } from '../../../../core/services/permission.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-verification-form',
  imports: [
    RouterModule,
    FormsModule,
    InputFieldComponent,
    ButtonComponent,
    CheckboxComponent,
  ],
  templateUrl: './verification-form.component.html',
  styles: ''
})
export class VerificationFormComponent implements OnInit {

  isCheckedOne = false;

  // Email to verify
  email = '';

  // 6 separate digits (bound from the template)
  d1 = '';
  d2 = '';
  d3 = '';
  d4 = '';
  d5 = '';
  d6 = '';

  get code(): string {
    const digits = [this.d1, this.d2, this.d3, this.d4, this.d5, this.d6].map(d => (d ?? '').toString());
    return digits.join('');
  }

  isLoading = false;
  errorMessage = '';
  successMessage = '';
  digitError = false;
  isSigningInAfterVerification = false;

  constructor(
    private authService: AuthService,
    private permissionService: PermissionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    try {
      this.email = localStorage.getItem('verification_email') || '';
    } catch {
      this.email = '';
    }
  }

  onPaste(event: ClipboardEvent) {
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

  isEmailValid(email: string): boolean {
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    return emailRegex.test(email);
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

  onVerify() {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.digitError = false;

    const otp = (this.code ?? '').replace(/\s+/g, '').trim();
    const email = this.email?.trim() ?? '';

    if (!email) {
      this.isLoading = false;
      this.errorMessage = 'Email is missing. Please go back and try again.';
      return;
    }

    if (!this.isEmailValid(email)) {
      this.isLoading = false;
      this.errorMessage = 'Please enter a valid email address.';
      return;
    }

    if (!otp) {
      this.isLoading = false;
      this.digitError = true;
      this.errorMessage = 'Enter the 6-digit verification code.';
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      this.isLoading = false;
      this.digitError = true;
      this.errorMessage = 'Invalid code. Please enter exactly 6 digits.';
      return;
    }

    this.authService.verifySignupOtp({ email, code: otp }).subscribe({
      next: (res) => {
        this.isSigningInAfterVerification = true;
        this.successMessage = res?.message || 'Email verified successfully.';

        const tempPassword = sessionStorage.getItem('verification_password');
        if (!tempPassword) {
          this.isSigningInAfterVerification = false;
          this.isLoading = false;
          const orgId = localStorage.getItem('org_id');
          setTimeout(() => {
            if (orgId) {
              this.router.navigate(['/subscription-plan']);
            } else {
              this.router.navigate(['/signin']);
            }
          }, 600);
          return;
        }

        this.authService.login({ email, password: tempPassword }).subscribe({
          next: (loginRes: any) => {
            const accessToken = loginRes?.tokens?.access_token ?? loginRes?.access_token;
            const refreshToken = loginRes?.tokens?.refresh_token ?? loginRes?.refresh_token;

            if (!accessToken) {
              this.isSigningInAfterVerification = false;
              this.isLoading = false;
              this.errorMessage = 'Verification succeeded but automatic sign-in failed. Please sign in manually.';
              this.router.navigate(['/signin']);
              return;
            }

            const exp = this.decodeExp(accessToken);
            const expiresAt = String(exp ?? Date.now() + 24 * 60 * 60 * 1000);

            localStorage.setItem('access_token_saas', accessToken);
            localStorage.setItem('refresh_token', refreshToken ?? '');

            localStorage.removeItem('remember_device');
            localStorage.removeItem('session_expires_at');
            sessionStorage.setItem('access_token_saas', accessToken);
            sessionStorage.setItem('refresh_token', refreshToken ?? '');
            sessionStorage.setItem('session_expires_at', expiresAt);

            const orgs = loginRes?.tokens?.organizations ?? loginRes?.organizations ?? [];
            if (orgs?.length > 0) {
              localStorage.setItem('org_id', orgs[0].id);
              localStorage.setItem('organizationId', orgs[0].id);
            }

            this.permissionService.setServiceAccess((loginRes?.serviceAccess as ServiceAccessGrant[]) ?? loginRes?.tokens?.serviceAccess);

            const orgRole = orgs?.length > 0 ? orgs[0].role : undefined;
            this.permissionService.setOrgRole(orgRole);

            sessionStorage.removeItem('verification_password');

            this.isSigningInAfterVerification = false;
            this.isLoading = false;
            this.router.navigate(['/']);
          },
          error: (loginErr) => {
            console.error('Auto-login after verification error:', loginErr);
            sessionStorage.removeItem('verification_password');
            this.isSigningInAfterVerification = false;
            this.isLoading = false;
            const orgId = localStorage.getItem('org_id');
            setTimeout(() => {
              if (orgId) {
                this.router.navigate(['/subscription-plan']);
              } else {
                this.router.navigate(['/signin']);
              }
            }, 600);
          }
        });
      },
      error: (err) => {
        this.isLoading = false;
        const detail = err?.error?.detail;
        this.errorMessage = detail ? `Verification failed: ${detail}` : 'Verification failed. Please try again.';
      },
    });
  }

  onResendCode() {
    const email = this.email?.trim() ?? '';
    if (!email) {
      this.errorMessage = 'Email is missing. Please go back and try again.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.authService.resendSignupOtp({ email }).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Verification code resent. Please check your inbox.';
      },
      error: (err) => {
        this.isLoading = false;
        const detail = err?.error?.detail;
        this.errorMessage = detail ? `Resend failed: ${detail}` : 'Failed to resend code. Please try again.';
      },
    });
  }
}

