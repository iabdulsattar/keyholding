import { Component } from '@angular/core';

@Component({
  selector: 'app-card-description',
  standalone: true,
  template: `<p class="text-gray-500 dark:text-gray-400 mt-1"><ng-content></ng-content></p>`,
  styles: ``
})
export class CardDescriptionComponent {}
