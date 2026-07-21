import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InputFieldComponent } from '../../../shared/components/form/input/input-field.component';
import { LabelComponent } from '../../../shared/components/form/label/label.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { AuthPageLayoutComponent } from '../../../layout/auth-page-layout/auth-page-layout.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  imports: [
    RouterModule,
    FormsModule,
    InputFieldComponent,
    LabelComponent,
    ButtonComponent,
    AuthPageLayoutComponent
  ],
  templateUrl: './forgot-password.component.html',
  styles: ''
})
export class ForgotPasswordComponent {
  email = '';

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private authService: AuthService, public router: Router) {}

  goToSignIn() {
    this.router.navigate(['/signin']);
  }

  onReset() {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.requestPasswordReset({ email: this.email }).subscribe({
      next: () => {
        this.successMessage = 'If the account exists, a reset link has been sent.';
        this.isLoading = false;
        this.router.navigate(['/forgot-passwordcheck']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.detail || 'Failed to send reset link. Please try again.';
      }
    });
  }
}
