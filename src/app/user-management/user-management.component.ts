import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { UserService } from '../core/services/user.service';
import { KeyVaultService } from '../core/services/keyvault.service';
import { PermissionService } from '../core/services/permission.service';
import { AuthService } from '../core/services/auth.service';
import { SendInviteModalComponent } from './send-invite-modal/send-invite-modal.component';
import { DeactivateUserModalComponent } from './deactivate-user-modal/deactivate-user-modal.component';
import { ReactivateUserModalComponent } from './reactivate-user-modal/reactivate-user-modal.component';
import { ResendCredentialsModalComponent } from './resend-credentials-modal/resend-credentials-modal.component';
import { TableUser } from '../shared/components/users/users-table/users-table.component';
import { RolesTableComponent } from '../shared/components/roles/roles-table/roles-table.component';
import { RichSelectComponent, RichSelectOption } from '../shared/components/form/rich-select/rich-select.component';

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

interface User {
  id?: string;
  name: string;
  email: string;
  roles: string[];
  status: 'Active' | 'Inactive';
  invite: 'Accepted' | 'Pending' | 'Expired' | 'Not Invited';
  inviteSub: string;
  lastLogin: string;
  lastTime: string;
  created: string;
  img: number;
  resend?: boolean;
  department?: string;
  phone?: string;
  location?: string;
  employeeId?: string;
  joined?: string;
}

interface PageMeta {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

interface PermissionRow {
  icon: string;
  name: string;
  module: string;
  category: string;
  type: string;
  status: string;
  description: string;
}

interface PermissionGroup {
  name: string;
  rows: PermissionRow[];
}

import { ActivityItem } from '../shared/components/ui/activity-timeline/activity-timeline.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SendInviteModalComponent, DeactivateUserModalComponent, ReactivateUserModalComponent, ResendCredentialsModalComponent, RolesTableComponent, RichSelectComponent],
  templateUrl: './user-management.component.html',
  styles: ``
})
export class UserManagementComponent implements OnInit {
  activeTab = 0;
  searchQuery = '';
  filterRole = '';
  filterStatus = '';
  private searchDebounce: any;
  loading = false;
  errorMessage = '';
  stats: any = null;
  users: User[] = [];
  selectedUser: User | null = null;
  detailUser: any = null;
  loadingDetail = false;
  showDetail = false;
  showInviteModal = false;
  showDeactivateModal = false;
  showReactivateModal = false;
  showResendModal = false;
  resendTargetUser: TableUser | null = null;
  currentUserId: string | null = null;

  get roleOptions(): RichSelectOption[] {
    const roles = this.users.flatMap(u => u.roles || []);
    return Array.from(new Set(roles)).sort().map(role => ({ value: role, label: role }));
  }

  get statusOptions(): { value: string; label: string }[] {
    return [
      { value: '', label: 'All Status' },
      { value: 'Accepted', label: 'Accepted' },
      { value: 'Pending', label: 'Pending' },
      { value: 'Expired', label: 'Expired' },
    ];
  }

