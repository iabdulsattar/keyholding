import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ToastComponent } from '../../shared/components/ui/toast/toast.component';

@Component({
  selector: 'app-subscription-layout',
  imports: [
    RouterModule,
    ToastComponent,
  ],
  templateUrl: './subscription-layout.component.html',
  styles: ``
})
export class SubscriptionLayoutComponent {

}
