import { Component } from '@angular/core';
import { SignupFormComponent } from '../../../shared/components/auth/signup-form/signup-form.component';
import { AuthPageLayoutComponent } from '../../../layout/auth-page-layout/auth-page-layout.component';

@Component({
  selector: 'app-sign-up',
  imports: [
    SignupFormComponent,
    AuthPageLayoutComponent,
  ],
  templateUrl: './sign-up.component.html',
  styles: ``
})
export class SignUpComponent {

}
