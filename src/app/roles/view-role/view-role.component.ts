import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { KeyVaultService } from '../../core/services/keyvault.service';
import { AuthService } from '../../core/services/auth.service';
import { PermissionService } from '../../core/services/permission.service';
import { ToastService } from '../../core/services/toast.service';

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
  createdByUserName?: string;
  updatedByUserName?: string;
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
  code: string;
  category?: string;
  type?: string;
  granted: boolean;
}

interface StatCard {
  label: string;
  value: number | string;
  suffix: string;
  iconPath: string;
  iconBgClass: string;
  iconStrokeClass: string;
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
  categoriesCount = 0;
  statCards: StatCard[] = [];

  constructor(
    private keyVault: KeyVaultService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private permissionService: PermissionService,
    private toastService: ToastService
  ) { }

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
        this.refreshPermissionGrants();
      },
      error: () => {
        this.errorMessage = 'Failed to load role details.';
        this.loading = false;
      }
    });
  }

  private refreshPermissionGrants(): void {
    if (this.permissionGroups.length > 0) {
      this.permissionGroups = this.permissionGroups.map(g => ({
        ...g,
        granted: g.items.filter(p => this.isPermissionGranted(p.code)).length,
        badgeClass: this.getBadgeClass(g.items, g.total),
        badgeText: `${g.items.filter(p => this.isPermissionGranted(p.code)).length} / ${g.total} Granted`,
        items: g.items.map(p => ({
          ...p,
          granted: this.isPermissionGranted(p.code)
        }))
      }));
    }
    this.updateStats();
  }

  private getBadgeClass(items: PermissionView[], total: number): string {
    const grantedCount = items.filter(p => p.granted).length;
    const fullyGranted = total > 0 && grantedCount === total;
    return total === 0
      ? 'bg-slate-100 text-slate-500'
      : fullyGranted
        ? 'bg-emerald-50 text-emerald-600'
        : grantedCount > 0
          ? 'bg-blue-50 text-blue-600'
          : 'bg-slate-100 text-slate-500';
  }

  private updateStats(): void {
    this.totalPermissions = this.permissionGroups.reduce((sum, g) => sum + g.total, 0);
    this.grantedPermissions = this.permissionGroups.reduce((sum, g) => sum + g.granted, 0);
    this.restrictedPermissions = this.totalPermissions - this.grantedPermissions;
    this.usersAssigned = this.role?.userCount || 0;

    const categories = new Set<string>();
    for (const g of this.permissionGroups) {
      for (const p of g.items) {
        if (p.category) categories.add(p.category);
      }
    }
    this.categoriesCount = categories.size;

    this.statCards = this.buildStatCards();
  }

  private buildStatCards(): StatCard[] {
    const modules = this.permissionGroups.length;
    return [
      {
        label: 'Total Permissions',
        value: this.totalPermissions,
        suffix: `Across ${modules} Module${modules === 1 ? '' : 's'}`,
        iconPath: '<path d="M14.208 6.87419L16.3163 8.98252C16.4877 9.15048 16.7181 9.24456 16.958 9.24456C17.1979 9.24456 17.4283 9.15048 17.5997 8.98252L19.5247 7.05752C19.6926 6.88617 19.7867 6.65579 19.7867 6.41585C19.7867 6.17591 19.6926 5.94554 19.5247 5.77419L17.4163 3.66585M19.2496 1.83252L10.4496 10.6325M11.9163 14.2075C11.9163 16.992 9.65911 19.2492 6.87467 19.2492C4.09024 19.2492 1.83301 16.992 1.83301 14.2075C1.83301 11.4231 4.09024 9.16585 6.87467 9.16585C9.65911 9.16585 11.9163 11.4231 11.9163 14.2075Z"/>',
        iconBgClass: 'bg-indigo-50',
        iconStrokeClass: 'text-[#4f46e5]',
      },
      {
        label: 'Granted Permissions',
        value: this.grantedPermissions,
        suffix: `${this.grantedPercent}% of total`,
        iconPath: '<path d="M19.9837 9.16702C20.4024 11.2215 20.104 13.3575 19.1384 15.2187C18.1728 17.0798 16.5984 18.5537 14.6776 19.3946C12.7569 20.2354 10.6059 20.3923 8.58342 19.8392C6.56096 19.2861 4.78924 18.0563 3.56373 16.355C2.33823 14.6537 1.73301 12.5837 1.84901 10.4901C1.965 8.3966 2.7952 6.40611 4.20116 4.8506C5.60712 3.29509 7.50385 2.26858 9.57504 1.94227C11.6462 1.61596 13.7667 2.00956 15.5828 3.05744M8.24984 10.0833L10.9998 12.8333L20.1665 3.66659"/>',
        iconBgClass: 'bg-emerald-50',
        iconStrokeClass: 'text-green-600',
      },
      {
        label: 'Restricted Permissions',
        value: this.restrictedPermissions,
        suffix: `${this.restrictedPercent}% of total`,
        iconPath: '<path d="M7.33345 10.9999H14.6674M20.1678 10.9999C20.1678 16.0629 16.0634 20.1673 11.0004 20.1673C5.93739 20.1673 1.83301 16.0629 1.83301 10.9999C1.83301 5.9369 5.93739 1.83252 11.0004 1.83252C16.0634 1.83252 20.1678 5.9369 20.1678 10.9999Z"/>',
        iconBgClass: 'bg-amber-50',
        iconStrokeClass: 'text-orange-600',
      },
      {
        label: 'Users Assigned',
        value: this.usersAssigned,
        suffix: 'View Users →',
        iconPath: '<path d="M14.6674 19.25V17.4167C14.6674 16.4442 14.281 15.5116 13.5933 14.8239C12.9057 14.1363 11.9729 13.75 11.0004 13.75H5.49997C4.52743 13.75 3.59472 14.1363 2.90704 14.8239C2.21935 15.5116 1.83301 16.4442 1.83301 17.4167V19.25M14.6674 2.86727C15.4537 3.07111 16.1501 3.53026 16.6472 4.17266C17.1444 4.81506 17.4141 5.60433 17.4141 6.4166C17.4141 7.22887 17.1444 8.01815 16.6472 8.66055C16.1501 9.30294 15.4537 9.7621 14.6674 9.96594M20.1678 19.2499V17.4166C20.1672 16.6041 19.8968 15.8149 19.399 15.1728C18.9012 14.5308 18.2043 14.0722 17.4176 13.8691M11.9171 6.41667C11.9171 8.44171 10.2754 10.0833 8.25019 10.0833C6.22498 10.0833 4.58323 8.44171 4.58323 6.41667C4.58323 4.39162 6.22498 2.75 8.25019 2.75C10.2754 2.75 11.9171 4.39162 11.9171 6.41667Z"/>',
        iconBgClass: 'bg-blue-50',
        iconStrokeClass: 'text-[#4f46e5]',
      },
      {
        label: 'Categories',
        value: this.categoriesCount,
        suffix: this.categoriesCount === 1 ? 'Permission category' : 'Permission categories',
        iconPath: '<path d="M3 7h18M3 12h18M3 17h18"/>',
        iconBgClass: 'bg-violet-50',
        iconStrokeClass: 'text-violet-600',
      },
      {
        label: 'Modules',
        value: this.permissionGroups.length,
        suffix: this.permissionGroups.length === 1 ? 'Permission group' : 'Permission groups',
        iconPath: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
        iconBgClass: 'bg-sky-50',
        iconStrokeClass: 'text-sky-600',
      },
    ];
  }

  private loadPermissions(): void {
    if (!this.orgId) return;
    this.keyVault.listPermissionsGrouped(this.orgId).subscribe({
      next: (res: any) => {
        const grouped = res?.data ?? res;
        this.permissionGroups = this.mapPermissionGroups(grouped);
        this.refreshPermissionGrants();
      },
      error: () => {
        this.permissionGroups = [];
        this.refreshPermissionGrants();
      }
    });
  }

  private mapPermissionGroups(grouped: PermissionsGrouped): PermissionGroupView[] {
    return (grouped || []).map(g => {
      const perms = (g.permissions || []).filter(p => p.active !== false);
      const title = g.group || 'Other';
      const total = perms.length || g.count || 0;
      const grantedCount = perms.filter(p => this.isPermissionGranted(p.code)).length;
      const fullyGranted = total > 0 && grantedCount === total;
      const badgeClass = this.getBadgeClass(perms.map(p => ({ code: p.code, name: p.name, granted: this.isPermissionGranted(p.code) })), total);
      const badgeText = `${grantedCount} / ${total} Granted`;
      return {
        title,
        description: this.getGroupDescription(title),
        icon: this.getGroupIcon(title),
        granted: grantedCount,
        total,
        badgeClass,
        badgeText,
        items: perms.map(p => ({
          name: p.name,
          code: p.code,
          category: p.category,
          type: p.type,
          granted: this.isPermissionGranted(p.code)
        }))
      };
    });
  }

  private isPermissionGranted(code: string): boolean {
    if (!this.role?.permissions) return false;
    const perms = this.role.permissions as any[];
    if (perms.includes('*')) return true;
    return perms.some(p => p === code);
  }

  private getGroupDescription(title: string): string {
    const map: Record<string, string> = {
      'Administration': 'Permissions to manage users, roles, audit logs and catalogs.',
      'Client Management': 'Permissions for viewing and managing client records.',
      'Contact Management': 'Permissions for managing client contacts.',
      'Document Management': 'Permissions for handling client documents.',
      'Emergency Contacts': 'Permissions for managing client emergency contacts.',
      'Key Management': 'Permissions for managing keys and their lifecycle.',
      'Operations': 'Permissions for managing jobs, job types and assignments.',
      'Site Management': 'Permissions for managing client sites.',
      'Storage Management': 'Permissions for storage locations, cabinets and hooks.',
      'Reports & Export': 'Permissions to view and export reports.',
      'User Management': 'Permissions related to user and role management.',
      'System & Settings': 'Permissions for system settings and configuration.',
    };
    return map[title] || `Permissions for the ${title} module.`;
  }

  private getGroupIcon(title: string): string {
    const map: Record<string, string> = {
      'Administration': '<path d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z"/><path d="m9 12 2 2 4-4"/>',
      'Client Management': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
      'Contact Management': '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
      'Document Management': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
      'Emergency Contacts': '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z"/>',
      'Key Management': '<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>',
      'Operations': '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M8 14h2M14 14h2"/>',
      'Site Management': '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
      'Storage Management': '<path d="M3 7l9-4 9 4v10l-9 4-9-4V7z"/><path d="M3 7l9 4 9-4"/><path d="M12 11v10"/>',
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
      error: () => { }
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

  getCategories(items: PermissionView[]): string[] {
    const seen: string[] = [];
    for (const it of items) {
      const cat = it.category || 'General';
      if (!seen.includes(cat)) seen.push(cat);
    }
    return seen;
  }

  getItemsByCategory(items: PermissionView[], category: string): PermissionView[] {
    return items.filter(i => (i.category || 'General') === category);
  }

  goBack(): void {
    this.router.navigate(['/roles']);
  }

  editRole(): void {
    if (this.role?.id) {
      this.router.navigate(['/roles/add-role'], { queryParams: { id: this.role.id } });
    }
  }

  toggleStatus(): void {
    if (this.role?.id) {
      const route = this.role.active ? '/roles/deactivate-role' : '/roles/reactivate-role';
      this.router.navigate([route], { queryParams: { id: this.role.id } });
    }
  }

  deleteRole(): void {
    if (this.role?.id) {
      this.router.navigate(['/roles/delete-role'], { queryParams: { id: this.role.id } });
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
