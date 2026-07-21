import { Component } from '@angular/core';
import { ConfirmpasswordFormComponent } from '../../../shared/components/auth/confirmpassword-form/confirmpassword-form.component';
import { AuthPageLayoutComponent } from '../../../layout/auth-page-layout/auth-page-layout.component';

@Component({
  selector: 'app-confirm-password',
  imports: [
    ConfirmpasswordFormComponent,
    AuthPageLayoutComponent  
  ],
  templateUrl: './confirm-password.component.html',
  styles: ''

})
export class ConfirmPasswordComponent {

}
