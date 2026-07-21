// ============================================================
// user-service models (Postman collection folder 13)
// Endpoints under /api/v1/users/... and public /api/v1/invitations/...
// ============================================================

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING_INVITE';

export type DeactivateReason =
  | 'LEFT_COMPANY'
  | 'ROLE_CHANGE'
  | 'TEMPORARY_LEAVE'
  | 'POLICY_VIOLATION'
  | 'OTHER';

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

// -------- User --------
export interface ServiceUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  department?: string;
  jobTitle?: string;
  location?: string;
  status: UserStatus;
  canAccessWeb?: boolean;
  canAccessMobile?: boolean;
  roleIds?: string[];
  roleNames?: string[];
  serviceAccess?: ServiceAccess[];
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
  createdByUserName?: string;
  deactivatedByUserName?: string;
  deactivatedAt?: string;
  deactivationReason?: DeactivateReason;
  deactivationNote?: string;
  invitationStatus?: InvitationStatus;
  [key: string]: any;
}

export interface ServiceAccess {
  serviceCode: string;
  roleIds?: string[];
  roleNames?: string[];
  [key: string]: any;
}

// -------- List / pagination --------
export interface ListUsersParams {
  q?: string;
  status?: UserStatus;
  page?: number;
  size?: number;
}

export interface PagedUsers {
  content: ServiceUser[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  [key: string]: any;
}

// -------- Stats (screen 3 top cards) --------
export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalDeltaPercent?: number;
  activeDeltaPercent?: number;
  inactiveDeltaPercent?: number;
  [key: string]: any;
}

// -------- Create / update --------
export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  department?: string;
  jobTitle?: string;
  location?: string;
  canAccessWeb?: boolean;
  canAccessMobile?: boolean;
  serviceCode?: string;
  roleIds?: string[];
  sendInvite?: boolean;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  department?: string;
  jobTitle?: string;
  location?: string;
  canAccessWeb?: boolean;
  canAccessMobile?: boolean;
}

export interface DeactivateUserRequest {
  reason: DeactivateReason;
  note?: string;
}

// -------- Invitations --------
export interface UserInvitation {
  id: string;
  userId?: string;
  email?: string;
  status: InvitationStatus;
  expiresAt?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface InvitationPreview {
  companyName?: string;
  inviterName?: string;
  roleLabel?: string;
  email?: string;
  expiresAt?: string;
  [key: string]: any;
}

export interface AcceptUserInvitationRequest {
  password: string;
}

export interface ResendCredentialsRequest {
  email: string;
  password: string;
}
