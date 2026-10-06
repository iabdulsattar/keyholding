import { CommonModule } from '@angular/common';
import { Component, ElementRef, QueryList, ViewChildren, ChangeDetectorRef, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SidebarService } from '../../shared/services/sidebar.service';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { PermissionService } from '../../core/services/permission.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { SubscriptionStatusService } from '../../core/services/subscription-status.service';
import { combineLatest, Subscription } from 'rxjs';

type NavSubItem = {
  name: string;
  path: string;
  queryParams?: Record<string, any>;
  pro?: boolean;
  new?: boolean;
  /** Hidden from members; only organisation administrators see the item. */
  adminOnly?: boolean;
  /** Hidden when the user holds none of these exact permissions. */
  permissions?: string[];
  /** Hidden when the user holds no permission matching one of these fragments. */
  moduleFragments?: string[];
};

type NavItem = {
  name: string;
  icon: string;
  path?: string;
  new?: boolean;
  permissions?: string[];
  /** Hidden from members; only organisation administrators see the item. */
  adminOnly?: boolean;
  /** Hidden when the user holds no permission matching one of these fragments. */
  moduleFragments?: string[];
  subItems?: NavSubItem[];
};

@Component({
  selector: 'app-sidebar',
  imports: [
    CommonModule,
    RouterModule,
  ],
  templateUrl: './app-sidebar.component.html',
})
export class AppSidebarComponent implements OnInit {
  navItems: NavItem[] = [
    {
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>`,
      name: "Dashboard",
      path: "/dashboard",
    },
    {
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
      name: "Clients",
      path: "/clients",
      moduleFragments: ["clients.", "client."],
    },
    {
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 10h.01M15 10h.01M9 14h.01M15 14h.01"/></svg>`,
      name: "Sites",
      path: "/sites/all-sites",
      moduleFragments: ["sites.", "site."],
    },
    {
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M15 7a2 2 0 012 2v0a2 2 0 01-2 2H9a2 2 0 01-2-2v0a2 2 0 012-2m6 0V5a2 2 0 00-2-2h-2a2 2 0 00-2 2v2m6 0H9m-4 4l1.5 9a2 2 0 002 1.8h7a2 2 0 002-1.8L19 11"/></svg>`,
      name: "Keys",
      path: "/keys/all-keys",
      moduleFragments: ["keys.", "key."],
    },
    {
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M9 3.5v3h6v-3"/><path d="M9 12h6M9 15.5h6"/></svg>`,
      name: "Jobs",
      path: "/jobs",
      moduleFragments: ["jobs.", "job."],
    },
    // {
    //   icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
    //   name: "Incidents",
    //   path: "/incidents",
    // },
    {
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.27 6.96 12 12.01l8.73-5.05"/><path d="M12 22.08V12"/></svg>`,
      name: "Storage Management",
      moduleFragments: ["storage.", "cabinet.", "cabinets.", "hook.", "hooks."],
      subItems: [
        { name: "Storage Locations", path: "/storage/locations" },
        { name: "Cabinets", path: "/storage/locations/cabinets" },
        { name: "Hook List", path: "/storage/locations/cabinets/view/1/hooks", queryParams: { all: 'true' } },
      ],
    },
   
    {
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M17 20h5v-2a4 4 0 0 0-3-3.87M9 20H4v-2a4 4 0 013-3.87m5-3.13a4 4 0 100-8 4 4 0 000 8zm6 3.13a4 4 0 00-3-3.87"/></svg>`,
      name: "Users",
      subItems: [
        { name: "Users", path: "/user-management", permissions: ['admin.users.manage'] },
        { name: "Roles", path: "/roles", permissions: ['admin.roles.manage'] },
        { name: "Permissions", path: "/permissions", permissions: ['admin.users.manage', 'admin.roles.manage'] },
      ],
    },
    {
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>`,
      name: "Subscription",
      // Billing and trials are organisation-administrator only, so members do
      // not see the group at all.
      adminOnly: true,
      subItems: [
        { name: "Manage subscription", path: "/subscription" },
        { name: "Invoices", path: "/invoice" },
      ],
    },
    // {
    //   icon: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    //   <path d="M7.25372 3.1026C7.29505 2.66786 7.49697 2.26414 7.82005 1.97031C8.14313 1.67649 8.56414 1.51367 9.00085 1.51367C9.43755 1.51367 9.85857 1.67649 10.1816 1.97031C10.5047 2.26414 10.7066 2.66786 10.748 3.1026C10.7728 3.38344 10.8649 3.65417 11.0166 3.89186C11.1682 4.12955 11.3749 4.32721 11.6191 4.46811C11.8633 4.60901 12.1378 4.689 12.4195 4.70132C12.7012 4.71363 12.9817 4.6579 13.2372 4.53885C13.6341 4.35869 14.0837 4.33262 14.4987 4.46572C14.9137 4.59882 15.2643 4.88156 15.4824 5.25893C15.7004 5.6363 15.7702 6.08128 15.6782 6.50728C15.5862 6.93328 15.339 7.30981 14.9847 7.5636C14.754 7.72549 14.5657 7.94056 14.4357 8.19062C14.3056 8.44068 14.2378 8.71838 14.2378 9.00023C14.2378 9.28207 14.3056 9.55977 14.4357 9.80983C14.5657 10.0599 14.754 10.275 14.9847 10.4369C15.339 10.6906 15.5862 11.0672 15.6782 11.4932C15.7702 11.9192 15.7004 12.3642 15.4824 12.7415C15.2643 13.1189 14.9137 13.4016 14.4987 13.5347C14.0837 13.6678 13.6341 13.6418 13.2372 13.4616C12.9817 13.3426 12.7012 13.2868 12.4195 13.2991C12.1378 13.3114 11.8633 13.3914 11.6191 13.5323C11.3749 13.6732 11.1682 13.8709 11.0166 14.1086C10.8649 14.3463 10.7728 14.617 10.748 14.8979C10.7066 15.3326 10.5047 15.7363 10.1816 16.0301C9.85857 16.324 9.43755 16.4868 9.00085 16.4868C8.56414 16.4868 8.14313 16.324 7.82005 16.0301C7.49697 15.7363 7.29505 15.3326 7.25372 14.8979C7.22893 14.6169 7.1368 14.3461 6.98512 14.1083C6.83345 13.8705 6.6267 13.6728 6.3824 13.5319C6.13809 13.391 5.86342 13.311 5.58166 13.2988C5.29989 13.2865 5.01932 13.3424 4.76372 13.4616C4.36689 13.6418 3.91722 13.6678 3.50222 13.5347C3.08723 13.4016 2.7366 13.1189 2.51859 12.7415C2.30057 12.3642 2.23076 11.9192 2.32274 11.4932C2.41473 11.0672 2.66192 10.6906 3.01622 10.4369C3.24694 10.275 3.43527 10.0599 3.56529 9.80983C3.69531 9.55977 3.76319 9.28207 3.76319 9.00023C3.76319 8.71838 3.69531 8.44068 3.56529 8.19062C3.43527 7.94056 3.24694 7.72549 3.01622 7.5636C2.66242 7.30969 2.41566 6.9333 2.3239 6.50759C2.23214 6.08188 2.30193 5.63726 2.51971 5.26014C2.73749 4.88302 3.08771 4.60034 3.50229 4.46703C3.91687 4.33373 4.36621 4.35933 4.76297 4.53885C5.01854 4.6579 5.29903 4.71363 5.5807 4.70132C5.86237 4.689 6.13692 4.60901 6.38113 4.46811C6.62533 4.32721 6.83199 4.12955 6.98362 3.89186C7.13525 3.65417 7.22738 3.38344 7.25222 3.1026M11.2502 9.00049C11.2502 10.2431 10.2429 11.2505 9.00024 11.2505C7.7576 11.2505 6.75024 10.2431 6.75024 9.00049C6.75024 7.75785 7.7576 6.75049 9.00024 6.75049C10.2429 6.75049 11.2502 7.75785 11.2502 9.00049Z" stroke="#94A3B8" stroke-width="2" stroke-linecap="round"/>
    //   </svg>`,
    //   name: "Settings",
    //   subItems: [
    //     { name: "Incident Escalation", path: "/settings/incident-escalation" },
    //   ],
    // },
   
  ];

  othersItems: NavItem[] = [];

  openSubmenu: string | null | number = null;
  subMenuHeights: { [key: string]: number } = {};
  @ViewChildren('subMenu') subMenuRefs!: QueryList<ElementRef>;

  userManagementOpen = false;

  userName = '';
  userEmail = '';
  userInitials = '';
  userRole = '';
  userAvatar = '';
  loading = true;
  isDropdownOpen = false;
  companyName = '';

  readonly isExpanded$;
  readonly isMobileOpen$;
  readonly isHovered$;

  private subscription: Subscription = new Subscription();

  constructor(
    public sidebarService: SidebarService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    public permissions: PermissionService,
    private authService: AuthService,
    private toastService: ToastService,
    private sanitizer: DomSanitizer,
    private subStatus: SubscriptionStatusService,
  ) {
    this.isExpanded$ = this.sidebarService.isExpanded$;
    this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
    this.isHovered$ = this.sidebarService.isHovered$;
  }

  ngOnInit() {
    this.loadUser();
    this.companyName = this.authService.getOrgName() || '';
    this.subStatus.checkNow();

    this.subscription.add(
      this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd) {
          this.setActiveMenuFromRoute(this.router.url);
        }
      })
    );

    this.subscription.add(
      combineLatest([this.isExpanded$, this.isMobileOpen$, this.isHovered$]).subscribe(
        ([isExpanded, isMobileOpen, isHovered]) => {
          if (!isExpanded && !isMobileOpen && !isHovered) {
            this.cdr.detectChanges();
          }
        }
      )
    );

    this.setActiveMenuFromRoute(this.router.url);
  }

   ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  isActive(path: string, queryParams?: Record<string, any>): boolean {
    const currentPath = this.router.url.split('?')[0];
    if (currentPath === '' && path === '/dashboard') return true;
    if (currentPath !== path) return false;

    const currentQueryString = this.router.url.split('?')[1] || '';
    const currentParams = new URLSearchParams(currentQueryString);

    if (!queryParams || Object.keys(queryParams).length === 0) {
      return currentQueryString === '';
    }

    return Object.entries(queryParams).every(([key, value]) => currentParams.get(key) === String(value));
  }

  isNavVisible(item: NavItem): boolean {
    // Subscription/trial entry points are administrator-only, so members never
    // see the group regardless of the org's subscription state.
    if (item.adminOnly && !this.permissions.isOrgAdmin()) {
      return false;
    }
    if (item.moduleFragments && !this.permissions.hasModuleAccess(...item.moduleFragments)) {
      return false;
    }
    // Drop a group when every one of its entries is hidden from this user.
    if (item.subItems?.length && !item.subItems.some(sub => this.isSubItemVisible(sub))) {
      return false;
    }
    if (this.subStatus.status() === 'expired') {
      return item.name === 'Subscription';
    }
    if (!item.permissions || item.permissions.length === 0) return true;
    return this.permissions.hasAnyPermission(item.permissions);
  }

  /** Administrator-only sub-items (e.g. Manage subscription) are hidden from members. */
  isSubItemVisible(subItem: NavSubItem): boolean {
    if (subItem.adminOnly && !this.permissions.isOrgAdmin()) {
      return false;
    }
    if (subItem.permissions?.length && !this.permissions.hasAnyPermission(subItem.permissions)) {
      return false;
    }
    if (subItem.moduleFragments && !this.permissions.hasModuleAccess(...subItem.moduleFragments)) {
      return false;
    }
    return true;
  }

  toggleSubmenu(section: string, index: number) {
    const key = `${section}-${index}`;

    if (this.openSubmenu === key) {
      this.openSubmenu = null;
      this.subMenuHeights[key] = 0;
    } else {
      this.openSubmenu = key;

      setTimeout(() => {
        const el = document.getElementById(key);
        if (el) {
          this.subMenuHeights[key] = el.scrollHeight;
          this.cdr.detectChanges();
        }
      });
    }
  }

  toggleUserManagement(): void {
    this.userManagementOpen = !this.userManagementOpen;
  }

  onSidebarMouseEnter() {
    this.isExpanded$.subscribe(expanded => {
      if (!expanded) {
        this.sidebarService.setHovered(true);
      }
    }).unsubscribe();
  }

  private setActiveMenuFromRoute(currentUrl: string) {
    const currentPath = currentUrl.split('?')[0].split('#')[0];
    const menuGroups = [
      { items: this.navItems, prefix: 'main' },
      { items: this.othersItems, prefix: 'others' },
    ];

    menuGroups.forEach(group => {
      group.items.forEach((nav, i) => {
        if (nav.subItems) {
          nav.subItems.forEach(subItem => {
            const subPath = (subItem.path || '').split('?')[0];
            if (currentPath === subPath) {
              const key = `${group.prefix}-${i}`;
              this.openSubmenu = key;

              setTimeout(() => {
                const el = document.getElementById(key);
                if (el) {
                  this.subMenuHeights[key] = el.scrollHeight;
                  this.cdr.detectChanges();
                }
              });
            }
          });
        }
      });
    });
  }

  onSubmenuClick() {
    this.isMobileOpen$.subscribe(isMobile => {
      if (isMobile) {
        this.sidebarService.setMobileOpen(false);
      }
    }).unsubscribe();
  }

  private loadUser(): void {
    const token = this.authService.getAccessToken();
    if (!token) {
      this.loading = false;
      return;
    }

    this.authService.me(token).subscribe({
      next: (profile: any) => {
        const user = profile?.user || profile?.data || profile;
        this.userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'User';
        this.userEmail = user.email || '';
        this.userInitials = this.getInitials(user);
        this.userRole = this.extractRole(profile);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  private getInitials(user: any): string {
    const first = (user.firstName || '').charAt(0);
    const last = (user.lastName || '').charAt(0);
    return (first + last).toUpperCase() || 'U';
  }

  private extractRole(profile: any): string {
    const orgs = profile?.organizations || [];
    if (orgs.length > 0 && orgs[0].role) {
      return orgs[0].role;
    }
    const org = profile?.organization;
    if (org?.role) {
      return org.role;
    }
    return '';
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown() {
    this.isDropdownOpen = false;
  }

   onSignOut(): void {
    const refreshToken = this.authService.getRefreshToken();
    const token = this.authService.getAccessToken();

    const finish = () => {
      this.authService.clearTokens();
      // Grants and the persisted org role must go too, otherwise the next user
      // on this browser inherits the previous user's admin-only permissions.
      this.permissions.clear();
      // Router navigation keeps the SPA alive: no full page reload on sign out.
      this.router.navigate(['/signin']);
    };

    if (token && refreshToken) {
      this.authService.logout({ refreshToken }, token).subscribe({
        next: () => finish(),
        error: () => finish(),
      });
    } else {
      finish();
    }
    this.closeDropdown();
  }

  sanitizeIcon(icon: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(icon);
  }
}
