import { Component } from '@angular/core';
import { AuthPageLayoutComponent } from '../../../layout/auth-page-layout/auth-page-layout.component';
import { ForgotpasswordcheckFormComponent } from '../../../shared/components/auth/forgotpasswordcheck-form/forgotpasswordcheck-form.component';

@Component({
  selector: 'app-forgot-passwordcheck',
  imports: [
    AuthPageLayoutComponent,
    ForgotpasswordcheckFormComponent
  ],
  templateUrl: './forgot-passwordcheck.component.html',
  styles: ''
})
export class ForgotPasswordcheckComponent {

}
