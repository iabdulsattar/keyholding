import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { LabelComponent } from '../../form/label/label.component';
import { ButtonComponent } from '../../ui/button/button.component';

@Component({
  selector: 'app-confirmpassword-form',
  imports: [
    RouterModule,
    FormsModule,
    InputFieldComponent,
    LabelComponent,
    ButtonComponent
    
  ],
  templateUrl: './confirmpassword-form.component.html',
  styles: ''
  
})
export class ConfirmpasswordFormComponent {

  showPassword = false;
  confirmPassword = false;

  npassword = '';
  cpassword = '';

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  togglePasswordVisibilityOne() {
    this.confirmPassword = !this.confirmPassword;
  }
  
  onSignIn() {
  }
}

