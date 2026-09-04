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
  roleIds: string[];
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

  constructor(private userService: UserService, private keyVault: KeyVaultService, private router: Router, private sanitizer: DomSanitizer, private permissionService: PermissionService, private authService: AuthService, private route: ActivatedRoute) {}

  get canAddUser(): boolean {
    return this.permissionService.hasPermission('admin.users.manage');
  }

  get canAddRole(): boolean {
    return this.permissionService.hasPermission('admin.roles.manage');
  }

  getOrgId(): string | null {
    const remember = localStorage.getItem('remember_device');
    if (remember === 'true') {
      return localStorage.getItem('org_id') || localStorage.getItem('organizationId') || null;
    }
    return sessionStorage.getItem('org_id') || sessionStorage.getItem('organizationId') || localStorage.getItem('org_id') || localStorage.getItem('organizationId') || null;
  }

  ngOnInit(): void {
    this.authService.getUserId().subscribe({
      next: (id) => (this.currentUserId = id),
      error: () => (this.currentUserId = null),
    });
    this.loadRoles();
    this.loadUsers();
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
          roleIds: item.roleIds || [],
          roles: [],
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
        this.resolveUserRoleNames();
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
        this.resolveUserRoleNames();
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
    this.selectedUser = user;
    this.openDeactivateModal();
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

  private resolveUserRoleNames(): void {
    this.users = this.users.map(user => ({
      ...user,
      roles: this.resolveRoleNames(user.roleIds),
    }));
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
