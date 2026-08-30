import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { KeyVaultService } from '../../core/services/keyvault.service';
import { PermissionService } from '../../core/services/permission.service';
import { ServiceUser } from '../../core/models/user.models';

@Component({
  selector: 'app-view-user',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './view-user.component.html',
  styles: ``
})
export class ViewUserComponent implements OnInit {
  loading = true;
  errorMessage = '';
  user: ServiceUser | null = null;
  userId: string | null = null;
  isEditMode = false;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private permissionService: PermissionService
  ) {}

  get canEditUser(): boolean {
    return this.permissionService.hasPermission('admin.users.manage');
  }

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id');
    if (this.userId) {
      this.loadUser(this.userId);
    } else {
      this.loading = false;
      this.errorMessage = 'User not found.';
    }
  }

  private getOrgId(): string | null {
    const remember = localStorage.getItem('remember_device');
    if (remember === 'true') {
      return localStorage.getItem('org_id') || localStorage.getItem('organizationId') || null;
    }
    return sessionStorage.getItem('org_id') || sessionStorage.getItem('organizationId') || localStorage.getItem('org_id') || localStorage.getItem('organizationId') || null;
  }

  private loadUser(id: string): void {
    this.loading = true;
    this.errorMessage = '';
    const orgId = this.getOrgId();
    if (!orgId) {
      this.loading = false;
      this.errorMessage = 'Organization not found.';
      return;
    }

    this.userService.getUserDetail(orgId, id).subscribe({
      next: (user: ServiceUser) => {
        this.user = user;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Failed to load user details.';
      }
    });
  }

  editUser(): void {
    if (!this.user?.id) return;
    this.router.navigate(['/users/add-user'], { queryParams: { id: this.user.id } });
  }

  disableUser(): void {
    if (!this.user?.id) return;
    const orgId = this.getOrgId();
    if (!orgId) return;
    if (!confirm(`Are you sure you want to disable ${this.fullName}?`)) return;

    this.userService.deactivateUser(orgId, this.user.id).subscribe({
      next: () => {
        if (this.user) {
          this.user = { ...this.user, status: 'Inactive' } as any;
        }
      },
      error: () => {
        this.errorMessage = 'Failed to disable user.';
      }
    });
  }

  get fullName(): string {
    if (!this.user) return '';
    return `${this.user.firstName || ''} ${this.user.lastName || ''}`.trim() || this.user.email || 'Unknown';
  }

  get initials(): string {
    if (!this.user) return '?';
    const first = (this.user.firstName || '').charAt(0);
    const last = (this.user.lastName || '').charAt(0);
    return (first + last).toUpperCase() || 'U';
  }

  get statusClass(): string {
    if (!this.user) return 'bg-slate-100 text-slate-600';
    return this.user.status?.toLowerCase() === 'inactive' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-700';
  }

  get statusText(): string {
    if (!this.user) return 'Unknown';
    return this.user.status?.toLowerCase() === 'inactive' ? 'Inactive' : 'Active';
  }

  get roleName(): string {
    if (!this.user) return '—';
    const roles = (this.user as any).roles || [];
    return roles.map((r: any) => r.name).join(', ') || '—';
  }

  get departmentName(): string {
    return (this.user as any).department || '—';
  }

  get phoneNumber(): string {
    return (this.user as any).phoneNumber || '—';
  }

  get employeeId(): string {
    return (this.user as any).employeeId || '—';
  }

  get createdAt(): string {
    if (!this.user?.createdAt) return '—';
    return new Date(this.user.createdAt).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  get createdBy(): string {
    return 'Faiza Ahmed';
  }

  get userType(): string {
    if (!this.user) return '—';
    const types = [];
    if (this.user.canAccessWeb !== false) types.push('Web');
    if (this.user.canAccessMobile !== false) types.push('Mobile');
    if (types.length === 2) types.push('Both');
    return types.join(', ') || '—';
  }

  get lastLogin(): string {
    if (!this.user?.lastLoginAt) return '—';
    return new Date(this.user.lastLoginAt).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  goBack(): void {
    this.router.navigate(['/user-management']);
  }
}
