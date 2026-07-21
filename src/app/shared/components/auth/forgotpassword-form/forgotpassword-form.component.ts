import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { LabelComponent } from '../../form/label/label.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-forgotpassword-form',
  imports: [
    RouterModule,
    FormsModule,
    InputFieldComponent,
    LabelComponent,
    ButtonComponent
  ],
  templateUrl: './forgotpassword-form.component.html',
  styles: ''
})
export class ForgotpasswordFormComponent {
  email = '';

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  onReset() {
    // Postman: POST /api/v1/auth/password/request-reset { email }
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.requestPasswordReset({ email: this.email }).subscribe({
      next: () => {
        // Collection step: go to forgot-passwordcheck
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


