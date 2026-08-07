import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class NavigationReferrerService {
  private previousUrl: string | null = null;

  constructor(private router: Router) {
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe({
      next: (event: NavigationEnd) => {
        this.previousUrl = event.urlAfterRedirects;
      }
    });
  }

  getPreviousUrl(): string | null {
    return this.previousUrl;
  }
}
