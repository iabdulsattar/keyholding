import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SubscriptionLayoutComponent } from '../../../layout/subscription-layout/subscription-layout.component';

@Component({
  selector: 'app-subscription-trial-ready',
  imports: [
    CommonModule,
    RouterModule,
    SubscriptionLayoutComponent,
  ],
  templateUrl: './subscription-trial-ready.component.html',
  styles: ''
})
export class SubscriptionTrialReadyComponent {
  orgName = 'Sentinel Technologies Ltd.';
}
