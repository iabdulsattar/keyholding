import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { EdobService } from '../../core/services/edob.service';
import { AuthService } from '../../core/services/auth.service';
import { PermissionService } from '../../core/services/permission.service';
import { Role, Permission, PermissionsGrouped } from '../../core/models/edob.models';

interface ActivityItem {
  date: string;
  event: string;
  who: string;
}

interface PermissionGroupView {
  title: string;
  description: string;
  icon: string;
  granted: number;
  total: number;
  badgeClass: string;
  badgeText: string;
  items: PermissionView[];
}

interface PermissionView {
  name: string;
  granted: boolean;
}

@Component({
  selector: 'app-view-role',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './view-role.component.html',
  styles: [`
    .perm-row-body { display: none; padding-top: 14px; }
    .perm-row.open .perm-row-body { display: block; }
    .perm-chevron { transition: transform 0.15s ease; }
    .perm-row.open .perm-chevron { transform: rotate(180deg); }
  `]
})
export class ViewRoleComponent implements OnInit {
  role: Role | null = null;
  loading = true;
  errorMessage = '';
  orgId: string | null = null;

  permissionGroups: PermissionGroupView[] = [];
  activities: ActivityItem[] = [];

  currentUserName = 'John Smith';

  totalPermissions = 0;
  grantedPermissions = 0;
  restrictedPermissions = 0;
  usersAssigned = 0;

  constructor(
    private edobService: EdobService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private permissionService: PermissionService
  ) {}

  get canEditRole(): boolean {
    return this.permissionService.hasPermission('admin.roles.manage');
  }

  ngOnInit(): void {
    const roleId = this.route.snapshot.queryParamMap.get('id');
    if (!roleId) {
      this.errorMessage = 'Role not found.';
      this.loading = false;
      return;
    }

    this.orgId = this.getOrgId();
    if (!this.orgId) {
      this.errorMessage = 'Organization not found.';
      this.loading = false;
      return;
    }

    this.loadRole(roleId);
    this.loadPermissions();
    this.loadCurrentUser();
    this.loadMockActivity();
  }

  private loadRole(id: string): void {
    if (!this.orgId) return;
    this.loading = true;
    this.edobService.getRole(this.orgId, id).subscribe({
      next: (data) => {
        this.role = data;
        this.loading = false;
        this.updateStats();
      },
      error: () => {
        this.errorMessage = 'Failed to load role details.';
        this.loading = false;
      }
    });
  }

  private updateStats(): void {
    this.totalPermissions = this.permissionGroups.reduce((sum, g) => sum + g.total, 0);
    this.grantedPermissions = this.permissionGroups.reduce((sum, g) => sum + g.granted, 0);
    this.restrictedPermissions = this.totalPermissions - this.grantedPermissions;
    this.usersAssigned = this.role?.userCount || 0;
  }

  private loadPermissions(): void {
    if (!this.orgId) return;
    this.edobService.getPermissionsGrouped(this.orgId).subscribe({
      next: (grouped: PermissionsGrouped) => {
        this.permissionGroups = this.mapPermissionGroups(grouped);
        this.updateStats();
      },
      error: () => {
        this.permissionGroups = [];
        this.updateStats();
      }
    });
  }

  private mapPermissionGroups(grouped: PermissionsGrouped): PermissionGroupView[] {
    return (grouped || []).map(g => {
      const perms = g.permissions || [];
      const title = g.group;
      const grantedCount = perms.filter(p => this.isPermissionGranted(p.code)).length;
      const badgeClass = grantedCount === perms.length ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700';
      const badgeText = `${grantedCount} / ${perms.length} Granted`;
      return {
        title,
        description: this.getGroupDescription(title),
        icon: this.getGroupIcon(title),
        granted: grantedCount,
        total: perms.length,
        badgeClass,
        badgeText,
        items: perms.map(p => ({
          name: p.name,
          granted: this.isPermissionGranted(p.code)
        }))
      };
    });
  }

  private isPermissionGranted(code: string): boolean {
    if (!this.role?.permissions) return false;
    const perms = this.role.permissions as string[];
    return perms.some(p => p === code);
  }

  private getGroupDescription(title: string): string {
    const map: Record<string, string> = {
      'Entry & Feed Management': 'Permissions related to entries, feed and comments.',
      'Review & Approval': 'Permissions for reviewing and approving entries.',
      'Reports & Export': 'Permissions to view and export reports.',
      'User Management': 'Permissions related to user and role management.',
      'System & Settings': 'Permissions for system settings and configuration.',
    };
    return map[title] || 'Permissions for this module.';
  }

  private getGroupIcon(title: string): string {
    const map: Record<string, string> = {
      'Entry & Feed Management': '<path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/>',
      'Review & Approval': '<path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/>',
      'Reports & Export': '<path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v4h4"/>',
      'User Management': '<circle cx="9" cy="8" r="3.5"/><path d="M5 21c0-4 3.5-7 7-7s7 3 7 7"/><circle cx="17" cy="9" r="2.3"/><path d="M15 21c.3-2.6 2.1-4.7 4.6-5.3"/>',
      'System & Settings': '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9c.1.7.6 1.2 1.3 1.4h.1a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.3 1z"/>',
    };
    return map[title] || '<circle cx="12" cy="12" r="9"/>';
  }

  private loadCurrentUser(): void {
    const token = this.authService.getAccessToken();
    if (!token) return;
    this.authService.me(token).subscribe({
      next: (profile: any) => {
        const user = profile?.user || profile?.data || profile;
        this.currentUserName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'User';
      },
      error: () => {}
    });
  }

  private loadMockActivity(): void {
    this.activities = [
      { date: '20 Jun 2025, 04:30 PM', event: 'Role updated', who: `Updated by ${this.currentUserName}` },
      { date: '18 Jun 2025, 11:20 AM', event: 'Permission changes made', who: `Updated by ${this.currentUserName}` },
      { date: '10 Jun 2025, 09:10 AM', event: 'Users assigned (2)', who: 'Updated by Sarah Malik' },
      { date: '23 May 2025, 08:15 AM', event: 'Role created', who: `Created by ${this.currentUserName}` },
    ];
  }

  togglePerm(row: HTMLElement): void {
    row.classList.toggle('open');
  }

  goBack(): void {
    this.router.navigate(['/user-management'], { queryParams: { tab: '1' } });
  }

  editRole(): void {
    if (this.role?.id) {
      this.router.navigate(['/roles/add-role'], { queryParams: { id: this.role.id } });
    }
  }

  get grantedPercent(): number {
    if (!this.totalPermissions) return 0;
    return Math.round((this.grantedPermissions / this.totalPermissions) * 100);
  }

  get restrictedPercent(): number {
    if (!this.totalPermissions) return 0;
    return Math.round((this.restrictedPermissions / this.totalPermissions) * 100);
  }

  private getOrgId(): string | null {
    const remember = localStorage.getItem('remember_device');
    if (remember === 'true') {
      return localStorage.getItem('org_id') || localStorage.getItem('organizationId') || null;
    }
    return sessionStorage.getItem('org_id') || sessionStorage.getItem('organizationId') || localStorage.getItem('org_id') || localStorage.getItem('organizationId') || null;
  }
}
