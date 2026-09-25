import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
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

interface CreateRoleRequest {
  code: string;
  name: string;
  description?: string;
  color?: string;
  permissions: string[];
  active?: boolean;
}

interface UpdateRoleRequest {
  code?: string;
  name?: string;
  description?: string;
  color?: string;
  permissions?: string[];
  active?: boolean;
}

interface Permission {
  key: string;
  name: string;
  description: string;
  checked: boolean;
  expanded: boolean;
}

interface PermissionGroup {
  title: string;
  permissions: Permission[];
  open?: boolean;
}

@Component({
  selector: 'app-add-role',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './add-role.component.html',
  styles: ``,
})
export class AddRoleComponent implements OnInit {
  roleName = '';
  roleDesc = '';
  status: 'active' | 'inactive' = 'active';
  search = '';
  isEditMode = false;
  roleId: string | null = null;
  saving = false;
  errorMessage = '';
  permissionsError = '';

  readonly maxNameLength = 100;
  readonly maxDescLength = 300;

  // Validation state
  nameTouched = false;
  descTouched = false;
  nameError = '';
  descError = '';
  permissionsTouched = false;

  groups: PermissionGroup[] = [];

  @ViewChild('roleNameInput') roleNameInput!: ElementRef<HTMLInputElement>;
  @ViewChild('roleDescInput') roleDescInput!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('permissionsSection') permissionsSection!: ElementRef<HTMLElement>;

  constructor(private keyVault: KeyVaultService, private router: Router, private route: ActivatedRoute, private permissionService: PermissionService) {}

  get canSaveRole(): boolean {
    return this.permissionService.hasPermission('admin.roles.manage');
  }

  ngOnInit(): void {
    this.roleId = this.route.snapshot.queryParamMap.get('id');
    this.isEditMode = !!this.roleId;

    if (this.isEditMode && this.roleId) {
      this.loadPermissionsAndRole();
    } else {
      this.loadPermissions();
    }
  }

  private loadPermissionsAndRole(): void {
    const orgId = this.getOrgId();
    if (!orgId) return;

    this.keyVault.listPermissions(orgId).subscribe({
      next: (res: any) => {
        const perms = res?.data ?? res;
        this.groups = this.groupPermissions(perms);
        this.loadRole(this.roleId!);
      },
      error: () => {
        this.groups = this.defaultGroups();
        this.loadRole(this.roleId!);
      }
    });
  }

  private loadRole(id: string): void {
    const orgId = this.getOrgId();
    if (!orgId) return;

    this.keyVault.getRole(orgId, id).subscribe({
      next: (res: any) => {
        const role = res?.data ?? res;
        this.roleName = role.name || '';
        this.roleDesc = role.description || '';
        this.status = role.active ? 'active' : 'inactive';

        const granted = new Set<string>(role.permissions || []);
        this.groups = this.groups.map(group => ({
          ...group,
          permissions: group.permissions.map(perm => ({
            ...perm,
            checked: granted.has(perm.key),
          })),
        }));
      },
      error: () => {
        this.errorMessage = 'Failed to load role details.';
      }
    });
  }

  private loadPermissions(): void {
    const orgId = this.getOrgId();
    if (!orgId) return;

    this.keyVault.listPermissions(orgId).subscribe({
      next: (res: any) => {
        const perms = res?.data ?? res;
        this.groups = this.groupPermissions(perms);
      },
      error: () => {
        this.groups = this.defaultGroups();
      }
    });
  }

  private groupPermissions(perms: any[]): PermissionGroup[] {
    const map = new Map<string, Permission[]>();
    for (const p of perms) {
      const group = p.group || 'Other';
      if (!map.has(group)) map.set(group, []);
      map.get(group)!.push({
        key: p.code || p.id || '',
        name: p.name || '',
        description: p.description || '',
        checked: false,
        expanded: false,
      });
    }
    return Array.from(map.entries()).map(([title, permissions]) => ({ title, permissions, open: true }));
  }

  private defaultGroups(): PermissionGroup[] {
    return [
      {
        title: 'Reports & Export',
        open: true,
        permissions: [
          { key: 'report.view', name: 'View Reports', description: 'View system reports.', checked: false, expanded: false },
          { key: 'report.export', name: 'Export Data', description: 'Export reports and data to file.', checked: false, expanded: false },
        ],
      },
    ];
  }

