
import { Component, OnInit } from '@angular/core';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { UserMetaCardComponent } from '../../../shared/components/user-profile/user-meta-card/user-meta-card.component';
import { UserInfoCardComponent } from '../../../shared/components/user-profile/user-info-card/user-info-card.component';
import { UserAddressCardComponent } from '../../../shared/components/user-profile/user-address-card/user-address-card.component';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { getUserAvatar } from '../../../shared/utils/avatar.utils';

@Component({
  selector: 'app-profile',
  imports: [
    PageBreadcrumbComponent,
    UserMetaCardComponent,
    UserInfoCardComponent,
    UserAddressCardComponent
  ],
  templateUrl: './profile.component.html',
  styles: ``
})
export class ProfileComponent implements OnInit {
  loading = true;
  profile: any = {};

  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  private loadProfile(): void {
    this.authService.me().subscribe({
      next: (profile: any) => {
        const user = profile?.user || profile?.data || profile;
        const orgId = this.getOrgId();
        
        if (orgId && user?.id) {
          this.userService.getUserDetail(orgId, user.id).subscribe({
            next: (detail: any) => {
              this.profile = {
                firstName: detail.firstName || user.firstName || '',
                lastName: detail.lastName || user.lastName || '',
                email: detail.email || user.email || '',
                phone: detail.phoneNumber || '',
                location: detail.location || '',
                role: (detail.roleNames?.[0] || detail.jobTitle || detail.department || 'User') as string,
                avatar: getUserAvatar(detail),
                bio: detail.jobTitle || detail.department || '',
              };
              this.loading = false;
            },
            error: () => {
              this.profile = {
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                phone: '',
                location: '',
                role: 'User',
                avatar: getUserAvatar(user),
                bio: '',
              };
              this.loading = false;
            }
          });
        } else {
          this.profile = {
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            email: user?.email || '',
            phone: '',
            location: '',
            role: 'User',
            avatar: getUserAvatar(user),
            bio: '',
          };
          this.loading = false;
        }
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  private getOrgId(): string | null {
    const remember = localStorage.getItem('remember_device');
    if (remember === 'true') {
      return localStorage.getItem('org_id') || localStorage.getItem('organizationId') || null;
    }
    return (
      sessionStorage.getItem('org_id') ||
      sessionStorage.getItem('organizationId') ||
      localStorage.getItem('org_id') ||
      localStorage.getItem('organizationId') ||
      null
    );
  }
}
