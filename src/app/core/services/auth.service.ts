import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import {
  SignupRequest,
  SignupResponse,
  LoginRequest,
  LoginResponse,
  ProfileResponse,
  UpdateProfileRequest,
  InviteMemberRequest,
  InviteMemberResponse,
  InvitationResponse,
  AcceptInvitationRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
  LogoutRequest,

  ResendOtpRequest,
  ResendOtpResponse,
  VerifySignupOtpRequest,
  VerifySignupOtpResponse,
  Verify2faRequest,
  Verify2faResponse,

  RequestPasswordResetRequest,
  RequestPasswordResetResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,

  MobileRequestResetCodeRequest,
  MobileRequestResetCodeResponse,
  MobileVerifyResetCodeRequest,
  MobileVerifyResetCodeResponse,
  MobileResetPasswordRequest,
  MobileResetPasswordResponse,
  MobileResetPasswordOneShotRequest,
  MobileResetPasswordOneShotResponse,

  SessionResponse,
  ApiWrapper
} from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private api: ApiService) {}

  // POST /api/v1/auth/signup
  // Returns the organization + user at the top level (per API contract).
  signup(payload: SignupRequest): Observable<SignupResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.post<any>('/api/v1/auth/signup', payload, headers).pipe(
      map((res: any) => (res && typeof res === 'object' && 'data' in res ? res.data : res))
    );
  }

  // POST /api/v1/auth/signup/resend-otp
  resendSignupOtp(payload: ResendOtpRequest): Observable<ResendOtpResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.post<ApiWrapper<ResendOtpResponse>>('/api/v1/auth/signup/resend-otp', payload, headers).pipe(
      map((res) => res.data)
    );
  }

  // POST /api/v1/auth/signup/verify-otp
  verifySignupOtp(payload: VerifySignupOtpRequest): Observable<VerifySignupOtpResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.post<ApiWrapper<VerifySignupOtpResponse>>('/api/v1/auth/signup/verify-otp', payload, headers).pipe(
      map((res) => res.data)
    );
  }

  // POST /api/v1/auth/login
  login(payload: LoginRequest): Observable<LoginResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.post<ApiWrapper<LoginResponse>>('/api/v1/auth/login', payload, headers).pipe(
      map((res) => res.data)
    );
  }

  // POST /api/v1/auth/login/verify-2fa
  verify2fa(payload: Verify2faRequest): Observable<Verify2faResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.post<ApiWrapper<Verify2faResponse>>('/api/v1/auth/login/verify-2fa', payload, headers).pipe(
      map((res) => res.data)
    );
  }

  me(token?: string): Observable<ProfileResponse> {
    const accessToken = token ?? this.getAccessToken();
    const headers = accessToken
      ? new HttpHeaders({ Authorization: `Bearer ${accessToken}` })
      : undefined;

    if (!headers) {
      throw new Error("Missing access token: expected localStorage['access_token_saas'] or sessionStorage['access_token_saas'] to be set");
    }

    return this.api.get<ApiWrapper<ProfileResponse>>('/api/v1/auth/me', headers as any).pipe(
      map((res) => res.data)
    );
  }

  // PATCH /api/v1/auth/me/profile
  updateProfile(payload: UpdateProfileRequest, token?: string): Observable<ProfileResponse> {
    const accessToken = token ?? this.getAccessToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    });
    return this.api.patch<ApiWrapper<ProfileResponse>>('/api/v1/auth/me/profile', payload, headers).pipe(
      map((res) => res.data)
    );
  }

  listOrganizations(token?: string): Observable<{ organizations: any[] }> {
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.api.get('/api/v1/auth/me/organizations', headers as any);
  }

  // GET /api/v1/auth/me/session
  // Returns 200 even when no subscription exists.
  getSession(token?: string): Observable<SessionResponse> {
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.api.get<ApiWrapper<SessionResponse>>('/api/v1/auth/me/session', headers as any).pipe(
      map((res) => res.data)
    );
  }

  getAccessToken(): string | null {
    const remember = localStorage.getItem('remember_device');
    if (remember === 'true') {
      return localStorage.getItem('access_token_saas');
    }
    return sessionStorage.getItem('access_token_saas');
  }

  getRefreshToken(): string | null {
    const remember = localStorage.getItem('remember_device');
    if (remember === 'true') {
      return localStorage.getItem('refresh_token');
    }
    return sessionStorage.getItem('refresh_token');
  }

  isRemembered(): boolean {
    return localStorage.getItem('remember_device') === 'true';
  }

  /** Persist the "remember me" preference so subsequent token reads/writes
   * land in localStorage (persistent) vs sessionStorage (tab-session only). */
  setRemembered(remember: boolean): void {
    if (remember) {
      localStorage.setItem('remember_device', 'true');
    } else {
      localStorage.removeItem('remember_device');
    }
  }

  /** Decode the `exp` claim from a JWT into a millisecond epoch timestamp. */
  decodeExp(token: string): number | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  }

  /** Default session length used when the API doesn't report a TTL. */
  private readonly DEFAULT_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

  /**
   * Compute the session-expiry epoch-ms for a login response.
   *
   * Remembered sessions are bounded by the **refresh-token** TTL so the auth
   * guard only logs the user out once the refresh token itself has expired
   * (which can be days away). The access token is refreshed transparently by
   * the interceptor in between. Non-remembered sessions fall back to the
   * access-token expiry because sessionStorage is cleared on browser close
   * anyway.
   */
  computeSessionExpiry(
    accessToken: string,
    refreshExpiresInSec?: number,
    accessExpiresInSec?: number,
    remember?: boolean,
  ): number {
    const now = Date.now();
    if (remember) {
      if (typeof refreshExpiresInSec === 'number' && refreshExpiresInSec > 0) {
        return now + refreshExpiresInSec * 1000;
      }
      const accessExp = this.decodeExp(accessToken);
      return accessExp ?? now + this.DEFAULT_SESSION_TTL_MS;
    }
    if (typeof accessExpiresInSec === 'number' && accessExpiresInSec > 0) {
      return now + accessExpiresInSec * 1000;
    }
    const accessExp = this.decodeExp(accessToken);
    return accessExp ?? now + this.DEFAULT_SESSION_TTL_MS;
  }

  /**
   * Persist a fully-formed session: set the remember flag first so that
   * `setTokens` routes every value to the correct storage bucket, then
   * write the tokens + expiry in one place.
   */
  storeSession(
    accessToken: string,
    refreshToken: string | null,
    expiresAt: string,
    remember: boolean,
  ): void {
    this.setRemembered(remember);
    this.setTokens(accessToken, refreshToken, expiresAt);
  }

  private cachedUserId: string | null = null;

  getUserId(): Observable<string> {
    if (this.cachedUserId) {
      return of(this.cachedUserId);
    }
    return this.me().pipe(
      map((profile) => {
        this.cachedUserId = profile.id;
        return profile.id;
      })
    );
  }

  setTokens(accessToken: string, refreshToken: string | null, expiresAt: string): void {
    const remember = localStorage.getItem('remember_device');
    if (remember === 'true') {
      localStorage.setItem('access_token_saas', accessToken);
      localStorage.setItem('refresh_token', refreshToken ?? '');
      localStorage.setItem('session_expires_at', expiresAt);
    } else {
      sessionStorage.setItem('access_token_saas', accessToken);
      sessionStorage.setItem('refresh_token', refreshToken ?? '');
      sessionStorage.setItem('session_expires_at', expiresAt);
    }
  }

  setRefreshToken(refreshToken: string): void {
    const accessToken = this.getAccessToken();
    const remember = localStorage.getItem('remember_device');
    const expiresAt = remember === 'true'
      ? (localStorage.getItem('session_expires_at') ?? String(Date.now() + 24 * 60 * 60 * 1000))
      : (sessionStorage.getItem('session_expires_at') ?? String(Date.now() + 24 * 60 * 60 * 1000));
    this.setTokens(accessToken ?? '', refreshToken, expiresAt);
  }

  clearTokens(): void {
    localStorage.removeItem('access_token_saas');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('remember_device');
    localStorage.removeItem('session_expires_at');
    localStorage.removeItem('org_id');
    localStorage.removeItem('organizationId');
    sessionStorage.removeItem('access_token_saas');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('session_expires_at');
    sessionStorage.removeItem('org_id');
    sessionStorage.removeItem('organizationId');
  }

  getOrgName(): string | null {
    const remember = localStorage.getItem('remember_device');
    if (remember === 'true') {
      return localStorage.getItem('org_name') || localStorage.getItem('organizationName') || null;
    }
    return (
      sessionStorage.getItem('org_name') ||
      sessionStorage.getItem('organizationName') ||
      localStorage.getItem('org_name') ||
      localStorage.getItem('organizationName') ||
      null
    );
  }

  inviteMember(orgId: string, payload: InviteMemberRequest, token?: string): Observable<InviteMemberResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    });
    return this.api.post(`/api/v1/auth/organizations/${orgId}/invitations`, payload, headers);
  }

  readInvitation(token: string): Observable<InvitationResponse> {
    return this.api.get(`/api/v1/auth/invitations/${token}`);
  }

  acceptInvitation(token: string, payload: AcceptInvitationRequest): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.post(`/api/v1/auth/invitations/${token}/accept`, payload, headers);
  }

  // POST /api/v1/auth/password/request-reset
  requestPasswordReset(payload: RequestPasswordResetRequest): Observable<RequestPasswordResetResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.post('/api/v1/auth/password/request-reset', payload, headers);
  }

  // POST /api/v1/auth/password/reset
  resetPassword(payload: ResetPasswordRequest): Observable<ResetPasswordResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.post('/api/v1/auth/password/reset', payload, headers);
  }

  // POST /api/v1/auth/password/mobile/request-code
  mobileRequestResetCode(payload: MobileRequestResetCodeRequest): Observable<MobileRequestResetCodeResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.post('/api/v1/auth/password/mobile/request-code', payload, headers);
  }

  // POST /api/v1/auth/password/mobile/verify-code
  mobileVerifyResetCode(payload: MobileVerifyResetCodeRequest): Observable<MobileVerifyResetCodeResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.post('/api/v1/auth/password/mobile/verify-code', payload, headers).pipe(
      map((res: any) => {
        if (res && typeof res === 'object' && 'data' in res) {
          return res.data as MobileVerifyResetCodeResponse;
        }
        return res as MobileVerifyResetCodeResponse;
      })
    );
  }

  // POST /api/v1/auth/password/mobile/reset (with resetToken)
  mobileResetPassword(payload: MobileResetPasswordRequest): Observable<MobileResetPasswordResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.post('/api/v1/auth/password/mobile/reset', payload, headers);
  }

  // POST /api/v1/auth/password/mobile/reset (email + code one-shot)
  mobileResetPasswordOneShot(payload: MobileResetPasswordOneShotRequest): Observable<MobileResetPasswordOneShotResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.post('/api/v1/auth/password/mobile/reset', payload, headers);
  }

  refresh(payload: RefreshTokenRequest): Observable<RefreshTokenResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.post<ApiWrapper<RefreshTokenResponse> | RefreshTokenResponse>('/api/v1/auth/refresh', payload, headers).pipe(
      map((res: any) => {
        if (res && typeof res === 'object' && 'data' in res) {
          return res.data as RefreshTokenResponse;
        }
        return res as RefreshTokenResponse;
      })
    );
  }

  logout(payload: LogoutRequest, token?: string): Observable<void> {
    const accessToken = token ?? this.getAccessToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    });
    return this.api.post('/api/v1/auth/logout', payload, headers);
  }

  // -------- 2FA Management (authenticated) --------

  // POST /api/v1/auth/me/2fa/enable
  // Requests OTP email for enabling 2FA. Returns 202.
  requestEnable2fa(token?: string): Observable<any> {
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.api.post('/api/v1/auth/me/2fa/enable', {}, headers);
  }

  // POST /api/v1/auth/me/2fa/enable/verify
  // Verifies OTP and enables 2FA. Returns 204.
  verifyEnable2fa(code: string, token?: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    });
    return this.api.post('/api/v1/auth/me/2fa/enable/verify', { code }, headers);
  }

  // POST /api/v1/auth/me/2fa/disable
  // Requests OTP email for disabling 2FA. Returns 202.
  requestDisable2fa(token?: string): Observable<any> {
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.api.post('/api/v1/auth/me/2fa/disable', {}, headers);
  }

  // POST /api/v1/auth/me/2fa/disable/verify
  // Verifies OTP and disables 2FA. Returns 204.
  verifyDisable2fa(code: string, token?: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    });
    return this.api.post('/api/v1/auth/me/2fa/disable/verify', { code }, headers);
  }
}

