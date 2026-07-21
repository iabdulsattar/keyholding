import { Component } from '@angular/core';
import { ButtonComponent } from '../../ui/button/button.component';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-forgotpasswordcheck-form',
  imports: [
    ButtonComponent,
    RouterModule,
    FormsModule
  ],
  templateUrl: './forgotpasswordcheck-form.component.html',
  styles: ''
})
export class ForgotpasswordcheckFormComponent {
  constructor(private authService: AuthService) {}
}


