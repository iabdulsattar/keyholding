import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { KeyVaultService } from '../core/services/keyvault.service';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './subscription.component.html',
  styles: ``
})
export class SubscriptionComponent implements OnInit {
  loading = true;
  error = false;

  trial = {
    active: true,
    startDate: '07 Aug 2026',
    endDate: '21 Aug 2026',
    daysRemaining: 13,
  };

  usage = {
    users: 7,
    usersLimit: 10,
    sites: 12,
    keys: 84,
    jobs: 26,
    customers: 2,
    storage: 18,
  };

  plan = {
    name: 'KeyVault Trial',
    type: 'Free Trial',
    duration: '14 Days',
    startDate: '07 Aug 2026',
    endDate: '21 Aug 2026',
    autoConversion: 'Not Set',
  };

  constructor(
    private keyVaultService: KeyVaultService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadSubscription();
  }

  private loadSubscription(): void {
    const orgId = this.getOrgId();
    if (!orgId) {
      this.loading = false;
      this.error = true;
      return;
    }

    this.keyVaultService.getDashboardStats(orgId).subscribe({
      next: (data: any) => {
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = true;
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
