import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { KeyVaultService } from '../../core/services/keyvault.service';
import { PermissionService } from '../../core/services/permission.service';
import { ServiceUser, CreateUserRequest, UpdateUserRequest } from '../../core/models/user.models';

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

interface AssignRolesRequest {
  roleIds: string[];
}
import { MultiSelectComponent, Option as MultiOption } from '../../shared/components/form/multi-select/multi-select.component';
import { RichSelectComponent, RichSelectOption } from '../../shared/components/form/rich-select/rich-select.component';

@Component({
  selector: 'app-add-user',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MultiSelectComponent, RichSelectComponent],
  templateUrl: './add-user.component.html',
  styles: ``
})
export class AddUserComponent implements OnInit {
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';
  isEditMode = false;
  userId: string | null = null;
  userKeycloakId: string | null = null;
  touched = new Set<string>();
  submitted = false;
  activeTab = 0;
  activateSearchQuery = '';
  activatingUserId: string | null = null;

  existingUsers: any[] = [];
  loadingExistingUsers = false;

  showAssignRoleModal = false;
  selectedUserForRole: any = null;
  selectedRoleId = '';
  assigningRole = false;

  existingUsersPage = 0;
  existingUsersPageSize = 10;
  existingUsersTotal = 0;
  existingUsersTotalPages = 1;

  get existingUsersShowingText(): string {
    if (this.existingUsersTotal === 0) return 'Showing 0 users';
    const start = this.existingUsersPage * this.existingUsersPageSize + 1;
    const end = Math.min((this.existingUsersPage + 1) * this.existingUsersPageSize, this.existingUsersTotal);
    return `Showing ${start} to ${end} of ${this.existingUsersTotal} users`;
  }

  get existingUsersPageNumbers(): (number | '...')[] {
    const pages: (number | '...')[] = [];
    const total = this.existingUsersTotalPages;
    const current = this.existingUsersPage;

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

    if (start > 1) pages.push('...');

    for (let i = start; i <= end; i++) pages.push(i);

    if (end < total - 2) pages.push('...');

    pages.push(total - 1);
    return pages;
  }

