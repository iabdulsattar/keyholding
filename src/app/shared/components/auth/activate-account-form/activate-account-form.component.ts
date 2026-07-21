import { Component, OnInit } from '@angular/core';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { LabelComponent } from '../../form/label/label.component';
import { CheckboxComponent } from '../../form/input/checkbox.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-activate-account-form',
  standalone: true,
  imports: [
    RouterModule,
    FormsModule,
    InputFieldComponent,
    LabelComponent,
    CheckboxComponent,
    ButtonComponent
  ],
  templateUrl: './activate-account-form.component.html',
  styles: ''
})
export class ActivateAccountFormComponent implements OnInit {
  showPassword = false;
  showConfirmPassword = false;
  isChecked = false;

  fullName = '';
  email = '';
  password = '';
  confirmPassword = '';

  token: string | null = null;
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');
    this.email = this.route.snapshot.queryParamMap.get('email') || '';
    this.fullName = this.route.snapshot.queryParamMap.get('name') || '';
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  private validateForm(): boolean {
    if (!this.fullName.trim()) {
      this.errorMessage = 'Please enter your full name.';
      return false;
    }
    if (!this.email.trim()) {
      this.errorMessage = 'Email is required.';
      return false;
    }
    if (!this.password) {
      this.errorMessage = 'Please create a password.';
      return false;
    }
    if (this.password.length < 12) {
      this.errorMessage = 'Password must be at least 12 characters.';
      return false;
    }
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return false;
    }
    if (!this.isChecked) {
      this.errorMessage = 'Please accept the Privacy Policy and Terms of Service.';
      return false;
    }
    if (!this.token) {
      this.errorMessage = 'Invalid or expired activation link.';
      return false;
    }
    return true;
  }

  getPasswordStrength(): { len: boolean; upper: boolean; lower: boolean; num: boolean; special: boolean } {
    const v = this.password;
    return {
      len: v.length >= 12,
      upper: /[A-Z]/.test(v),
      lower: /[a-z]/.test(v),
      num: /[0-9]/.test(v),
      special: /[^A-Za-z0-9]/.test(v),
    };
  }

  onActivate() {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.validateForm()) {
      this.isLoading = false;
      return;
    }

    const nameParts = this.fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    this.authService.acceptInvitation(this.token!, {
      password: this.password,
      firstName,
      lastName
    }).subscribe({
      next: () => {
        this.successMessage = 'Account activated successfully! Redirecting to sign in...';
        setTimeout(() => this.router.navigate(['/signin']), 2000);
      },
      error: (err) => {
        console.error('Activation error:', err);
        this.errorMessage = err.error?.detail || err.error?.message || 'Activation failed. Please try again or contact support.';
        this.isLoading = false;
      }
    });
  }
}
