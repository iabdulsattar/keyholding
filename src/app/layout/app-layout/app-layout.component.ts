import { Component, inject } from '@angular/core';
import { SidebarService } from '../../shared/services/sidebar.service';
import { CommonModule } from '@angular/common';
import { AppSidebarComponent } from '../app-sidebar/app-sidebar.component';
import { BackdropComponent } from '../backdrop/backdrop.component';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ToastComponent } from '../../shared/components/ui/toast/toast.component';
import { Observable } from 'rxjs';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { SubscriptionService } from '../../core/services/subscription.service';

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
  trialExpired = false;

  constructor(
    public sidebarService: SidebarService,
    private router: Router,
    private route: ActivatedRoute,
    private subscriptionService: SubscriptionService,
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

    this.checkTrialStatus();
  }

  private checkTrialStatus(): void {
    const orgId = localStorage.getItem('org_id') || localStorage.getItem('organizationId');
    if (!orgId) return;

    this.subscriptionService.getSubscription(orgId, 'key-vault').subscribe({
      next: (res: any) => {
        const payload = res?.data ?? res ?? {};
        const sub = payload.subscription ?? payload ?? {};
        const status = sub?.status?.toUpperCase();
        const isTrial = status === 'TRIAL' || status === 'TRIALING';
        const trialEnd = sub?.trialEnd || sub?.currentPeriodEnd;
        const isExpired = isTrial && trialEnd && new Date(trialEnd) < new Date();
        
        this.trialExpired = isExpired;
      },
      error: () => {
        this.trialExpired = false;
      }
    });
  }

  toggleSidebar(): void {
    if (window.innerWidth >= 1024) {
      this.sidebarService.toggleExpanded();
    } else {
      this.sidebarService.toggleMobileOpen();
    }
  }
}
