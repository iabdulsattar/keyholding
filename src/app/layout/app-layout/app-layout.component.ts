import { Component } from '@angular/core';
import { SidebarService } from '../../shared/services/sidebar.service';
import { CommonModule } from '@angular/common';
import { AppSidebarComponent } from '../app-sidebar/app-sidebar.component';
import { BackdropComponent } from '../backdrop/backdrop.component';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ToastComponent } from '../../shared/components/ui/toast/toast.component';

@Component({
  selector: 'app-layout',
  imports: [
    CommonModule,
    RouterModule,
    AppSidebarComponent,
    BackdropComponent,
    ToastComponent
  ],
  templateUrl: './app-layout.component.html',
})

export class AppLayoutComponent {
  readonly isExpanded$;
  readonly isHovered$;
  readonly isMobileOpen$;
  hideSidebarAndHeader = false;

  constructor(public sidebarService: SidebarService, private router: Router, private route: ActivatedRoute) {
    this.isExpanded$ = this.sidebarService.isExpanded$;
    this.isHovered$ = this.sidebarService.isHovered$;
    this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
  }

  get containerClasses() {
    return [
      'flex-1',
      'transition-all',
      'duration-300',
      'ease-in-out',
      (this.isExpanded$ || this.isHovered$) ? 'xl:ml-[220px]' : 'xl:ml-[90px]',
      this.isMobileOpen$ ? 'ml-0' : ''
    ];
  }
}
