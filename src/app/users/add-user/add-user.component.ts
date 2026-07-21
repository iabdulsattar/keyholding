import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { EdobService } from '../../core/services/edob.service';
import { PermissionService } from '../../core/services/permission.service';
import { ServiceUser, CreateUserRequest, UpdateUserRequest } from '../../core/models/user.models';
import { AssignRolesRequest, Role } from '../../core/models/edob.models';
import { MultiSelectComponent, Option as MultiOption } from '../../shared/components/form/multi-select/multi-select.component';

@Component({
  selector: 'app-add-user',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MultiSelectComponent],
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
    serviceCode: 'edob',
    roleIds: [] as string[],
  };

  roles: Role[] = [];
  loadingRoles = false;
  roleOptions: MultiOption[] = [];

  profileImage: string | null = null;
  avatarFile: File | null = null;
  showCamera = false;
  cameraStream: MediaStream | null = null;
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('fileInput') fileInput!: HTMLInputElement;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private edobService: EdobService,
    private router: Router,
    private route: ActivatedRoute,
    private permissionService: PermissionService
  ) {}

  get canSaveUser(): boolean {
    return this.permissionService.hasPermission('admin.users.manage');
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
    this.edobService.listRoles(orgId).subscribe({
      next: (roles: Role[]) => {
        this.roles = roles;
        this.roleOptions = roles.filter(r => r.active).map(r => ({ value: r.id, text: r.name }));
        this.loadingRoles = false;
      },
      error: () => {
        this.roles = [];
        this.roleOptions = [];
        this.loadingRoles = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.stopCamera();
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
        this.form.roleIds = user.roleIds || (user.serviceAccess || []).find(s => s.serviceCode === 'edob')?.roleIds || [];
        this.profileImage = (user as any).profileImage || null;
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
            const userId = this.userId!;
            const rolesPayload: AssignRolesRequest = { roleIds: this.form.roleIds };
            this.edobService.assignRolesToUser(orgId, userId, rolesPayload).subscribe({
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
