import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ToastComponent } from '../../shared/components/ui/toast/toast.component';

@Component({
  selector: 'app-auth-page-layout',
  imports: [
    RouterModule,
    ToastComponent,
  ],
  templateUrl: './auth-page-layout.component.html',
  styles: ``
})
export class AuthPageLayoutComponent {

}
