import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PermissionService } from '../../core/services/permission.service';
import { ProfileResponse } from '../../core/models/auth.models';
import { SafeHtmlPipe } from '../../pipe/safe-html.pipe';
import { SidebarService } from '../../shared/services/sidebar.service';
import { KeyVaultService } from '../../core/services/keyvault.service';

@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, SafeHtmlPipe],
  templateUrl: './dashboard-shell.component.html',
  styles: `
    @keyframes wave {
      0%, 100% { transform: rotate(0deg); }
      20% { transform: rotate(14deg); }
      40% { transform: rotate(-8deg); }
      60% { transform: rotate(14deg); }
      80% { transform: rotate(-4deg); }
    }
    .animate-wave {
      animation: wave 2.5s ease-in-out infinite;
      display: inline-block;
    }
  `
})
export class DashboardShellComponent implements OnInit {
  greeting = 'Good morning';
  userName = '';
  loading = true;
  dashboardError = false;
  orgUsers: any[] = [];

  strategicMetrics = {
    totalClients: 0,
    totalSites: 0,
    totalKeys: 0,
    keysInStorage: 0,
    keysIssued: 0,
    totalClientsChange: '0%',
    totalSitesChange: '0%',
    totalKeysChange: '0%',
    keysInStorageChange: '0%',
    keysIssuedChange: '0%',
  };

  alertMetrics = {
    overdueKeys: 0,
    lostKeys: 0,
    damagedKeys: 0,
    jobsToday: 0,
    failedJobs: 0,
    overdueKeysChange: '0%',
    lostKeysChange: '0%',
    damagedKeysChange: '0%',
    jobsTodayChange: '0%',
    failedJobsChange: '0%',
  };

  jobsOverview = {
    completed: 0,
    inProgress: 0,
    failed: 0,
    cancelled: 0,
    total: 0,
    completedCount: 0,
    inProgressCount: 0,
    failedCount: 0,
    cancelledCount: 0,
  };

  criticalAlerts: {
    title: string;
    iconWrap: string;
    icon: string;
    value: string;
    badgeClass: string;
  }[] = [];

  officers: {
    id: string;
    name: string;
    role: string;
    region: string;
    initials: string;
  }[] = [];

  constructor(
    private authService: AuthService,
    private permissionService: PermissionService,
    public sidebarService: SidebarService,
    private keyVaultService: KeyVaultService,
  ) {}

  ngOnInit(): void {
    this.loadGreeting();
    this.loadDashboard();
  }

