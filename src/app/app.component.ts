import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AsyncPipe } from '@angular/common';

import { WithRouteLoaderComponent } from './layout/route-loader/with-route-loader.component';
import { RouterEventsLoaderService } from './layout/route-loader/router-events-loader.service';
import { IdleService } from './core/services/idle.service';
import { SubscriptionStatusService } from './core/services/subscription-status.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, WithRouteLoaderComponent, AsyncPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  readonly active$ = inject(RouterEventsLoaderService).active$;
  private readonly idleService = inject(IdleService);
  private readonly subStatus = inject(SubscriptionStatusService);

  constructor() {
    this.idleService.start();
    if (this.subStatus.getOrgId()) {
      this.subStatus.checkNow();
    }
  }
}

