import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { AuthPageLayoutComponent } from '../../../layout/auth-page-layout/auth-page-layout.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-verification',
  imports: [
    RouterModule,
    FormsModule,
    AuthPageLayoutComponent,
  ],
  templateUrl: './verification.component.html',
  styles: ''
})
export class VerificationComponent implements OnInit {

  isCheckedOne = false;

  email = '';

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
  digitError = false;

  resendDisabled = true;
  resendSeconds = 45;

  constructor(private authService: AuthService, private router: Router, private toast: ToastService) {}

  get resendTimerDisplay(): string {
    const m = String(Math.floor(this.resendSeconds / 60)).padStart(2, '0');
    const s = String(this.resendSeconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  ngOnInit(): void {
    try {
      this.email = localStorage.getItem('verification_email') || '';
    } catch {
      this.email = '';
    }
    this.startResendTimer();
  }

  startResendTimer() {
    this.resendDisabled = true;
    this.resendSeconds = 45;
    const interval = setInterval(() => {
      this.resendSeconds--;
      if (this.resendSeconds <= 0) {
        clearInterval(interval);
        this.resendDisabled = false;
      }
    }, 1000);
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
    this.focusInput(5);
  }

  onInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const digit = input.value.replace(/\D/g, '').slice(-1);

    if (input.value !== digit) {
      input.value = digit;
      this.setDigit(index, digit);
    }

    if (digit && index < 5) {
      this.focusInput(index + 1, true);
    }
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;

    if (event.key === 'Backspace') {
      if (index > 0) {
        event.preventDefault();
        input.value = '';
        this.setDigit(index, '');
        this.focusInput(index - 1, true);
      }

      return;
    }

    if (event.key === 'Delete') {
      event.preventDefault();
      input.value = '';
      this.setDigit(index, '');
      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      this.focusInput(index - 1);
      return;
    }

    if (event.key === 'ArrowRight' && index < 5) {
      event.preventDefault();
      this.focusInput(index + 1);
      return;
    }

    if (event.ctrlKey || event.metaKey || event.altKey) return;

    if (
      event.key === 'Tab' ||
      event.key === 'Home' ||
      event.key === 'End' ||
      event.key.length !== 1
    ) {
      return;
    }

    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  private setDigit(index: number, digit: string): void {
    switch (index) {
      case 0: this.d1 = digit; break;
      case 1: this.d2 = digit; break;
      case 2: this.d3 = digit; break;
      case 3: this.d4 = digit; break;
      case 4: this.d5 = digit; break;
      case 5: this.d6 = digit; break;
    }
  }

  private focusInput(index: number, select = false): void {
    const input = document.getElementById(`otp-${index}`) as HTMLInputElement | null;
    input?.focus();

    if (select) {
      input?.select();
    }
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
    this.digitError = false;

    const otp = (this.code ?? '').replace(/\s+/g, '').trim();
    const email = this.email?.trim() ?? '';

    if (!email) {
      this.isLoading = false;
      this.toast.error('Email is missing. Please go back and try again.');
      return;
    }

    if (!this.isEmailValid(email)) {
      this.isLoading = false;
      this.toast.error('Please enter a valid email address.');
      return;
    }

    if (!otp) {
      this.isLoading = false;
      this.digitError = true;
      this.toast.error('Enter the 6-digit verification code.');
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      this.isLoading = false;
      this.digitError = true;
      this.toast.error('Invalid code. Please enter exactly 6 digits.');
      return;
    }

     this.authService.verifySignupOtp({ email, code: otp, serviceCode: 'key-vault' }).subscribe({
      next: (res: any) => {
        this.toast.success(res?.message || 'Email verified successfully. Please sign in.');
        this.isLoading = false;
        this.router.navigate(['/signin']);
      },
      error: (err: any) => {
        this.isLoading = false;
        const detail = err?.error?.detail;
        this.toast.error(detail ? `Verification failed: ${detail}` : 'Verification failed. Please try again.');
      },
    });
  }

  onResendCode() {
    if (this.resendDisabled) return;

    const email = this.email?.trim() ?? '';
    if (!email) {
      this.toast.error('Email is missing. Please go back and try again.');
      return;
    }

    this.isLoading = true;
    this.authService.resendSignupOtp({ email, serviceCode: 'key-vault' }).subscribe({
      next: () => {
        this.isLoading = false;
        this.toast.success('Verification code resent. Please check your inbox.');
        this.startResendTimer();
      },
      error: (err: any) => {
        this.isLoading = false;
        const detail = err?.error?.detail;
        this.toast.error(detail ? `Resend failed: ${detail}` : 'Failed to resend code. Please try again.');
      },
    });
  }

  goToSignIn() {
    this.router.navigate(['/signin']);
  }
}
