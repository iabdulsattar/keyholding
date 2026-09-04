import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { KeyVaultService } from '../core/services/keyvault.service';
import { PermissionService } from '../core/services/permission.service';
import { RichSelectComponent, RichSelectOption } from '../shared/components/form/rich-select/rich-select.component';

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

@Component({
  selector: 'app-permissions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, RichSelectComponent],
  templateUrl: './permissions.component.html',
  styles: [`
    .scrollbar-thin::-webkit-scrollbar { height: 6px; width: 6px; }
    .scrollbar-thin::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 9999px; }
  `]
})
export class PermissionsComponent implements OnInit {
  permissionGroups: PermissionGroup[] = [];
  permissionLoading = false;
  permissionsSearchQuery = '';
  permissionFilters = { module: 'All', category: 'All', type: 'All', status: 'All' };
  collapsedGroups = new Set<number>();

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
    'User Management':  'bg-emerald-50 text-emerald-600',
    'Workflow':         'bg-amber-50 text-amber-600',
    'Administration':   'bg-purple-50 text-purple-600',
    'Client Management': 'bg-blue-50 text-blue-600',
    'Key Management':   'bg-amber-50 text-amber-600',
    'Site Management':  'bg-teal-50 text-teal-600',
    'Entry & Feed':     'bg-blue-50 text-blue-600',
    'Review & Approval': 'bg-indigo-50 text-indigo-600',
  };

  seedPermissionGroups: PermissionGroup[] = [
    {
      name: 'Reports & Export',
      rows: [
        { icon: 'doc', name: 'View Reports', module: 'Reports & Export', category: 'Reports', type: 'System', status: 'Active', description: 'Allows users to view system reports.' },
        { icon: 'export', name: 'Export Reports', module: 'Reports & Export', category: 'Reports', type: 'System', status: 'Active', description: 'Allows users to export reports in PDF/Excel.' },
        { icon: 'clock', name: 'Schedule Reports', module: 'Reports & Export', category: 'Reports', type: 'System', status: 'Active', description: 'Allows users to schedule reports.' },
      ],
    },
    {
      name: 'User Management',
      rows: [
        { icon: 'eye', name: 'View Users', module: 'User Management', category: 'Users', type: 'System', status: 'Active', description: 'Allows users to view users.' },
        { icon: 'userplus', name: 'Create User', module: 'User Management', category: 'Users', type: 'System', status: 'Active', description: 'Allows users to create new users.' },
        { icon: 'pencil', name: 'Edit User', module: 'User Management', category: 'Users', type: 'System', status: 'Active', description: 'Allows users to edit user details.' },
      ],
    },
  ];

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

  constructor(
    private keyVault: KeyVaultService,
    private route: ActivatedRoute,
    private permissionService: PermissionService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadPermissions();
  }

  loadPermissions(): void {
    const orgId = this.getOrgId();
    if (!orgId) {
      this.permissionGroups = this.seedPermissionGroups;
      return;
    }

    this.permissionLoading = true;
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

  permIcon(name: string): SafeHtml {
    const inner = this.permissionIcons[name] || '';
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.7" viewBox="0 0 24 24" style="display:block">${inner}</svg>`
    );
  }

  statusBadge(status: string): string {
    const active = status === 'Active';
    return `<span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}">
      <span class="h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-400'}"></span>${status}
    </span>`;
  }

  private getOrgId(): string | null {
    const remember = localStorage.getItem('remember_device');
    if (remember === 'true') {
      return localStorage.getItem('org_id') || localStorage.getItem('organizationId') || null;
    }
    return sessionStorage.getItem('org_id') || sessionStorage.getItem('organizationId') || localStorage.getItem('org_id') || localStorage.getItem('organizationId') || null;
  }
}
