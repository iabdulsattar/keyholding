import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PermissionService } from '../../core/services/permission.service';
import { ProfileResponse } from '../../core/models/auth.models';
import { SidebarService } from '../../shared/services/sidebar.service';
import { KeyVaultService } from '../../core/services/keyvault.service';
import { SubscriptionService } from '../../core/services/subscription.service';
import { ProductService } from '../../core/services';
import { ProductItem } from '../../shared/components/ui/product-switcher/product-switcher.component';
import { formatDateLocal, getTimezoneOptions } from '../../core/utils/date.utils';
import { AppChart } from '../../shared/components/charts/donut/chart.component';
import { LineChartDashboardComponent, ChartOptions as LineChartOptions } from '../../shared/components/charts/line/line-chart-dashboard/chart.component';
import { ProductSwitcherComponent } from '../../shared/components/ui/product-switcher/product-switcher.component';

@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, AppChart, LineChartDashboardComponent, ProductSwitcherComponent],
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
  pageTitle = 'Main Dashboard';
  pageDescription = 'Overview of your keyholding operations';
  selectedDate = new Date();
  loading = true;
  dashboardError = false;
  jobsTrendPeriodLabel = 'Last 7 days';

  strategicMetrics = {
    totalClients: 0,
    totalSites: 0,
    totalKeys: 0,
    keysInStorage: 0,
    keysIssued: 0,
  };
  trial: any = null;

  alertMetrics = {
    overdueKeys: 0,
    lostKeys: 0,
    damagedKeys: 0,
    jobsToday: 0,
    failedJobs: 0,
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

  jobsChart = {
    series: [] as number[],
    labels: [] as string[],
    colors: ['#10b981', '#2563eb', '#f59e0b', '#ef4444', '#94a3b8', '#a855f7'],
    titleText: '',
  };

  jobsTrendChart: Partial<LineChartOptions> = {
    series: [
      {
        name: 'Jobs',
        data: [],
      },
    ],
    chart: {
      type: 'line',
      height: 240,
      toolbar: { show: false },
    },
    yaxis: {
      min: 0
    },
    stroke: {
      // curve: 'smooth',
      width: 2,
    },
    title: {
      text: '',
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: [],
      labels: {
        style: {
          colors: '#64748B',
          fontSize: '11px',
          fontFamily: 'Inter',
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    grid: {
      borderColor: '#eef2f7',
      strokeDashArray: 4,
    },
    markers: {
      colors: ['#2563eb'],
      strokeWidth: 2,
      size: 4,
      hover: { size: 6 },
    },
    tooltip: {
      theme: 'light',
    },
  };

  criticalAlerts: {
    title: string;
    iconWrap: string;
    icon: string;
    value: string;
    badgeClass: string;
  }[] = [];

  officersOnDuty = 0;
  keysInUse = 0;
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
    private subscriptionService: SubscriptionService,
    private productService: ProductService,
  ) {}

  ngOnInit(): void {
    this.loadGreeting();
    this.loadDashboard(true);
    this.loadSubscriptionTrial();
  }

  /**
   * Returning to the dashboard (for example after creating a job) re-reads the
   * API instead of relying on a full page reload, so the cards always show the
   * current data.
   */
  refresh(): void {
    this.loadGreeting();
    this.loadDashboard();
    this.loadSubscriptionTrial();
  }

  private loadGreeting(): void {
    this.authService.me().subscribe({
      next: (profile: ProfileResponse) => {
        const now = new Date();
        const hour = now.getHours();
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

  private formatDate(iso: string): string {
    return formatDateLocal(iso);
  }

  private daysUntil(iso: string): number {
    if (!iso) return 0;
    const target = new Date(iso);
    const now = new Date();
    if (isNaN(target.getTime())) return 0;
    const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }

  private loadDashboard(showLoader = false): void {
    const orgId = this.getOrgId();
    if (!orgId) {
      this.loading = false;
      this.dashboardError = true;
      return;
    }

    // Only the first load blanks the page; a refresh keeps the current cards on
    // screen while the new figures are fetched.
    if (showLoader) {
      this.loading = true;
    }

    this.keyVaultService.getDashboardStats(orgId).subscribe({
      next: (data: any) => {
        this.applyDashboard(data);
        this.loading = false;
        this.dashboardError = false;
      },
      error: () => {
        this.loading = false;
        this.dashboardError = true;
      }
    });
  }

  private loadSubscriptionTrial(): void {
    // The trial banner links to the administrator-only subscription pages, so
    // members never trigger this request or see the banner.
    if (!this.permissionService.isOrgAdmin()) {
      this.trial = null;
      return;
    }
    const orgId = this.getOrgId();
    if (!orgId) return;

    this.subscriptionService.getSubscription(orgId, 'key-vault').subscribe({
      next: (res: any) => {
        const payload = res?.data ?? res ?? {};
        const sub = payload.subscription ?? payload ?? {};

        const isTrial = sub?.trial === true || sub?.status?.toUpperCase() === 'TRIAL' || sub?.status?.toUpperCase() === 'TRIALING';
        const trialEnd = sub?.effectiveExpiry || sub?.trialEnd || sub?.currentPeriodEnd;
        const isExpired = isTrial && trialEnd && new Date(trialEnd) < new Date();

        if (isTrial && !isExpired) {
          const startDate = sub?.startDate || sub?.trialStart || sub?.currentPeriodStart;
          this.trial = {
            active: true,
            startDate: startDate ? this.formatDate(startDate) : '-',
            endDate: trialEnd ? this.formatDate(trialEnd) : '-',
            daysRemaining: trialEnd ? this.daysUntil(trialEnd) : 0,
          };
        } else {
          this.trial = null;
        }
      },
      error: () => {
        this.trial = null;
      }
    });
  }

  private applyDashboard(data: any): void {
    const payload = data?.data ?? data ?? {};

    const totalClients = this.toCount(payload.totalClients);
    const totalSites = this.toCount(payload.totalSites);
    const totalKeys = this.toCount(payload.totalKeys);
    const keysInStorage = this.toCount(payload.keysInStorage);
    const keysIssued = this.toCount(payload.keysIssued);
    const keysInUse = this.toCount(payload.keysInUse);
    this.strategicMetrics = {
      totalClients,
      totalSites,
      totalKeys,
      keysInStorage,
      keysIssued,
    };

    const overdueKeys = this.toCount(payload.overdueKeys);
    const lostKeys = this.toCount(payload.lostKeys);
    const damagedKeys = this.toCount(payload.damagedKeys);
    const jobsToday = this.toCount(payload.jobsToday);
    const failedJobs = this.toCount(payload.exceptions?.failedJobs ?? payload.failedJobs);
    this.alertMetrics = {
      overdueKeys,
      lostKeys,
      damagedKeys,
      jobsToday,
      failedJobs,
    };

    this.keysInUse = keysInUse;
    this.officersOnDuty = this.toCount(payload.officersOnDuty);

    const jobsOverviewPayload = payload.jobsOverview ?? {};
    const completed = this.toCount(jobsOverviewPayload.completed);
    const inProgress = this.toCount(jobsOverviewPayload.inProgress);
    const cancelled = this.toCount(jobsOverviewPayload.cancelled);
    const overdue = this.toCount(jobsOverviewPayload.overdue);
    const scheduled = this.toCount(jobsOverviewPayload.scheduled);
    const failed = this.alertMetrics.failedJobs;
    this.jobsOverview = {
      completed,
      inProgress,
      failed,
      cancelled,
      total: completed + inProgress + failed + cancelled + overdue + scheduled,
      completedCount: completed,
      inProgressCount: inProgress,
      failedCount: failed,
      cancelledCount: cancelled,
    };

    this.jobsChart = {
      series: [scheduled, inProgress, completed, overdue, cancelled, failed],
      labels: ['Scheduled', 'In Progress', 'Completed', 'Overdue', 'Cancelled', 'Failed'],
      colors: this.jobsChart.colors,
      titleText: 'Jobs Overview',
    };

    const jobsTrend = Array.isArray(payload.jobsTrend) ? payload.jobsTrend : [];
    this.jobsTrendPeriodLabel = jobsTrend.length > 0
      ? `Last ${jobsTrend.length} days`
      : 'No trend data';
    this.jobsTrendChart = {
      ...this.jobsTrendChart,
      series: [{
        name: 'Jobs',
        data: jobsTrend.map((item: any) => this.toCount(item?.count)),
      }],
      xaxis: {
        ...this.jobsTrendChart.xaxis,
        categories: jobsTrend.map((item: any) => item?.day || item?.date || ''),
      },
    };

    const pendingApprovals = this.toCount(payload.exceptions?.pendingApprovals);
    this.criticalAlerts = [
      {
        title: 'Overdue Keys',
        iconWrap: 'bg-amber-50 text-amber-600',
        icon: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
        value: String(overdueKeys),
        badgeClass: 'bg-amber-100 text-amber-800',
      },
      {
        title: 'Lost Keys',
        iconWrap: 'bg-red-50 text-red-600',
        icon: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
        value: String(lostKeys),
        badgeClass: 'bg-red-100 text-red-800',
      },
      {
        title: 'Damaged Keys',
        iconWrap: 'bg-purple-50 text-purple-600',
        icon: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
        value: String(damagedKeys),
        badgeClass: 'bg-purple-100 text-purple-800',
      },
      {
        title: 'Failed Jobs',
        iconWrap: 'bg-rose-50 text-rose-600',
        icon: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
        value: String(failedJobs),
        badgeClass: 'bg-rose-100 text-rose-800',
      },
      {
        title: 'Pending Approvals',
        iconWrap: 'bg-blue-50 text-blue-600',
        icon: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
        value: String(pendingApprovals),
        badgeClass: 'bg-blue-100 text-blue-800',
      },
    ];

    const apiOfficers: any[] = Array.isArray(payload.officers) ? payload.officers : [];
    this.officers = apiOfficers.map((u: any) => {
      const fullName = u.fullName || u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'Unknown';
      const parts = fullName.split(' ').filter(Boolean);
      const initials = parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : fullName.slice(0, 2).toUpperCase();
      return {
        id: u.id || fullName,
        name: fullName,
        role: u.role || u.jobTitle || '',
        region: u.region || '',
        initials,
      };
    });
  }

  private toCount(value: unknown): number {
    const count = Number(value ?? 0);
    return Number.isFinite(count) ? Math.max(0, count) : 0;
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
    return d.toLocaleString(undefined, getTimezoneOptions({
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }));
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
