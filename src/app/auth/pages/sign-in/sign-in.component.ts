import { Component, OnInit, inject } from '@angular/core';
import { SigninFormComponent } from '../../../shared/components/auth/signin-form/signin-form.component';
import { AuthPageLayoutComponent } from '../../../layout/auth-page-layout/auth-page-layout.component';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sign-in',
  imports: [
    SigninFormComponent,
    AuthPageLayoutComponent,
  ],
  templateUrl: './sign-in.component.html',
  styles: ``
})
export class SignInComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    if (this.authService.isRemembered() && this.authService.getAccessToken()) {
      this.router.navigate(['/dashboard']);
    }
  }
}
