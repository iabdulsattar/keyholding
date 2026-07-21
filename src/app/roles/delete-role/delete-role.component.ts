import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { EdobService } from '../../core/services/edob.service';
import { Role, OrgUser } from '../../core/models/edob.models';
import { DeleteRoleModalComponent } from '../delete-role-modal/delete-role-modal.component';
import { ToastService } from '../../core/services/toast.service';

interface AssignedUser {
  id: string;
  name: string;
  initials: string;
  avatarClass: string;
  email: string;
  department: string;
  lastLogin: string;
  status: 'Active' | 'Inactive';
}

@Component({
  selector: 'app-delete-role',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DeleteRoleModalComponent],
  templateUrl: './delete-role.component.html',
})
export class DeleteRoleComponent implements OnInit {
  role: Role | null = null;
  loading = true;
  deleting = false;
  showConfirmModal = false;

  roleId: string | null = null;
  orgId: string | null = null;
  currentUserName = 'John Smith';

  users: AssignedUser[] = [];
  totalUsers = 0;
  usersLoading = true;

  page = 1;
  pageSize = 3;

  private readonly avatarPalette = [
    'from-rose-300 to-pink-400',
    'from-sky-300 to-indigo-400',
    'from-violet-300 to-purple-400',
    'from-emerald-300 to-teal-400',
    'from-amber-300 to-orange-400',
  ];

  constructor(
    private edobService: EdobService,
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.roleId = this.route.snapshot.queryParamMap.get('id');
    if (!this.roleId) {
      this.loading = false;
      return;
    }

    this.orgId = this.getOrgId();
    if (!this.orgId) {
      this.loading = false;
      return;
    }

    this.loadRole();
    this.loadUsers();
  }

  private loadRole(): void {
    if (!this.orgId || !this.roleId) return;
    this.edobService.getRole(this.orgId, this.roleId).subscribe({
      next: (data) => {
        this.role = data;
        this.loading = false;
        if (!data) {
          this.toastService.error('Role details are empty.');
        }
      },
      error: () => {
        this.toastService.error('Failed to load role details.');
        this.loading = false;
      },
    });
  }

  private loadUsers(): void {
    if (!this.orgId || !this.roleId) return;
    this.edobService.listOrgUsers(this.orgId).subscribe({
      next: (data: any) => {
        const orgUsers: OrgUser[] = data?.data ?? data ?? [];
        const assigned = orgUsers.filter((u) =>
          (u.roles || []).some((r) => r.id === this.roleId),
        );
        this.totalUsers = assigned.length;
        this.users = assigned.map((u, i) => this.mapUser(u, i));
      },
      error: () => {
        this.users = [];
        this.totalUsers = 0;
      },
      complete: () => {
        this.usersLoading = false;
      },
    });
  }

  private mapUser(u: OrgUser, index: number): AssignedUser {
    const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'User';
    const initials = name
      .split(/\s+/)
      .map((part) => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
    const extra = u as any;
    return {
      id: u.id,
      name,
      initials,
      avatarClass: this.avatarPalette[index % this.avatarPalette.length],
      email: u.email,
      department: extra.department || '—',
      lastLogin: this.formatDateTime(extra.lastLoginAt || extra.lastLogin),
      status: u.enabled ? 'Active' : 'Inactive',
    };
  }

  get blocked(): boolean {
    return !this.usersLoading && this.totalUsers > 0;
  }

  get pagedUsers(): AssignedUser[] {
    const start = (this.page - 1) * this.pageSize;
    return this.users.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalUsers / this.pageSize));
  }

  get rangeStart(): number {
    return this.totalUsers === 0 ? 0 : (this.page - 1) * this.pageSize + 1;
  }

  get rangeEnd(): number {
    return Math.min(this.page * this.pageSize, this.totalUsers);
  }

  get visiblePages(): (number | '...')[] {
    const pages: (number | '...')[] = [];
    const total = this.totalPages;
    const current = this.page;
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (current > 3) pages.push('...');
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (current < total - 2) pages.push('...');
    pages.push(total);
    return pages;
  }

  changePage(p: number): void {
    if (p >= 1 && p <= this.totalPages) {
      this.page = p;
    }
  }

  goBack(): void {
    this.router.navigate(['/roles/view-role'], { queryParams: { id: this.roleId } });
  }

  viewRole(): void {
    this.router.navigate(['/roles/view-role'], { queryParams: { id: this.roleId } });
  }

  cancel(): void {
    this.goBack();
  }

  openConfirm(): void {
    this.showConfirmModal = true;
  }

  onModalClose(): void {
    this.showConfirmModal = false;
  }

  delete(): void {
    if (!this.orgId || !this.roleId || this.deleting || this.blocked) return;
    this.deleting = true;
    this.edobService.deleteRole(this.orgId, this.roleId).subscribe({
      next: () => {
        this.deleting = false;
        this.toastService.success('Role deleted successfully.');
        this.router.navigate(['/user-management']);
      },
      error: () => {
        this.deleting = false;
        this.toastService.error('Failed to delete role. Please try again.');
      },
    });
  }

  formatDateTime(value?: string): string {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '—';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dd = String(d.getDate()).padStart(2, '0');
    const mon = months[d.getMonth()];
    const yyyy = d.getFullYear();
    let h = d.getHours();
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    const hh = String(h).padStart(2, '0');
    return `${dd} ${mon} ${yyyy}, ${hh}:${mm} ${ampm}`;
  }

  private getOrgId(): string | null {
    const remember = localStorage.getItem('remember_device');
    if (remember === 'true') {
      return localStorage.getItem('org_id') || localStorage.getItem('organizationId') || null;
    }
    return (
      sessionStorage.getItem('org_id') ||
      sessionStorage.getItem('organizationId') ||
      localStorage.getItem('org_id') ||
      localStorage.getItem('organizationId') ||
      null
    );
  }
}
