import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { EdobService } from '../../core/services/edob.service';
import { PermissionService } from '../../core/services/permission.service';
import { Role, CreateRoleRequest, UpdateRoleRequest } from '../../core/models/edob.models';

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

  groups: PermissionGroup[] = [];

  constructor(private edobService: EdobService, private router: Router, private route: ActivatedRoute, private permissionService: PermissionService) {}

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

    this.edobService.listPermissions(orgId).subscribe({
      next: (perms) => {
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

    this.edobService.getRole(orgId, id).subscribe({
      next: (role: any) => {
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

    this.edobService.listPermissions(orgId).subscribe({
      next: (perms) => {
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
    return Array.from(map.entries()).map(([title, permissions]) => ({ title, permissions }));
  }

  private defaultGroups(): PermissionGroup[] {
    return [
      {
        title: 'Entry & Feed Management',
        permissions: [
          { key: 'entry.view', name: 'View Entries', description: 'View all entries and details.', checked: false, expanded: false },
          { key: 'entry.create', name: 'Create Entries', description: 'Create new entries in the system.', checked: false, expanded: false },
          { key: 'entry.edit', name: 'Edit Entries', description: 'Edit existing entries.', checked: false, expanded: false },
          { key: 'entry.delete', name: 'Delete Entries', description: 'Delete entries from the system.', checked: false, expanded: false },
          { key: 'entry.comment', name: 'Add Comments', description: 'Add comments to entries.', checked: false, expanded: false },
          { key: 'entry.attachments.view', name: 'View Attachments', description: 'View and download attachments.', checked: false, expanded: false },
        ],
      },
      {
        title: 'Review & Approval',
        permissions: [
          { key: 'entry.review', name: 'Review Entries', description: 'Review and approve entries.', checked: false, expanded: false },
          { key: 'entry.escalate', name: 'Escalate Entries', description: 'Escalate entries to other users.', checked: false, expanded: false },
        ],
      },
      {
        title: 'Reports & Export',
        permissions: [
          { key: 'report.view', name: 'View Reports', description: 'View system reports.', checked: false, expanded: false },
          { key: 'report.export', name: 'Export Data', description: 'Export entries and reports to file.', checked: false, expanded: false },
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

  cancel(): void {
    this.router.navigate(['/user-management']);
  }

  saveRole(): void {
    const orgId = this.getOrgId();
    if (!orgId) {
      this.errorMessage = 'Organization not found.';
      return;
    }

    if (!this.roleName.trim()) {
      this.errorMessage = 'Role name is required.';
      return;
    }

    if (this.selectedPermissions.length === 0) {
      this.permissionsError = 'Please select at least one permission.';
      return;
    }

    this.permissionsError = '';
    this.errorMessage = '';

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
      this.edobService.updateRole(orgId, this.roleId, updatePayload).subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/user-management']);
        },
        error: () => {
          this.saving = false;
          this.errorMessage = 'Failed to update role.';
        }
      });
    } else {
      this.edobService.createRole(orgId, payload).subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/user-management']);
        },
        error: () => {
          this.saving = false;
          this.errorMessage = 'Failed to create role.';
        }
      });
    }
  }
}
