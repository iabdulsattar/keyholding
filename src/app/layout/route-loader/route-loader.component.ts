import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-route-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="fixed inset-0 z-[1000] flex items-center justify-center bg-white/80 backdrop-blur-sm transition-opacity duration-300"
      [class.opacity-0]="!active"
      [class.pointer-events-none]="!active"
      [class.opacity-100]="active"
      [class.pointer-events-auto]="active"
    >
      <div class="flex flex-col items-center gap-4">
        <div class="relative w-12 h-12">
          <div class="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
          <div class="absolute inset-0 border-4 border-brand-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p class="text-sm font-semibold text-slate-700">Loading...</p>
      </div>
    </div>
  `,
  styles: []
})
export class RouteLoaderComponent {
  @Input({ required: true }) active = false;
}

