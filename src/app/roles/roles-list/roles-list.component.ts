import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { KeyVaultService } from '../../core/services/keyvault.service';
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

@Component({
  selector: 'app-roles-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './roles-list.component.html',
  styles: ``
})
export class RolesListComponent implements OnInit {
  roles: Role[] = [];
  loading = false;
  errorMessage = '';
  searchQuery = '';
  filterStatus = '';

  totalRoles = 0;
  activeRoles = 0;
  inactiveRoles = 0;

  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  constructor(
    private keyVault: KeyVaultService,
    private router: Router,
    private permissionService: PermissionService
  ) {}

  get canManageRoles(): boolean {
    return this.permissionService.hasPermission('admin.roles.manage');
  }

  ngOnInit(): void {
    this.loadRoles();
    this.loadStats();
  }

  private getOrgId(): string | null {
    const remember = localStorage.getItem('remember_device');
    if (remember === 'true') {
      return localStorage.getItem('org_id') || localStorage.getItem('organizationId') || null;
    }
    return sessionStorage.getItem('org_id') || sessionStorage.getItem('organizationId') || localStorage.getItem('org_id') || localStorage.getItem('organizationId') || null;
  }

  loadRoles(): void {
    this.loading = true;
    this.errorMessage = '';
    const orgId = this.getOrgId();
    if (!orgId) {
      this.loading = false;
      this.errorMessage = 'Organization not found.';
      return;
    }

    this.keyVault.listRoles(orgId).subscribe({
      next: (data: any) => {
        const payload = data?.data ?? data;
        let roles: Role[] = [];
        if (Array.isArray(payload)) {
          roles = payload;
        } else if (payload && typeof payload === 'object') {
          roles = payload.roles ?? payload.items ?? payload.content ?? [];
        }
        this.roles = roles;
        this.totalRoles = roles.length;
        this.activeRoles = roles.filter(r => r.active).length;
        this.inactiveRoles = roles.filter(r => !r.active).length;
        this.totalPages = Math.ceil(roles.length / this.pageSize) || 1;
        this.loading = false;
      },
      error: () => {
        this.roles = [];
        this.loading = false;
        this.errorMessage = 'Failed to load roles.';
      }
    });
  }

  loadStats(): void {
    const orgId = this.getOrgId();
    if (!orgId) return;

    this.keyVault.getRoleStats(orgId).subscribe({
      next: (data: any) => {
        const stats = data?.data ?? data;
        if (stats) {
          this.totalRoles = stats.total ?? this.totalRoles;
          this.activeRoles = stats.active ?? this.activeRoles;
          this.inactiveRoles = stats.inactive ?? this.inactiveRoles;
        }
      },
      error: () => {}
    });
  }

  get filteredRoles(): Role[] {
    let filtered = this.roles;

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.name?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
      );
    }

    if (this.filterStatus === 'active') {
      filtered = filtered.filter(r => r.active);
    } else if (this.filterStatus === 'inactive') {
      filtered = filtered.filter(r => !r.active);
    }

    return filtered;
  }

  get paginatedRoles(): Role[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredRoles.slice(start, start + this.pageSize);
  }

  onSearch(): void {
    this.currentPage = 1;
    this.totalPages = Math.ceil(this.filteredRoles.length / this.pageSize) || 1;
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.totalPages = Math.ceil(this.filteredRoles.length / this.pageSize) || 1;
  }

  viewRole(role: Role): void {
    this.router.navigate(['/roles/view-role'], { queryParams: { id: role.id } });
  }

  editRole(role: Role): void {
    this.router.navigate(['/roles/add-role'], { queryParams: { id: role.id } });
  }

  deactivateRole(role: Role): void {
    this.router.navigate(['/roles/deactivate-role'], { queryParams: { id: role.id } });
  }

  reactivateRole(role: Role): void {
    this.router.navigate(['/roles/reactivate-role'], { queryParams: { id: role.id } });
  }

  deleteRole(role: Role): void {
    this.router.navigate(['/roles/delete-role'], { queryParams: { id: role.id } });
  }

  getRoleColor(index: number): string {
    const colors = ['bg-brand-100 text-brand-600', 'bg-emerald-50 text-emerald-500', 'bg-orange-50 text-orange-500', 'bg-violet-100 text-violet-600', 'bg-rose-50 text-rose-500', 'bg-sky-50 text-sky-500'];
    return colors[index % colors.length];
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  }
}