  form = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    department: '',
    jobTitle: '',
    location: '',
    canAccessWeb: true,
    canAccessMobile: true,
    canAccessBoth: false,
    serviceCode: 'edob',
    roleIds: [] as string[],
  };

  roles: Role[] = [];
  loadingRoles = false;
  roleOptions: MultiOption[] = [];
  roleRichOptions: RichSelectOption[] = [];

  departmentOptions: RichSelectOption[] = [
    { value: '', label: 'Select department' },
    { value: 'Operations', label: 'Operations' },
    { value: 'Security', label: 'Security' },
    { value: 'Compliance', label: 'Compliance' },
    { value: 'HR', label: 'HR' },
  ];

  profileImage: string | null = null;
  avatarFile: File | null = null;
  showCamera = false;
  cameraStream: MediaStream | null = null;
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('fileInput') fileInput!: HTMLInputElement;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private keyVault: KeyVaultService,
    private router: Router,
    private route: ActivatedRoute,
    private permissionService: PermissionService
  ) {}

  get canSaveUser(): boolean {
    return this.permissionService.hasPermission('admin.users.manage');
  }

  get informationInvalid(): boolean {
    return this.submitted && (
      !this.form.firstName.trim() ||
      !this.form.lastName.trim() ||
      !this.form.email.trim()
    );
  }

  markTouched(field: string): void {
    this.touched.add(field);
  }

  ngOnInit(): void {
    this.userId = this.route.snapshot.queryParamMap.get('id');
    this.isEditMode = !!this.userId;

    if (this.isEditMode && this.userId) {
      this.loadUser(this.userId);
    }

    this.loadRoles();
  }

  private loadRoles(): void {
    const orgId = this.getOrgId();
    if (!orgId) return;

    this.loadingRoles = true;
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
        this.roleOptions = roles.filter(r => r.active).map(r => ({ value: String(r.id), text: r.name }));
        this.roleRichOptions = roles.filter(r => r.active).map(r => ({ value: String(r.id), label: r.name, description: r.description || '' }));
        this.loadingRoles = false;
      },
      error: () => {
        this.roles = [];
        this.roleOptions = [];
        this.roleRichOptions = [];
        this.loadingRoles = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  loadExistingUsers(): void {
    this.loadingExistingUsers = true;
    const orgId = this.getOrgId();
    if (!orgId) {
      this.loadingExistingUsers = false;
      return;
    }

    this.userService.listUsers(orgId, {
      q: this.activateSearchQuery.trim() || undefined,
      page: this.existingUsersPage,
      size: this.existingUsersPageSize,
    }).subscribe({
      next: (res: any) => {
        const payload = res?.data ?? res;
        const items = Array.isArray(payload) ? payload : payload?.content ?? payload?.items ?? payload?.data ?? [];
        this.existingUsers = items.map((item: any, index: number) => ({
          id: item.id,
          name: [item.firstName, item.lastName].filter(Boolean).join(' ') || item.name || item.email || 'Unknown',
          email: item.email || '-',
          initials: this.getInitialsForUser(item),
          bgColor: this.getAvatarColor(item.name || item.email || index),
          status: item.invitationStatus || 'Not Invited',
        }));
        const meta = res?.meta ?? res;
        this.existingUsersTotal = meta?.totalElements ?? this.existingUsers.length;
        this.existingUsersTotalPages = meta?.totalPages ?? 1;
        this.loadingExistingUsers = false;
      },
      error: () => {
        this.existingUsers = [];
        this.loadingExistingUsers = false;
      }
    });
  }

  onExistingUsersPageChange(page: number): void {
    this.existingUsersPage = page;
    this.loadExistingUsers();
  }

  onActivateSearch(): void {
    this.existingUsersPage = 1;
    this.loadExistingUsers();
  }

  importUser(user: any): void {
    if (!user?.id) return;
    this.selectedUserForRole = user;
    this.selectedRoleId = '';
    this.showAssignRoleModal = true;
  }

  closeAssignRoleModal(): void {
    this.showAssignRoleModal = false;
    this.selectedUserForRole = null;
    this.selectedRoleId = '';
  }

  assignRole(): void {
    if (!this.selectedUserForRole?.id || !this.selectedRoleId) return;
    const orgId = this.getOrgId();
    if (!orgId) return;

    this.assigningRole = true;
    const roleIds = [this.selectedRoleId];
    this.keyVault.assignRolesToUser(orgId, this.selectedUserForRole.id, roleIds).subscribe({
      next: () => {
        this.userService.sendInvitation(orgId, this.selectedUserForRole.id).subscribe({
          next: () => {
            this.assigningRole = false;
            this.showAssignRoleModal = false;
            this.selectedUserForRole = null;
            this.successMessage = `Role assigned and invitation sent.`;
            this.loadExistingUsers();
          },
          error: () => {
            this.assigningRole = false;
            this.errorMessage = `Failed to send invitation.`;
          }
        });
      },
      error: () => {
        this.assigningRole = false;
        this.errorMessage = `Failed to assign role.`;
      }
    });
  }

  get selectedRole(): Role | undefined {
    return this.roles.find(r => String(r.id) === this.selectedRoleId);
  }

  private getInitialsForUser(user: any): string {
    const first = (user.firstName || '').charAt(0);
    const last = (user.lastName || '').charAt(0);
    return (first + last).toUpperCase() || 'U';
  }

  private getAvatarColor(name: string): string {
    const colors = ['bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700', 'bg-violet-100 text-violet-700', 'bg-sky-100 text-sky-700'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
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
        this.form.firstName = user.firstName || '';
        this.form.lastName = user.lastName || '';
        this.form.email = user.email || '';
        this.form.phoneNumber = user.phoneNumber || '';
        this.form.department = user.department || '';
        this.form.jobTitle = user.jobTitle || '';
        this.form.location = user.location || '';
        this.form.canAccessWeb = user.canAccessWeb ?? true;
        this.form.canAccessMobile = user.canAccessMobile ?? true;
        this.form.roleIds = (user.roleIds || (user.serviceAccess || []).find(s => s.serviceCode === 'edob')?.roleIds || []).map(String);
        this.profileImage = (user as any).profileImage || null;
        this.userKeycloakId = (user as any).keycloakId || null;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Failed to load user details.';
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select a valid image file.';
      return;
    }

    this.avatarFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.profileImage = reader.result as string;
      this.errorMessage = '';
    };
    reader.readAsDataURL(file);
  }

  async openCamera(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      this.cameraStream = stream;
      this.showCamera = true;

      setTimeout(() => {
        if (this.videoElement?.nativeElement) {
          this.videoElement.nativeElement.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error('Camera access error:', err);
      this.errorMessage = 'Unable to access camera. Please check permissions.';
    }
  }

  stopCamera(): void {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(track => track.stop());
      this.cameraStream = null;
    }
    this.showCamera = false;
  }

  capturePhoto(): void {
    if (!this.videoElement?.nativeElement) return;

    const video = this.videoElement.nativeElement;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      this.profileImage = canvas.toDataURL('image/jpeg', 0.9);
    }

    this.stopCamera();
  }

  removePhoto(): void {
    this.profileImage = null;
    this.avatarFile = null;
    if (this.fileInput) {
      this.fileInput.value = '';
    }
  }

  submit(): void {
    if (this.saving) {
      return;
    }

    this.submitted = true;
    this.touched.add('form.firstName');
    this.touched.add('form.lastName');
    this.touched.add('form.email');

    if (!this.form.firstName.trim() || !this.form.lastName.trim() || !this.form.email.trim()) {
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';
    const orgId = this.getOrgId();
    if (!orgId) {
      this.saving = false;
      this.errorMessage = 'Organization not found.';
      return;
    }

    if (this.isEditMode && this.userId) {
      const payload: UpdateUserRequest = {
        firstName: this.form.firstName.trim(),
        lastName: this.form.lastName.trim(),
        phoneNumber: this.form.phoneNumber.trim() || undefined,
        department: this.form.department.trim() || undefined,
        jobTitle: this.form.jobTitle.trim() || undefined,
        location: this.form.location.trim() || undefined,
        canAccessWeb: this.form.canAccessWeb,
        canAccessMobile: this.form.canAccessMobile,
      };

      this.userService.updateUser(orgId, this.userId, payload, this.avatarFile).subscribe({
        next: () => {
          if (this.form.roleIds.length) {
            const userId = this.userKeycloakId || this.userId || '';
            const rolesPayload: AssignRolesRequest = { roleIds: this.form.roleIds };
            this.keyVault.assignRolesToUser(orgId, userId, rolesPayload.roleIds).subscribe({
              next: () => {
                this.saving = false;
                this.successMessage = 'User updated successfully.';
                setTimeout(() => this.router.navigate(['/user-management']), 1000);
              },
              error: (err: any) => {
                console.error('assignRolesToUser error:', err);
                this.saving = false;
                this.errorMessage = err?.error?.message || 'Failed to update user roles.';
              }
            });
          } else {
            this.saving = false;
            this.successMessage = 'User updated successfully.';
            setTimeout(() => this.router.navigate(['/user-management']), 1000);
          }
        },
        error: () => {
          this.saving = false;
          this.errorMessage = 'Failed to update user.';
        }
      });
    } else {
      const payload: CreateUserRequest = {
        firstName: this.form.firstName.trim(),
        lastName: this.form.lastName.trim(),
        email: this.form.email.trim(),
        phoneNumber: this.form.phoneNumber.trim() || undefined,
        department: this.form.department.trim() || undefined,
        jobTitle: this.form.jobTitle.trim() || undefined,
        location: this.form.location.trim() || undefined,
        canAccessWeb: this.form.canAccessWeb,
        canAccessMobile: this.form.canAccessMobile,
        serviceCode: this.form.serviceCode || 'edob',
        roleIds: this.form.roleIds.length ? this.form.roleIds : undefined,
        sendInvite: true,
      };

      this.userService.createUser(orgId, payload, this.avatarFile).subscribe({
        next: () => {
          this.saving = false;
          this.successMessage = 'User created and invitation sent successfully.';
          setTimeout(() => this.router.navigate(['/user-management']), 1000);
        },
        error: (err: any) => {
          this.saving = false;
          const status = err?.status;
          const message = err?.error?.message || err?.message || '';
          if (status === 409 || /already exists/i.test(message)) {
            this.errorMessage = 'A user with this email already exists in the organization.';
          } else {
            this.errorMessage = 'Failed to create user.';
          }
        }
      });
    }
  }
}
