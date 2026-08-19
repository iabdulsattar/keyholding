import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SubscriptionLayoutComponent } from '../../../layout/subscription-layout/subscription-layout.component';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-subscription-trial-ready',
  imports: [
    CommonModule,
    RouterModule,
    SubscriptionLayoutComponent,
  ],
  templateUrl: './subscription-trial-ready.component.html',
  styles: ''
})
export class SubscriptionTrialReadyComponent implements OnInit {
  userName = '';
  userEmail = '';
  userRole = '';
  orgName = '';
  orgId: string | null = null;

  constructor(
    private subscriptionService: SubscriptionService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.orgId = this.getOrgId();
    this.orgName = this.authService.getOrgName() || '';

    const token = this.authService.getAccessToken();
    if (token) {
      this.authService.me(token).subscribe({
        next: (profile: any) => {
          const user = profile?.user || profile?.data || profile;
          this.userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'User';
          this.userEmail = user.email || '';
          this.userRole = this.extractRole(profile);
        },
        error: () => {
          this.userName = 'User';
        }
      });
    }
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
}
