import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { SidebarService } from '../../shared/services/sidebar.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeToggleButtonComponent } from '../../shared/components/common/theme-toggle/theme-toggle-button.component';
import { NotificationDropdownComponent } from '../../shared/components/header/notification-dropdown/notification-dropdown.component';
import { UserDropdownComponent } from '../../shared/components/header/user-dropdown/user-dropdown.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  imports: [
    CommonModule,
    RouterModule,
    ThemeToggleButtonComponent,
    NotificationDropdownComponent,
    UserDropdownComponent,
  ],
  templateUrl: './app-header.component.html',
})
export class AppHeaderComponent {
  isApplicationMenuOpen = false;
  readonly isMobileOpen$;
  orgName = '';

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  private authService = inject(AuthService);

  constructor(public sidebarService: SidebarService) {
    this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
    this.orgName = this.authService.getOrgName() || '';
  }

  handleToggle() {
    if (window.innerWidth >= 1280) {
      this.sidebarService.toggleExpanded();
    } else {
      this.sidebarService.toggleMobileOpen();
    }
  }

  toggleApplicationMenu() {
    this.isApplicationMenuOpen = !this.isApplicationMenuOpen;
  }

  ngAfterViewInit() {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  ngOnDestroy() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown = (event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      this.searchInput?.nativeElement.focus();
    }
  };
}
