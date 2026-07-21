import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RouteLoaderComponent } from './route-loader.component';

@Component({
  selector: 'app-with-route-loader',
  standalone: true,
  imports: [RouterModule, RouteLoaderComponent],
  template: `
    <app-route-loader [active]="active" />
    <ng-content />
  `,
})
export class WithRouteLoaderComponent {
  @Input({ required: true }) active = false;
}

