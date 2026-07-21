import { Component } from '@angular/core';

@Component({
  selector: 'app-card-title',
  standalone: true,
  template: `<div class="text-lg font-semibold text-gray-900 dark:text-white"><ng-content></ng-content></div>`,
  styles: ``
})
export class CardTitleComponent {}
