import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { InputFieldComponent } from '../../../shared/components/form/input/input-field.component';
import { LabelComponent } from '../../../shared/components/form/label/label.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { AuthPageLayoutComponent } from '../../../layout/auth-page-layout/auth-page-layout.component';

@Component({
  selector: 'app-new-password',
  imports: [
    RouterModule,
    FormsModule,
    InputFieldComponent,
    LabelComponent,
    ButtonComponent,
    AuthPageLayoutComponent,
  ],
  templateUrl: './new-password.component.html',
  styles: ''
})
export class NewPasswordComponent {
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  token = '';
  newPassword = '';
  confirmPassword = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    this.token =
      this.route.snapshot.queryParamMap.get('token') ||
      this.route.snapshot.queryParamMap.get('resetToken') ||
      this.route.snapshot.queryParamMap.get('reset_token') ||
      this.route.snapshot.queryParamMap.get('reset-password-token') ||
      '';
  }

  onSubmit() {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const newPassword = this.newPassword?.trim();
    const confirmPassword = this.confirmPassword?.trim();

    if (!this.token) {
      this.isLoading = false;
      this.errorMessage = 'Reset token is missing from the URL. Please use the link from your email.';
      return;
    }

    if (!newPassword) {
      this.isLoading = false;
      this.errorMessage = 'Please enter a new password.';
      return;
    }

    if (newPassword.length < 6) {
      this.isLoading = false;
      this.errorMessage = 'Password must be at least 6 characters.';
      return;
    }

    if (newPassword !== confirmPassword) {
      this.isLoading = false;
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.authService.resetPassword({ token: this.token, newPassword }).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Password updated successfully. Redirecting to login...';
        setTimeout(() => {
          this.router.navigate(['/signin']);
        }, 1500);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.detail || 'Failed to update password. Please try again.';
      }
    });
  }
}