  private getOrgId(): string | null {
    const remember = localStorage.getItem('remember_device');
    if (remember === 'true') {
      return localStorage.getItem('org_id') || localStorage.getItem('organizationId') || null;
    }
    return sessionStorage.getItem('org_id') || sessionStorage.getItem('organizationId') || localStorage.getItem('org_id') || localStorage.getItem('organizationId') || null;
  }

  matches(permission: Permission): boolean {
    const q = this.search.trim().toLowerCase();
    if (!q) return true;
    return permission.name.toLowerCase().includes(q);
  }

  groupVisible(group: PermissionGroup): boolean {
    return group.permissions.some((p) => this.matches(p));
  }

  get hasResults(): boolean {
    return this.groups.some((g) => this.groupVisible(g));
  }

  toggleExpand(permission: Permission, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    permission.expanded = !permission.expanded;
  }

  get selectedPermissions(): string[] {
    return this.groups.flatMap((g) => g.permissions.filter((p) => p.checked).map((p) => p.key));
  }

  // Validation methods
  validateName(): boolean {
    this.nameTouched = true;
    if (!this.roleName.trim()) {
      this.nameError = 'Role name is required.';
      return false;
    }
    if (this.roleName.trim().length > this.maxNameLength) {
      this.nameError = `Role name must be ${this.maxNameLength} characters or less.`;
      return false;
    }
    this.nameError = '';
    return true;
  }

  validateDesc(): boolean {
    this.descTouched = true;
    if (!this.roleDesc.trim()) {
      this.descError = 'Description is required.';
      return false;
    }
    if (this.roleDesc.trim().length > this.maxDescLength) {
      this.descError = `Description must be ${this.maxDescLength} characters or less.`;
      return false;
    }
    this.descError = '';
    return true;
  }

  validatePermissions(): boolean {
    this.permissionsTouched = true;
    if (this.selectedPermissions.length === 0) {
      this.permissionsError = 'Please select at least one permission.';
      return false;
    }
    this.permissionsError = '';
    return true;
  }

  validateAll(): boolean {
    const nameValid = this.validateName();
    const descValid = this.validateDesc();
    const permsValid = this.validatePermissions();
    return nameValid && descValid && permsValid;
  }

  focusFirstInvalid(): void {
    if (!this.validateName()) {
      this.roleNameInput?.nativeElement.focus();
      this.roleNameInput?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!this.validateDesc()) {
      this.roleDescInput?.nativeElement.focus();
      this.roleDescInput?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!this.validatePermissions()) {
      this.permissionsSection?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Focus first checkbox
      const firstCheckbox = this.permissionsSection?.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
      firstCheckbox?.focus();
      return;
    }
  }

  onNameBlur(): void {
    this.validateName();
  }

  onDescBlur(): void {
    this.validateDesc();
  }

  cancel(): void {
    this.router.navigate(['/roles']);
  }

  saveRole(): void {
    this.errorMessage = '';
    this.permissionsError = '';

    if (!this.validateAll()) {
      this.focusFirstInvalid();
      return;
    }

    const orgId = this.getOrgId();
    if (!orgId) {
      this.errorMessage = 'Organization not found.';
      return;
    }

    const payload: CreateRoleRequest = {
      code: this.roleName.trim().toUpperCase().replace(/\s+/g, '_'),
      name: this.roleName.trim(),
      description: this.roleDesc.trim() || undefined,
      active: this.status === 'active',
      permissions: this.selectedPermissions,
    };

    this.saving = true;

    if (this.isEditMode && this.roleId) {
      const updatePayload: UpdateRoleRequest = { ...payload };
      this.keyVault.updateRole(orgId, this.roleId, updatePayload).subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/roles']);
        },
        error: () => {
          this.saving = false;
          this.errorMessage = 'Failed to update role.';
        }
      });
    } else {
      this.keyVault.createRole(orgId, payload).subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/roles']);
        },
        error: () => {
          this.saving = false;
          this.errorMessage = 'Failed to create role.';
        }
      });
    }
  }

  get isSaveDisabled(): boolean {
    return !this.canSaveRole || this.saving || !this.roleName.trim() || !this.roleDesc.trim() || this.selectedPermissions.length === 0;
  }
}
