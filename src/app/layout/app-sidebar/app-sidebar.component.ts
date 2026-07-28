import { CommonModule } from '@angular/common';
import { Component, ElementRef, QueryList, ViewChildren, ChangeDetectorRef, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SidebarService } from '../../shared/services/sidebar.service';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { PermissionService } from '../../core/services/permission.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { combineLatest, Subscription } from 'rxjs';

type NavItem = {
  name: string;
  icon: string;
  path?: string;
  new?: boolean;
  permissions?: string[];
  subItems?: { name: string; path: string; queryParams?: Record<string, any>; pro?: boolean; new?: boolean }[];
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
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-6h6v6"/></svg>`,
      name: "Dashboard",
      path: "/dashboard",
    },
    {
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
      name: "Clients",
      path: "/clients",
    },
    {
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.3"/></svg>`,
      name: "Sites",
      path: "/sites/all-sites",
    },
    {
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="15" r="4"/><path d="M10.5 12.5 20 3"/><path d="M17 6l2 2"/><path d="M14 9l2 2"/></svg>`,
      name: "Keys",
      path: "/keys/all-keys",
    },
    {
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M9 3.5v3h6v-3"/><path d="M9 12h6M9 15.5h6"/></svg>`,
      name: "Jobs",
      path: "/jobs",
    },
    {
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M5.5 21v-2a4 4 0 0 1 4-4h1"/><circle cx="10" cy="7" r="3.5"/><path d="M15.5 21v-1.5a3.5 3.5 0 0 0-2-3.16"/><path d="M14 4.2a3.5 3.5 0 0 1 0 6.6"/></svg>`,
      name: "Officers",
      path: "/officers",
    },
    {
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
      name: "Settings",
      path: "/settings",
    },
    {
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
      name: "Users",
      path: "/user-management",
    },
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
  ) {
    this.isExpanded$ = this.sidebarService.isExpanded$;
    this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
    this.isHovered$ = this.sidebarService.isHovered$;
  }

  ngOnInit() {
    this.loadUser();
    this.companyName = this.authService.getOrgName() || '';

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

  isDashboardActive(): boolean {
    const currentPath = this.router.url.split('?')[0];
    return currentPath === '/dashboard' || currentPath === '';
  }

  isNavVisible(item: NavItem): boolean {
    if (!item.permissions || item.permissions.length === 0) return true;
    return this.permissions.hasAnyPermission(item.permissions);
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
    const refreshToken = localStorage.getItem('refresh_token_saas') || sessionStorage.getItem('refresh_token_saas');
    const token = this.authService.getAccessToken();

    const finish = () => {
      this.authService.clearTokens();
      window.location.href = '/signin';
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
