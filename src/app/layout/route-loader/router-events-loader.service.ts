import { Injectable, NgZone } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RouterEventsLoaderService {
  private readonly _active$ = new BehaviorSubject<boolean>(false);
  readonly active$ = this._active$.asObservable();

  constructor(
    private router: Router,
    // NgZone helps ensure the BehaviorSubject updates trigger change detection
    private zone: NgZone
  ) {
    this.router.events.subscribe((event) => {
      this.zone.run(() => {
        if (event instanceof NavigationStart) {
          this._active$.next(true);
          return;
        }

        if (
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError
        ) {
          this._active$.next(false);
        }
      });
    });
  }
}

