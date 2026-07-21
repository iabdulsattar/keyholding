import { Component } from '@angular/core';
import { ActivateAccountFormComponent } from '../../../shared/components/auth/activate-account-form/activate-account-form.component';
import { AuthPageLayoutComponent } from '../../../layout/auth-page-layout/auth-page-layout.component';

@Component({
  selector: 'app-activate-account',
  standalone: true,
  imports: [
    ActivateAccountFormComponent,
    AuthPageLayoutComponent,
  ],
  templateUrl: './activate-account.component.html',
  styles: ``
})
export class ActivateAccountComponent {

}
