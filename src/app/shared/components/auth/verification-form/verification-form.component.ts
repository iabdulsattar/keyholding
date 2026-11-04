import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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

  get code(): string {
    const digits: string[] = [];

    for (let i = 0; i < 6; i++) {
      const input = document.getElementById(`otp-${i}`) as HTMLInputElement;
      digits.push(input?.value ?? '');
    }

    return digits.join('');
  }

  onInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input) return;

    // Allow only numeric digits
    const digit = input.value.replace(/\D/g, '').slice(-1);

    input.value = digit;

    // Move to next input automatically
    if (digit && index < 5) {
      this.focusInput(index + 1, true);
    }
  }

  private focusInput(index: number, select = false): void {
    const input = document.getElementById(`otp-${index}`) as HTMLInputElement | null;
    input?.focus();

    if (select) {
      input?.select();
    }
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;

    // Backspace handling
    if (event.key === 'Backspace') {
      if (index > 0) {
        event.preventDefault();
        input.value = '';
        this.focusInput(index - 1, true);
      }

      return;
    }

    // Delete handling
    if (event.key === 'Delete') {
      event.preventDefault();
      input.value = '';
      return;
    }

    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    // Allow navigation keys
    if (
      event.key === 'Tab' ||
      event.key === 'ArrowLeft' ||
      event.key === 'ArrowRight' ||
      event.key === 'Home' ||
      event.key === 'End' ||
      event.key === 'Backspace' ||
      event.key === 'Delete'
    ) {
      return;
    }

    // Prevent non-numeric characters
    if (!/^\d$/.test(event.key) && event.key.length === 1) {
      event.preventDefault();
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();

    const pasted = event.clipboardData
      ?.getData('text')
      .replace(/\D/g, '')
      .slice(0, 6);

    if (!pasted) return;

    pasted.split('').forEach((digit, index) => {
      const input = document.getElementById(`otp-${index}`) as HTMLInputElement;

      if (input) {
        input.value = digit;
      }
    });

    // Focus the next empty input or the last input
    const nextIndex = Math.min(pasted.length, 5);
    this.focusInput(nextIndex);
  }

  isEmailValid(email: string): boolean {
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    return emailRegex.test(email);
  }

  onVerify() {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.digitError = false;

    const otp = this.code;
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

    this.authService.verifySignupOtp({ email, code: otp, serviceCode: 'key-vault' }).subscribe({
      next: (res) => {
        this.isSigningInAfterVerification = true;
        this.successMessage = res?.message || 'Email verified successfully.';

        const tempPassword = sessionStorage.getItem('verification_password');
        if (!tempPassword) {
          this.isSigningInAfterVerification = false;
          this.isLoading = false;
          setTimeout(() => {
            this.router.navigate(['/signin']);
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

            const remember = this.isCheckedOne;
            const expiresAt = String(this.authService.computeSessionExpiry(
              accessToken,
              loginRes?.tokens?.refresh_expires_in ?? loginRes?.refresh_expires_in,
              loginRes?.tokens?.expires_in ?? loginRes?.expires_in,
              remember,
            ));

            this.authService.storeSession(accessToken, refreshToken ?? null, expiresAt, remember);

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
            setTimeout(() => {
              this.router.navigate(['/signin']);
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
    this.authService.resendSignupOtp({ email, serviceCode: 'key-vault' }).subscribe({
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
