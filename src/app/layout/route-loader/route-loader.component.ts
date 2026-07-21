import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-route-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="fixed inset-x-0 top-0 z-[1000] h-1"
      *ngIf="active"
    >
      <div class="h-full w-full bg-transparent">
        <div
          class="h-full w-full bg-brand-500 origin-left animate-route-loader"
        ></div>
      </div>
    </div>
  `,
  styles: [
    `
      @keyframes route-loader {
        0% { transform: scaleX(0); opacity: 0.6; }
        20% { transform: scaleX(0.5); }
        60% { transform: scaleX(0.9); opacity: 1; }
        100% { transform: scaleX(1); opacity: 0.9; }
      }

      .animate-route-loader {
        animation: route-loader 700ms ease-out infinite;
      }
    `
  ],
})
export class RouteLoaderComponent {
  @Input({ required: true }) active = false;
}

