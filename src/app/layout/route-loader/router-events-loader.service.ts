import { Injectable, NgZone } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RouterEventsLoaderService {
  private readonly _active$ = new BehaviorSubject<boolean>(false);
  readonly active$ = this._active$.asObservable();

  private navigationStartTime = 0;
  private readonly minLoaderMs = 800;
  private readonly postNavigationDelay = 400;
  private hideTimeout: any = null;

  constructor(
    private router: Router,
    private zone: NgZone
  ) {
    this.router.events.subscribe((event) => {
      this.zone.run(() => {
        if (event instanceof NavigationStart) {
          this.navigationStartTime = Date.now();
          if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
          }
          this._active$.next(true);
          return;
        }

        if (
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError
        ) {
          const elapsed = Date.now() - this.navigationStartTime;
          const remaining = Math.max(0, this.minLoaderMs - elapsed);
          const totalDelay = remaining + this.postNavigationDelay;
          this.hideTimeout = setTimeout(() => {
            this.zone.run(() => {
              this._active$.next(false);
              this.hideTimeout = null;
            });
          }, totalDelay);
        }
      });
    });
  }
}

