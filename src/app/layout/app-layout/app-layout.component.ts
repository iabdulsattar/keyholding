import { Component, inject } from '@angular/core';
import { SidebarService } from '../../shared/services/sidebar.service';
import { CommonModule } from '@angular/common';
import { AppSidebarComponent } from '../app-sidebar/app-sidebar.component';
import { BackdropComponent } from '../backdrop/backdrop.component';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ToastComponent } from '../../shared/components/ui/toast/toast.component';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { SubscriptionStatusService } from '../../core/services/subscription-status.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, AppSidebarComponent, BackdropComponent, ToastComponent],
  templateUrl: './app-layout.component.html',
  host: {
    class: 'h-full ',
  },
})

export class AppLayoutComponent {
  readonly isExpanded$: Observable<boolean>;
  readonly isHovered$: Observable<boolean>;
  readonly isMobileOpen$: Observable<boolean>;
  containerClasses$: Observable<string>;
  isSidebarOpen$: Observable<boolean>;
  hideSidebarAndHeader = false;

  constructor(
    public sidebarService: SidebarService,
    private router: Router,
    private route: ActivatedRoute,
    private subStatus: SubscriptionStatusService,
  ) {
    this.isExpanded$ = this.sidebarService.isExpanded$;
    this.isHovered$ = this.sidebarService.isHovered$;
    this.isMobileOpen$ = this.sidebarService.isMobileOpen$;

    this.containerClasses$ = combineLatest([
      this.isExpanded$,
      this.isHovered$,
      this.isMobileOpen$
    ]).pipe(
      map(() => 'flex-1 transition-all duration-300 ease-in-out')
    );

    this.isSidebarOpen$ = combineLatest([
      this.isExpanded$,
      this.isMobileOpen$
    ]).pipe(
      map(([expanded, mobileOpen]) => expanded || mobileOpen)
    );

    if (this.subStatus.getOrgId()) {
      this.subStatus.checkNow();
    }
  }

  get isTrialBannerVisible(): boolean {
    return this.subStatus.status() === 'trial';
  }

  get trialDaysRemaining(): number {
    return this.subStatus.daysRemaining();
  }

  toggleSidebar(): void {
    if (window.innerWidth >= 1024) {
      this.sidebarService.toggleExpanded();
    } else {
      this.sidebarService.toggleMobileOpen();
    }
  }
}