  get filteredUsers(): User[] {
    const q = this.searchQuery.trim().toLowerCase();
    return this.users.filter(u => {
      const matchesQuery = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.roles || []).some(r => r.toLowerCase().includes(q));
      const matchesRole = !this.filterRole || (u.roles || []).includes(this.filterRole);
      const matchesStatus = !this.filterStatus || u.invite === this.filterStatus;
      return matchesQuery && matchesRole && matchesStatus;
    });
  }

  get paginatedUsers(): User[] {
    const start = this.currentPage * this.pageSize;
    return this.filteredUsers.slice(start, start + this.pageSize);
  }

  get totalFilteredElements(): number {
    return this.filteredUsers.length;
  }

  get totalFilteredPages(): number {
    return Math.max(1, Math.ceil(this.totalFilteredElements / this.pageSize));
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.loadUsers();
  }

  activities: ActivityItem[] = [];
  activitiesLoading = false;
  activitiesSearch = '';

  roles: Role[] = [];
  rolesLoading = false;
  rolesSearchQuery = '';
  private rolesSearchDebounce: any;
  rolesCurrentPage = 0;
  rolesPageSize = 10;
  rolesTotal = 0;
  rolesTotalPages = 0;
  roleFeedback: { type: 'success' | 'error'; text: string } | null = null;

  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;
  meta: PageMeta | null = null;

  readonly tabs = [
    { label: 'Users' },
    { label: 'Roles' },
    { label: 'Permissions' },
    // { label: 'Activity' },
  ];

  // ---------- Permissions ----------
  readonly permissionIcons: Record<string, string> = {
    eye:    '<path stroke-linecap="round" stroke-linejoin="round" d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
    plus:   '<rect x="4" y="4" width="16" height="16" rx="2"/><path stroke-linecap="round" d="M12 8.5v7M8.5 12h7"/>',
    pencil: '<path stroke-linecap="round" stroke-linejoin="round" d="M16.5 4.5 19.5 7.5 8.5 18.5 4.5 19.5 5.5 15.5z"/>',
    trash:  '<path stroke-linecap="round" stroke-linejoin="round" d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m3 0-1 13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 7"/><path stroke-linecap="round" d="M10 11v6M14 11v6"/>',
    chat:   '<path stroke-linecap="round" stroke-linejoin="round" d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5z"/>',
    clip:   '<path stroke-linecap="round" stroke-linejoin="round" d="m17 7-7.5 7.5a2.1 2.1 0 0 0 3 3L20 10a4.2 4.2 0 0 0-6-6L6.5 11.5a6.4 6.4 0 0 0 9 9L21 15"/>',
    review: '<rect x="4" y="4" width="16" height="16" rx="2"/><path stroke-linecap="round" stroke-linejoin="round" d="m13 8 3 3-6 6H7v-3z"/>',
    check:  '<rect x="4" y="4" width="16" height="16" rx="2"/><path stroke-linecap="round" stroke-linejoin="round" d="m8.5 12.2 2.4 2.4 4.6-5"/>',
    up:     '<rect x="4" y="4" width="16" height="16" rx="2"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 16V8m0 0-3.5 3.5M12 8l3.5 3.5"/>',
    refresh:'<rect x="4" y="4" width="16" height="16" rx="2"/><path stroke-linecap="round" stroke-linejoin="round" d="M8.5 12a3.5 3.5 0 0 1 6.4-2M15.5 12a3.5 3.5 0 0 1-6.4 2"/><path stroke-linecap="round" d="M15 7.5V10h-2.5M9 16.5V14h2.5"/>',
    doc:    '<rect x="4" y="4" width="16" height="16" rx="2"/><path stroke-linecap="round" d="M8 9h8M8 12.5h8M8 16h5"/>',
    export: '<rect x="4" y="4" width="16" height="16" rx="2"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 15V8m0 0-3 3m3-3 3 3"/><path stroke-linecap="round" d="M8 16h8"/>',
    clock:  '<circle cx="12" cy="12" r="8"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l2.5 1.5"/>',
    user:   '<circle cx="12" cy="9" r="3.5"/><path stroke-linecap="round" d="M5.5 19.5a6.5 6.5 0 0 1 13 0"/>',
    userplus:'<circle cx="10" cy="9" r="3.5"/><path stroke-linecap="round" d="M4 19.5a6 6 0 0 1 12 0"/><path stroke-linecap="round" d="M17.5 8.5h4M19.5 6.5v4"/>',
    key:    '<circle cx="8.5" cy="14.5" r="3.5"/><path stroke-linecap="round" stroke-linejoin="round" d="m11 12 8-8m-3 3 3 3"/>',
  };

  readonly moduleStyles: Record<string, string> = {
    'Reports & Export': 'bg-orange-50 text-orange-600',
    'User Management':  'bg-success-50 text-success-600',
    'Workflow':         'bg-warning-50 text-warning-600',
    'Administration':   'bg-purple-50 text-purple-600',
    'Client Management': 'bg-blue-50 text-blue-600',
    'Key Management':   'bg-amber-50 text-amber-600',
    'Site Management':  'bg-emerald-50 text-emerald-600',
  };

  seedPermissionGroups: PermissionGroup[] = [
    {
      name: 'Reports & Export',
      rows: [
        { icon: 'doc',    name: 'View Reports',        module: 'Reports & Export', category: 'Reports', type: 'System', status: 'Active', description: 'Allows users to view system reports.' },
        { icon: 'export', name: 'Export Reports',      module: 'Reports & Export', category: 'Reports', type: 'System', status: 'Active', description: 'Allows users to export reports in PDF/Excel.' },
        { icon: 'clock',  name: 'Schedule Reports',    module: 'Reports & Export', category: 'Reports', type: 'System', status: 'Active', description: 'Allows users to schedule reports.' },
        { icon: 'doc',    name: 'View Report History', module: 'Reports & Export', category: 'Reports', type: 'System', status: 'Active', description: 'Allows users to view exported report history.' },
        { icon: 'trash',  name: 'Delete Report',       module: 'Reports & Export', category: 'Reports', type: 'System', status: 'Active', description: 'Allows users to delete exported reports.' },
      ],
    },
    {
      name: 'User Management',
      rows: [
        { icon: 'eye',      name: 'View Users',      module: 'User Management', category: 'Users', type: 'System', status: 'Active', description: 'Allows users to view users.' },
        { icon: 'userplus', name: 'Create User',     module: 'User Management', category: 'Users', type: 'System', status: 'Active', description: 'Allows users to create new users.' },
        { icon: 'pencil',   name: 'Edit User',       module: 'User Management', category: 'Users', type: 'System', status: 'Active', description: 'Allows users to edit user details.' },
        { icon: 'user',     name: 'Assign Roles',    module: 'User Management', category: 'Users', type: 'System', status: 'Active', description: 'Allows users to assign roles to users.' },
        { icon: 'key',      name: 'Reset Password',  module: 'User Management', category: 'Users', type: 'System', status: 'Active', description: 'Allows users to reset user passwords.' },
        { icon: 'trash',    name: 'Deactivate User', module: 'User Management', category: 'Users', type: 'System', status: 'Active', description: 'Allows users to deactivate user accounts.' },
      ],
    },
  ];

  permissionGroups: PermissionGroup[] = [];
  permissionLoading = false;
  permissionsSearchQuery = '';
  permissionFilters = { module: 'All', category: 'All', type: 'All', status: 'All' };
  collapsedGroups = new Set<number>();

  get permissionModules(): string[] {
    return ['All', ...Array.from(new Set(this.permissionGroups.flatMap(g => g.rows.map(r => r.module))))];
  }
  get permissionCategories(): string[] {
    return ['All', ...Array.from(new Set(this.permissionGroups.flatMap(g => g.rows.map(r => r.category))))];
  }
  get permissionTypes(): string[] {
    return ['All', ...Array.from(new Set(this.permissionGroups.flatMap(g => g.rows.map(r => r.type))))];
  }
  get permissionStatuses(): string[] {
    return ['All', ...Array.from(new Set(this.permissionGroups.flatMap(g => g.rows.map(r => r.status))))];
  }

  get permissionModuleOptions(): RichSelectOption[] {
    return this.permissionModules.map(m => ({ value: m, label: m === 'All' ? 'All Modules' : m }));
  }
  get permissionCategoryOptions(): RichSelectOption[] {
    return this.permissionCategories.map(c => ({ value: c, label: c === 'All' ? 'All Categories' : c }));
  }
  get permissionTypeOptions(): RichSelectOption[] {
    return this.permissionTypes.map(t => ({ value: t, label: t === 'All' ? 'All Types' : t }));
  }
  get permissionStatusOptions(): RichSelectOption[] {
    return this.permissionStatuses.map(s => ({ value: s, label: s === 'All' ? 'All Statuses' : s }));
  }

  get filteredPermissionGroups(): PermissionGroup[] {
    const q = this.permissionsSearchQuery.trim().toLowerCase();
    const f = this.permissionFilters;
    return this.permissionGroups
      .map(g => ({
        name: g.name,
        rows: g.rows.filter(r =>
          (!q || r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)) &&
          (f.module === 'All' || r.module === f.module) &&
          (f.category === 'All' || r.category === f.category) &&
          (f.type === 'All' || r.type === f.type) &&
          (f.status === 'All' || r.status === f.status)
        ),
      }))
      .filter(g => g.rows.length > 0);
  }

  get permissionView(): Array<{ kind: 'header'; index: number; name: string; count: number } | { kind: 'row'; row: PermissionRow }> {
    const out: Array<{ kind: 'header'; index: number; name: string; count: number } | { kind: 'row'; row: PermissionRow }> = [];
    this.filteredPermissionGroups.forEach((g, index) => {
      out.push({ kind: 'header', index, name: g.name, count: g.rows.length });
      if (!this.collapsedGroups.has(index)) {
        g.rows.forEach(row => out.push({ kind: 'row', row }));
      }
    });
    return out;
  }

  togglePermissionGroup(index: number): void {
    if (this.collapsedGroups.has(index)) {
      this.collapsedGroups.delete(index);
    } else {
      this.collapsedGroups.add(index);
    }
  }

  onPermissionSearch(): void {
    this.collapsedGroups.clear();
  }

  resetPermissionFilters(): void {
    this.permissionsSearchQuery = '';
    this.permissionFilters = { module: 'All', category: 'All', type: 'All', status: 'All' };
    this.collapsedGroups.clear();
  }

  loadPermissions(): void {
    const orgId = this.getOrgId();
    if (!orgId) {
      this.permissionGroups = this.seedPermissionGroups;
      return;
    }

    this.permissionLoading = true;
    this.errorMessage = '';
    this.keyVault.listPermissionsGrouped(orgId).subscribe({
      next: (res: any) => {
        const payload = res?.data ?? res;
        const mapped = this.mapGroupedPermissions(payload);
        this.permissionGroups = mapped;
        this.permissionLoading = false;
      },
      error: () => {
        this.permissionGroups = [];
        this.permissionLoading = false;
      },
    });
  }

  private mapGroupedPermissions(data: any): PermissionGroup[] {
    if (!Array.isArray(data)) return [];
    return data.map((g: any) => ({
      name: g.group || 'Ungrouped',
      rows: Array.isArray(g.permissions) ? g.permissions.map((p: any) => this.mapPermission(p, g.group)) : [],
    }));
  }

  private mapPermission(p: any, group: string): PermissionRow {
    const code = (p.code || '').toLowerCase();
    const name = p.name || p.code || 'Unnamed permission';
    const haystack = `${code} ${name} ${(p.description || '').toLowerCase()}`;
    return {
      icon: this.derivePermissionIcon(haystack),
      name,
      module: p.module || this.deriveModule(group),
      category: p.category || this.deriveCategory(haystack),
      type: p.type || 'System',
      status: p.status || (p.active === false ? 'Inactive' : 'Active'),
      description: p.description || 'No description provided.',
    };
  }

  private derivePermissionIcon(haystack: string): string {
    if (haystack.includes('comment')) return 'chat';
    if (haystack.includes('attachment')) return 'clip';
    if (haystack.includes('review')) return 'review';
    if (haystack.includes('approve')) return 'check';
    if (haystack.includes('escalat')) return 'up';
    if (haystack.includes('export')) return 'export';
    if (haystack.includes('report')) return 'doc';
    if (haystack.includes('schedule')) return 'clock';
    if (haystack.includes('invite')) return 'userplus';
    if (haystack.includes('reset') || haystack.includes('password')) return 'key';
    if (haystack.includes('assign') || haystack.includes('role')) return 'user';
    if (haystack.includes('create') || haystack.includes('add')) return 'plus';
    if (haystack.includes('edit') || haystack.includes('update')) return 'pencil';
    if (haystack.includes('delete') || haystack.includes('remove') || haystack.includes('deactivat')) return 'trash';
    if (haystack.includes('view') || haystack.includes('read')) return 'eye';
    return 'key';
  }

  private deriveModule(group: string): string {
    const g = group.toLowerCase();
    if (g.includes('report')) return 'Reports & Export';
    if (g.includes('user')) return 'User Management';
    return group;
  }

  private deriveCategory(haystack: string): string {
    if (haystack.includes('comment') || haystack.includes('collaborat')) return 'Collaboration';
    if (haystack.includes('approval') || haystack.includes('review') || haystack.includes('approve')) return 'Approval';
    if (haystack.includes('escalat')) return 'Escalation';
    if (haystack.includes('report')) return 'Reports';
    if (haystack.includes('user')) return 'Users';
    return 'General';
  }

  readonly roleStyles: Record<string, string> = {
    Supervisor: 'bg-blue-50 text-blue-700',
    'Security Officer': 'bg-purple-50 text-purple-700',
    'Patrol Officer': 'bg-sky-50 text-sky-700',
    Reviewer: 'bg-orange-50 text-orange-700',
    Administrator: 'bg-red-50 text-red-700',
  };

  readonly statusStyles: Record<string, string> = {
    Active: 'bg-green-50 text-green-700',
    Inactive: 'bg-slate-100 text-slate-600',
  };

  readonly invitationStyles: Record<string, { icon: string; color: string }> = {
    Accepted: { icon: 'ti-circle-check', color: 'text-green-600' },
    Pending: { icon: 'ti-clock', color: 'text-orange-500' },
    Expired: { icon: 'ti-alert-circle', color: 'text-red-500' },
    'Not Invited': { icon: 'ti-circle-minus', color: 'text-slate-400' },
  };

  constructor(private userService: UserService, private keyVault: KeyVaultService, private router: Router, private sanitizer: DomSanitizer, private permissionService: PermissionService, private authService: AuthService, private route: ActivatedRoute) {}

  get canAddUser(): boolean {
    return this.permissionService.hasPermission('admin.users.manage');
  }

  get canAddRole(): boolean {
    return this.permissionService.hasPermission('admin.roles.manage');
  }

  permIcon(name: string): SafeHtml {
    const inner = this.permissionIcons[name] || '';
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.7" viewBox="0 0 24 24" style="display:block">${inner}</svg>`
    );
  }

  ngOnInit(): void {
    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab !== null) {
      const parsed = parseInt(tab, 10);
      if (parsed === 1 || parsed === 2) {
        this.activeTab = parsed;
        if (parsed === 1) this.loadRoles();
        else if (parsed === 2) this.loadPermissions();
      }
    }
    this.route.queryParams.subscribe(params => {
      const tab = params['tab'];
      if (tab !== null) {
        const parsed = parseInt(tab, 10);
        if (parsed === 1 || parsed === 2) {
          this.activeTab = parsed;
          if (parsed === 1) this.loadRoles();
          else if (parsed === 2) this.loadPermissions();
        }
      }
    });
    this.authService.getUserId().subscribe({
      next: (id) => (this.currentUserId = id),
      error: () => (this.currentUserId = null),
    });
    this.loadRoles();
    this.loadUsers();
  }

  setActiveTab(index: number): void {
    this.activeTab = index;
    if (index === 1) {
      this.loadRoles();
    } else if (index === 2) {
      this.loadPermissions();
    }
  }

  getOrgId(): string | null {
    const remember = localStorage.getItem('remember_device');
    if (remember === 'true') {
      return localStorage.getItem('org_id') || localStorage.getItem('organizationId') || null;
    }
    return sessionStorage.getItem('org_id') || sessionStorage.getItem('organizationId') || localStorage.getItem('org_id') || localStorage.getItem('organizationId') || null;
  }

  loadUsers(): void {
    this.loading = true;
    this.errorMessage = '';
    const orgId = this.getOrgId();
    if (!orgId) {
      this.loading = false;
      this.errorMessage = 'No organization selected yet.';
      return;
    }

    const hasFilters = !!(this.searchQuery.trim() || this.filterRole || this.filterStatus);
    const size = hasFilters ? 200 : this.pageSize;

    this.keyVault.listKeyVaultUsers(orgId, { page: 0, size, q: this.searchQuery.trim() || undefined }).subscribe({
      next: (res) => {
        const payload = res?.['data'] ?? res;
        const items = Array.isArray(payload) ? payload : payload?.content ?? payload?.items ?? payload?.data ?? [];
        this.users = items.map((item: any, index: number) => ({
          id: item.userId || item.id,
          name: [item.firstName, item.lastName].filter(Boolean).join(' ') || item.name || item.email || 'Unknown',
          email: item.email || '-',
          roles: this.resolveRoleNames(item.roleIds || []),
          status: (item.status || '').toLowerCase() === 'inactive' ? 'Inactive' : 'Active',
          invite: item.invitationStatus || 'Not Invited',
          inviteSub: item.grantedAt ? new Date(item.grantedAt).toLocaleString() : '-',
          lastLogin: '-',
          lastTime: '-',
          created: '-',
          img: (index % 37) + 1,
          resend: false,
          department: item.department || ['Operations', 'Security', 'Compliance', 'HR'][index % 4],
          phone: item.phoneNumber || ['+91 98765 43210', '+91 98765 12345', '+91 99456 12345', '+91 99876 00000'][index % 4],
          location: item.location || ['Head Office', 'North Gate', 'Control Room', 'Central Hub'][index % 4],
          employeeId: item.employeeId || `EMP-${String(12 + index).padStart(5, '0')}`,
          joined: item.grantedAt ? new Date(item.grantedAt).toLocaleString() : '-',
        }));

        this.totalElements = this.users.length;
        this.totalPages = Math.max(1, Math.ceil(this.users.length / this.pageSize));
        this.currentPage = Math.min(this.currentPage, this.totalPages - 1);

        this.selectedUser = this.selectedUser && this.users.some(user => user.email === this.selectedUser?.email)
          ? this.selectedUser
          : null;
        if (!this.selectedUser) {
          this.showDetail = false;
        }
        this.loading = false;
        this.loadStats();
      },
      error: () => {
        this.loading = false;
        this.loadStats();
        this.errorMessage = 'Unable to load users right now.';
      },
    });
  }

  loadStats(): void {
    const total = this.users.length;
    const active = this.users.filter(u => u.status === 'Active').length;
    const inactive = total - active;
    this.stats = {
      total,
      totalUsers: total,
      active,
      activeUsers: active,
      inactive,
      inactiveUsers: inactive,
    };
  }

  loadRoles(): void {
    const orgId = this.getOrgId();
    if (!orgId) return;

    this.rolesLoading = true;
    this.errorMessage = '';
    this.keyVault.listRoles(orgId).subscribe({
      next: (data: any) => {
        const payload = data?.data ?? data;
        this.roles = Array.isArray(payload) ? payload : [];
        this.rolesTotal = this.roles.length;
        this.rolesLoading = false;
      },
      error: () => {
        this.roles = [];
        this.rolesLoading = false;
      },
    });
  }

  private setRoleFeedback(type: 'success' | 'error', text: string): void {
    this.roleFeedback = { type, text };
    setTimeout(() => {
      if (this.roleFeedback?.text === text) this.roleFeedback = null;
    }, 4000);
  }

  onRoleDeactivate(role: Role): void {
    this.router.navigate(['/roles/deactivate-role'], { queryParams: { id: role.id } });
  }

  onRoleReactivate(role: Role): void {
    this.router.navigate(['/roles/reactivate-role'], { queryParams: { id: role.id } });
  }

  onRoleDelete(role: Role): void {
    this.router.navigate(['/roles/delete-role'], { queryParams: { id: role.id } });
  }

  onRolesSearch(): void {
    if (this.rolesSearchDebounce) clearTimeout(this.rolesSearchDebounce);
    this.rolesSearchDebounce = setTimeout(() => {
      this.rolesCurrentPage = 0;
      this.loadRoles();
    }, 400);
  }

  onRolesPageChange(page: number): void {
    this.rolesCurrentPage = page;
    this.loadRoles();
  }

  onSearch(): void {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.currentPage = 0;
      this.loadUsers();
    }, 400);
  }

  onPageSizeChange(): void {
    this.currentPage = 0;
    this.loadUsers();
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.loadUsers();
  }

  get startIndex(): number {
    if (this.totalElements === 0) return 0;
    return this.currentPage * this.pageSize + 1;
  }

  get endIndex(): number {
    if (this.totalElements === 0) return 0;
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
  }

  get pageNumbers(): (number | '...')[] {
    const pages: (number | '...')[] = [];
    const total = this.totalPages;
    const current = this.currentPage;

    if (total <= 9) {
      for (let i = 0; i < total; i++) pages.push(i);
      return pages;
    }

    pages.push(0);

    let start: number;
    let end: number;

    if (current <= 2) {
      start = 1;
      end = 4;
    } else if (current >= total - 3) {
      start = total - 5;
      end = total - 2;
    } else {
      start = current - 2;
      end = current + 2;
    }

    if (start > 1) {
      pages.push('...');
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < total - 2) {
      pages.push('...');
    }

    pages.push(total - 1);
    return pages;
  }

  get rolesShowingText(): string {
    const start = this.rolesCurrentPage * this.rolesPageSize + 1;
    const end = Math.min((this.rolesCurrentPage + 1) * this.rolesPageSize, this.rolesTotal);
    return `Showing ${start} to ${end} of ${this.rolesTotal} roles`;
  }

  get tableUsers(): TableUser[] {
    return this.users.map((u) => ({
      id: u.id || '',
      name: u.name,
      email: u.email,
      roles: u.roles,
      status: u.status,
      lastLogin: u.lastLogin,
      created: u.created,
      img: u.img,
      raw: u,
    }));
  }

  get showingText(): string {
    if (this.totalElements === 0) return 'Showing 0 users';
    const start = this.startIndex;
    const end = this.endIndex;
    return `Showing ${start} to ${end} of ${this.totalElements} users`;
  }

  onTableRowClick(user: User): void {
    this.router.navigate(['/users/view-user', user.id]);
  }

  viewUser(user: User): void {
    this.router.navigate(['/users/view-user', user.id]);
  }

  deleteUser(user: User): void {
    if (!user.id) return;
    if (!confirm(`Are you sure you want to deactivate ${user.name}?`)) return;
    const orgId = this.getOrgId();
    if (!orgId) return;
    this.userService.deactivateUser(orgId, user.id).subscribe({
      next: () => {
        this.users = this.users.map(u => u.id === user.id ? { ...u, status: 'Inactive' } : u);
        if (this.selectedUser?.id === user.id) {
          this.selectedUser = { ...this.selectedUser, status: 'Inactive' } as User;
        }
      },
      error: () => {
        this.errorMessage = 'Failed to deactivate user.';
      }
    });
  }

  onTablePageChange(page: number): void {
    this.goToPage(page);
  }

  onTableSearch(value: string): void {
    this.searchQuery = value;
    this.onSearch();
  }

  get detailName(): string {
    if (!this.detailUser) return this.selectedUser?.name || '';
    return [this.detailUser.firstName, this.detailUser.lastName].filter(Boolean).join(' ') || this.detailUser.name || this.selectedUser?.name || '';
  }

  get detailEmail(): string {
    return this.detailUser?.email || this.selectedUser?.email || '';
  }

  get detailRole(): string {
    const roles = this.detailUser?.roles || this.selectedUser?.roles || [];
    return (roles[0]?.name || roles[0] || 'Member');
  }

  get detailStatus(): string {
    const s = this.detailUser?.status || this.selectedUser?.status || 'Active';
    return s.toLowerCase() === 'inactive' ? 'Inactive' : 'Active';
  }

  get detailPhone(): string {
    return this.detailUser?.phoneNumber || this.selectedUser?.phone || '';
  }

  get detailDepartment(): string {
    return this.detailUser?.department || this.selectedUser?.department || '';
  }

  get detailLocation(): string {
    return this.detailUser?.location || this.selectedUser?.location || '';
  }

  get detailEmployeeId(): string {
    return this.detailUser?.employeeId || this.selectedUser?.employeeId || '';
  }

  get detailJoined(): string {
    if (this.detailUser?.createdAt) return new Date(this.detailUser.createdAt).toLocaleString();
    return this.selectedUser?.joined || this.selectedUser?.created || '';
  }

  get detailLastLogin(): string {
    if (this.detailUser?.lastLoginAt) return new Date(this.detailUser.lastLoginAt).toLocaleString();
    return this.selectedUser?.lastLogin || '';
  }

  selectUser(user: User): void {
    if (this.selectedUser?.id === user.id && this.showDetail) {
      this.showDetail = false;
      return;
    }

    this.selectedUser = user;
    this.showDetail = true;
    this.loadUserDetail(user);
    this.loadActivities(user.id);
  }

  private loadUserDetail(user: User): void {
    if (!user.id) return;
    this.loadingDetail = true;
    this.detailUser = null;

    const orgId = this.getOrgId();
    if (!orgId) {
      this.loadingDetail = false;
      this.detailUser = user;
      return;
    }

    this.userService.getUserDetail(orgId, user.id).subscribe({
      next: (res) => {
        this.detailUser = res;
        this.loadingDetail = false;
      },
      error: () => {
        this.loadingDetail = false;
        this.detailUser = user;
      }
    });
  }

  closeDetail(): void {
    this.showDetail = false;
  }

  openInviteModal(): void {
    this.showInviteModal = true;
  }

  closeInviteModal(): void {
    this.showInviteModal = false;
  }

  onInviteSent(): void {
    this.showInviteModal = false;
    if (this.selectedUser) {
      this.selectedUser = { ...this.selectedUser, invite: 'Pending', inviteSub: new Date().toLocaleString() } as User;
    }
  }

  editUser(): void {
    if (!this.selectedUser?.id) return;
    this.router.navigate(['/users/add-user'], { queryParams: { id: this.selectedUser.id } });
  }

  onRoleRowClick(role: Role): void {
    this.router.navigate(['/roles/view-role'], { queryParams: { id: role.id } });
  }

  openDeactivateModal(): void {
    this.showDeactivateModal = true;
  }

  closeDeactivateModal(): void {
    this.showDeactivateModal = false;
  }

  onUserDeactivated(): void {
    this.showDeactivateModal = false;
    if (this.selectedUser) {
      this.selectedUser = { ...this.selectedUser, status: 'Inactive' } as User;
    }
    if (this.detailUser) {
      this.detailUser = { ...this.detailUser, status: 'Inactive' };
    }
    this.loadUsers();
  }

  openReactivateModal(): void {
    this.showReactivateModal = true;
  }

  closeReactivateModal(): void {
    this.showReactivateModal = false;
  }

  onUserReactivated(): void {
    this.showReactivateModal = false;
    if (this.selectedUser) {
      this.selectedUser = { ...this.selectedUser, status: 'Active' } as User;
    }
    if (this.detailUser) {
      this.detailUser = { ...this.detailUser, status: 'Active' };
    }
    this.loadUsers();
  }

  onResendCredentials(user: TableUser): void {
    this.resendTargetUser = user;
    this.showResendModal = true;
  }

  closeResendModal(): void {
    this.showResendModal = false;
    this.resendTargetUser = null;
  }

  onCredentialsResent(): void {
    this.showResendModal = false;
    this.resendTargetUser = null;
  }

  loadActivities(userId?: string): void {
    const id = userId || this.selectedUser?.id;
    if (!id) return;
    const orgId = this.getOrgId();
    if (!orgId) return;
    this.activitiesLoading = true;
    this.keyVault.listEntityAuditLog(orgId, 'USER', id, { page: 0, size: 50 }).subscribe({
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

  private resolveRoleNames(roleIds: string[]): string[] {
    if (!roleIds.length) return [];
    return roleIds
      .map(id => this.roles.find(r => String(r.id) === String(id))?.name)
      .filter((name): name is string => !!name);
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
}
