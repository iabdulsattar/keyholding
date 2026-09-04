import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { KeyVaultService } from '../../core/services/keyvault.service';
import { AuthService } from '../../core/services/auth.service';
import { PermissionService } from '../../core/services/permission.service';

interface Role {
  id: string;
  code: string;
  name: string;
  description?: string;
  color?: string;
  permissions: string[];
  active: boolean;
  source?: string;
  permissionCount?: number;
  userCount?: number;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

interface Permission {
  id?: string;
  code: string;
  name: string;
  description?: string;
  group?: string;
  category?: string;
  type?: string;
  active?: boolean;
  [key: string]: any;
}

interface PermissionGroupResponse {
  group: string;
  count: number;
  permissions: Permission[];
}

type PermissionsGrouped = PermissionGroupResponse[];

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

import { ActivityItem } from '../../shared/components/ui/activity-timeline/activity-timeline.component';

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
  activitiesLoading = false;
  activitiesSearch = '';

  currentUserName = 'John Smith';

  totalPermissions = 0;
  grantedPermissions = 0;
  restrictedPermissions = 0;
  usersAssigned = 0;

  constructor(
    private keyVault: KeyVaultService,
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
    this.loadActivities();
  }

  private loadRole(id: string): void {
    if (!this.orgId) return;
    this.loading = true;
    this.keyVault.getRole(this.orgId, id).subscribe({
      next: (res: any) => {
        this.role = res?.data ?? res;
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
    this.keyVault.listPermissionsGrouped(this.orgId).subscribe({
      next: (res: any) => {
        const grouped = res?.data ?? res;
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
      const badgeClass = grantedCount === perms.length ? 'bg-emerald-50 text-emerald-500' : 'bg-gray-50 text-gray-700';
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
      'Reports & Export': 'Permissions to view and export reports.',
      'User Management': 'Permissions related to user and role management.',
      'System & Settings': 'Permissions for system settings and configuration.',
    };
    return map[title] || 'Permissions for this module.';
  }

  private getGroupIcon(title: string): string {
    const map: Record<string, string> = {
      'Reports & Export': '<path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v4h4"/>',
      'User Management': '<circle cx="9" cy="8" r="3.5"/><path d="M5 21c0-4 3.5-7 7-7s7 3 7 7"/><circle cx="17" cy="9" r="2.3"/><path d="M15 21c.3-2.6 2.1-4.7 4.6-5.3"/>',
      'System & Settings': '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3-1.9V9c.1.7.6 1.2 1.3 1.4h.1a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.3 1z"/>',
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

  loadActivities(): void {
    if (!this.orgId || !this.role?.id) return;
    this.activitiesLoading = true;
      this.keyVault.listEntityAuditLog(this.orgId, 'ROLE', this.role.id, { page: 0, size: 50 }).subscribe({
      next: (result: any) => {
        const items = result?.items ?? result?.data?.items ?? [];
        this.activities = items.map((item: any) => this.mapAuditToActivity(item));
        this.activitiesLoading = false;
      },
      error: () => {
        this.activities = [];
        this.activitiesLoading = false;
      }
    });
  }

  onActivitiesSearch(): void {
    const q = this.activitiesSearch.toLowerCase().trim();
    if (!q) {
      this.loadActivities();
      return;
    }
    this.activities = this.activities.filter((a: ActivityItem) =>
      (a.by + ' ' + a.action + ' ' + a.entity + ' ' + a.name + ' ' + a.details).toLowerCase().includes(q)
    );
  }

  private mapAuditToActivity(item: any): ActivityItem {
    const data = item?.data ?? {};
    const actor = item.actor || item.userName || 'System';
    return {
      id: item.id ?? '',
      time: this.formatDateTime(item.createdAt),
      by: actor,
      role: item.userRole || '—',
      initials: this.getInitials(actor),
      avatarColor: this.getAvatarColor(actor),
      action: this.getEventAction(item.eventType || '') || item.action || '—',
      eventType: item.eventType || '—',
      entity: this.formatTargetType(item.targetType),
      name: this.getEntityName(data?.message || item?.details || '') || '—',
      detail1: '',
      ip: item.ipAddress || '—',
      details: this.formatActivityDetails(item),
    };
  }

  private formatActivityDetails(item: any): string {
    const data = item?.data ?? {};
    const message = data?.message || item?.details || '';
    if (!message) return '—';

    const entityName = this.getEntityName(data?.message || item?.details || '');
    const eventType = item.eventType || '';
    const actor = item.actor || item.userName || '';

    let cleanMessage = message;
    if (actor && cleanMessage.startsWith(actor)) {
      cleanMessage = cleanMessage.slice(actor.length).trim();
      if (cleanMessage.startsWith('"')) {
        cleanMessage = cleanMessage.trim();
      }
    }

    if (entityName && eventType) {
      const entityType = this.formatTargetType(item.targetType);
      const eventAction = this.getEventAction(eventType);
      if (eventAction) {
        return `${entityType} "${entityName}" ${eventAction}`;
      }
    }

    return cleanMessage || '—';
  }

  private getEventAction(eventType: string): string {
    if (!eventType) return '';
    const normalized = eventType.toLowerCase();
    if (normalized.includes('created')) return 'Created';
    if (normalized.includes('updated')) return 'Updated';
    if (normalized.includes('deleted')) return 'Deleted';
    if (normalized.includes('activated')) return 'Activated';
    if (normalized.includes('deactivated')) return 'Deactivated';
    if (normalized.includes('status_changed')) return 'Status Changed';
    if (normalized.includes('added')) return 'Added';
    if (normalized.includes('edited')) return 'Edited';
    return '';
  }

  private formatDateTime(value: string): string {
    if (!value) return '—';
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    const datePart = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const timePart = date.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' });
    return `${datePart}, ${timePart}`;
  }

  private getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }

  private getAvatarColor(name: string): string {
    const colors = ['bg-blue-100 text-blue-600', 'bg-emerald-100 text-emerald-600', 'bg-amber-100 text-amber-600', 'bg-rose-100 text-rose-600', 'bg-violet-100 text-violet-600', 'bg-sky-100 text-sky-600'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }

  private getEntityName(details: string): string {
    if (!details) return '';
    const match = details.match(/"([^"]+)"/);
    return match ? match[1] : details.substring(0, 50);
  }

  private formatTargetType(value?: string): string {
    if (!value) return '—';
    return value.charAt(0) + value.slice(1).toLowerCase();
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