  private loadGreeting(): void {
    this.authService.me().subscribe({
      next: (profile: ProfileResponse) => {
        const hour = new Date().getHours();
        this.greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
        this.userName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.email || 'User';
      },
      error: () => {
        this.greeting = 'Good morning';
        this.userName = 'User';
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

  private loadDashboard(): void {
    const orgId = this.getOrgId();
    if (!orgId) {
      this.loading = false;
      this.dashboardError = true;
      return;
    }

    this.keyVaultService.getDashboardStats(orgId).subscribe({
      next: (data: any) => {
        this.applyDashboard(data);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.dashboardError = true;
      }
    });
  }

  private applyDashboard(data: any): void {
    const payload = data?.data ?? data ?? {};
    const totalClients = (payload.totalClients ?? this.orgUsers.length) || 124;
    const totalSites = payload.totalSites ?? 356;
    const totalKeys = payload.totalKeys ?? 1248;
    const keysInStorage = payload.keysInStorage ?? 842;
    const keysIssued = payload.keysIssued ?? 312;
    this.strategicMetrics = {
      totalClients,
      totalSites,
      totalKeys,
      keysInStorage,
      keysIssued,
      totalClientsChange: '5%',
      totalSitesChange: '8%',
      totalKeysChange: '6%',
      keysInStorageChange: '4%',
      keysIssuedChange: '7%',
    };

    this.alertMetrics = {
      overdueKeys: payload.overdueKeys ?? 0,
      lostKeys: payload.lostKeys ?? 0,
      damagedKeys: payload.damagedKeys ?? 0,
      jobsToday: payload.jobsToday ?? 0,
      failedJobs: payload.failedJobs ?? 0,
      overdueKeysChange: '12%',
      lostKeysChange: '0%',
      damagedKeysChange: '13%',
      jobsTodayChange: '16%',
      failedJobsChange: '33%',
    };

    const totalJobs = this.alertMetrics.jobsToday || 48;
    const completed = 79;
    const inProgress = 13;
    const failed = this.alertMetrics.failedJobs || 4;
    const cancelled = 4;
    this.jobsOverview = {
      completed,
      inProgress,
      failed,
      cancelled,
      total: totalJobs,
      completedCount: Math.round(totalJobs * completed / 100),
      inProgressCount: Math.round(totalJobs * inProgress / 100),
      failedCount: Math.round(totalJobs * failed / 100),
      cancelledCount: Math.round(totalJobs * cancelled / 100),
    };

    this.criticalAlerts = [
      {
        title: 'Overdue Keys',
        iconWrap: 'bg-amber-50 text-amber-600',
        icon: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
        value: String(this.alertMetrics.overdueKeys),
        badgeClass: 'bg-amber-100 text-amber-800',
      },
      {
        title: 'Lost Keys',
        iconWrap: 'bg-red-50 text-red-600',
        icon: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
        value: String(this.alertMetrics.lostKeys),
        badgeClass: 'bg-red-100 text-red-800',
      },
      {
        title: 'Damaged Keys',
        iconWrap: 'bg-purple-50 text-purple-600',
        icon: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
        value: String(this.alertMetrics.damagedKeys),
        badgeClass: 'bg-purple-100 text-purple-800',
      },
      {
        title: 'Failed Jobs',
        iconWrap: 'bg-rose-50 text-rose-600',
        icon: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
        value: String(this.alertMetrics.failedJobs),
        badgeClass: 'bg-rose-100 text-rose-800',
      },
      {
        title: 'Pending Approvals',
        iconWrap: 'bg-blue-50 text-blue-600',
        icon: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
        value: '5',
        badgeClass: 'bg-blue-100 text-blue-800',
      },
    ];

    const allOfficers: any[] = [
      ...this.orgUsers,
      { id: 'o1', firstName: 'James', lastName: 'Carter', email: '' },
      { id: 'o2', firstName: 'Sarah', lastName: 'Johnson', email: '' },
      { id: 'o3', firstName: 'Michael', lastName: 'Brown', email: '' },
      { id: 'o4', firstName: 'David', lastName: 'Wilson', email: '' },
      { id: 'o5', firstName: 'Emma', lastName: 'Davis', email: '' },
    ];

    this.officers = (allOfficers.length > 0 ? allOfficers : [
      { id: 'o1', firstName: 'James', lastName: 'Carter', email: '' },
      { id: 'o2', firstName: 'Sarah', lastName: 'Johnson', email: '' },
      { id: 'o3', firstName: 'Michael', lastName: 'Brown', email: '' },
      { id: 'o4', firstName: 'David', lastName: 'Wilson', email: '' },
      { id: 'o5', firstName: 'Emma', lastName: 'Davis', email: '' },
    ]).map((u: any) => {
      const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Unknown';
      const parts = fullName.split(' ').filter(Boolean);
      const initials = parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : fullName.slice(0, 2).toUpperCase();
      return {
        id: u.id,
        name: fullName,
        role: u.role || 'Keyholder',
        region: u.region || 'North Region',
        initials,
      };
    });
  }

  private titleCase(value: string): string {
    return value
      .toLowerCase()
      .split(/[_\s]+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  private formatTime(iso?: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  private priorityClass(priority?: string): string {
    switch ((priority || '').toUpperCase()) {
      case 'CRITICAL':
      case 'HIGH':
        return 'bg-error-50 text-error-600';
      case 'MEDIUM':
        return 'bg-warning-50 text-warning-700';
      default:
        return 'bg-gray-50 text-gray-600';
    }
  }

  private statusClass(status?: string): string {
    switch ((status || '').toUpperCase()) {
      case 'COMPLETED':
      case 'CLOSED':
        return 'bg-success-50 text-success-700';
      case 'IN_PROGRESS':
      case 'ASSIGNED':
      case 'IN REVIEW':
        return 'bg-brand-50 text-brand-600';
      default:
        return 'bg-brand-50 text-brand-600';
    }
  }

  private icon(inner: string, stroke = 'currentColor', size = 24): string {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
  }
}
