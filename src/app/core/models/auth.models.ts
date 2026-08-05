export interface Organization {
  id: string;
  name: string;
  slug: string;
  country: string;
  role?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface SignupRequest {
  organizationName: string;
  organizationSlug: string;
  country: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  phoneNumber: string;
  employeeCount: string;
  receiveProductUpdates: boolean;
  acceptedTerms: boolean;
  serviceCode?: string;
}

export interface SignupResponse {
  membership: {
    id: string;
    slug: string;
    name: string;
    role?: string;
    [key: string]: any;
  };
  organization: {
    id: string;
    slug: string;
    name: string;
    country?: string;
    createdAt?: string;
    ownerUserId?: string;
    [key: string]: any;
  };
  user: {
    id: string;
    keycloakId?: string;
    email: string;
    enabled?: boolean;
    firstName?: string;
    lastName?: string;
    createdAt?: string;
    [key: string]: any;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
  serviceCode?: string;
}

export interface LoginResponse {
  requiresOtp?: boolean;
  challengeToken?: string;
  tokens?: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    refresh_expires_in: number;
    token_type: string;
    scope: string;
    organizations?: Organization[];
    [key: string]: any;
  };
  [key: string]: any;
}

export interface ProfileResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organizations: Organization[];
}

export interface InviteMemberRequest {
  email: string;
  role: 'ADMIN' | 'MEMBER';
}

export interface InviteMemberResponse {
  token: string;
  email: string;
  role: string;
  organizationId: string;
}

export interface InvitationResponse {
  token: string;
  email: string;
  organizationName: string;
  role: string;
}

export interface AcceptInvitationRequest {
  password: string;
  firstName: string;
  lastName: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  tokens?: {
    access_token: string;
    refresh_token: string;
    organizations?: Organization[];
    [key: string]: any;
  };
  [key: string]: any;
}

export interface LogoutRequest {
  refreshToken: string;
}

// -------- OTP / 2FA --------
export interface ResendOtpRequest {
  email: string;
}

export interface ResendOtpResponse {
  tokens?: {
    access_token: string;
    refresh_token: string;
    organizations?: Organization[];
    [key: string]: any;
  };
  message?: string;
  [key: string]: any;
}

export interface VerifySignupOtpRequest {
  email: string;
  code: string;
}

export interface VerifySignupOtpResponse {
  tokens?: {
    access_token: string;
    refresh_token: string;
    organizations?: Organization[];
    [key: string]: any;
  };
  message?: string;
  [key: string]: any;
}

export interface Verify2faRequest {
  challengeToken: string;
  code: string;
}

export interface Verify2faResponse {
  tokens?: {
    access_token: string;
    refresh_token: string;
    organizations?: Organization[];
    [key: string]: any;
  };
  [key: string]: any;
}

// -------- Password reset --------
export interface RequestPasswordResetRequest {
  email: string;
}

export interface RequestPasswordResetResponse {
  message?: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  message?: string;
}

// -------- Mobile password reset (no email-existence leak) --------
export interface MobileRequestResetCodeRequest {
  email: string;
}

export interface MobileRequestResetCodeResponse {
  message?: string;
  [key: string]: any;
}

export interface MobileVerifyResetCodeRequest {
  email: string;
  code: string;
}

export interface MobileVerifyResetCodeResponse {
  resetToken: string;
  [key: string]: any;
}

export interface MobileResetPasswordRequest {
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
}

export interface MobileResetPasswordResponse {
  message?: string;
  [key: string]: any;
}

export interface MobileResetPasswordOneShotRequest {
  email: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
}

export interface MobileResetPasswordOneShotResponse {
  message?: string;
  [key: string]: any;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  country?: string;
  jobTitle?: string;
  phoneNumber?: string;
  employeeCount?: string;
  profileImage?: string;
}

export interface ApiMeta {
  timestamp: string;
  requestId: string;
  [key: string]: any;
}

export interface ApiWrapper<T> {
  success: boolean;
  code: string;
  message: string;
  data: T;
  meta: ApiMeta;
}

// -------- Session --------
export interface SubscriptionFeatures {
  // free-form features returned by subscription-service
  [key: string]: any;
}

export interface SessionSubscription {
  active: boolean;
  status?: string;
  planCode?: string;
  planName?: string;
  daysUntilExpiry: number | null;
  features?: SubscriptionFeatures;
}

export interface SessionUser {
  id: string;
  keycloakId: string;
  email: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
  [key: string]: any;
}

export interface SessionOrganization {
  id: string;
  name?: string;
  slug?: string;
  role?: string;
  subscription?: SessionSubscription;
  user?: SessionUser;
}

export interface SessionResponse {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  organizations?: SessionOrganization[];
  fetchedAt?: string;
  // Some backends include additional fields; keep it permissive
  [key: string]: any;
}

