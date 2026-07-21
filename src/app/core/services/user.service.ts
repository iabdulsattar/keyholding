import { HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { ApiWrapper } from '../models/auth.models';
import {
  ServiceUser,
  UserStats,
  ListUsersParams,
  PagedUsers,
  CreateUserRequest,
  UpdateUserRequest,
  DeactivateUserRequest,
  UserInvitation,
  InvitationPreview,
  AcceptUserInvitationRequest,
  ResendCredentialsRequest,
} from '../models/user.models';

/**
 * user-service endpoints (Postman collection folder 13).
 *
 * Admin endpoints are JWT-authenticated and scoped to
 * `/api/v1/users/organizations/{orgId}/...`.
 * Public endpoints (invitation preview / accept) require no JWT and live
 * under `/api/v1/invitations/...`.
 *
 * Responses come back as the standard `{ success, code, message, data, meta }`
 * envelope; every method unwraps and returns the `data` payload.
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private api: ApiService, private auth: AuthService) {}

  // ---- header helpers ----
  private authHeaders(extra?: Record<string, string>): HttpHeaders {
    const token = this.auth.getAccessToken();
    return new HttpHeaders({
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(extra ?? {}),
    });
  }

  private jsonHeaders(extra?: Record<string, string>): HttpHeaders {
    return this.authHeaders({ 'Content-Type': 'application/json', ...(extra ?? {}) });
  }

  /** Headers for multipart/form-data — no Content-Type so the browser sets the boundary. */
  private formHeaders(extra?: Record<string, string>): HttpHeaders {
    return this.authHeaders(extra ?? {});
  }

  /** Build the multipart body the API expects: a `payload` JSON part + an optional `avatar` file. */
  private toUserFormData(payload: object, avatar?: File | null): FormData {
    const fd = new FormData();
    fd.append('payload', JSON.stringify(payload));
    if (avatar) {
      fd.append('avatar', avatar, avatar.name);
    } else {
      fd.append('avatar', '');
    }
    return fd;
  }

  /** Unwrap the standard API envelope, tolerating already-unwrapped payloads. */
  private unwrap<T>() {
    return map((res: any): T =>
      res && typeof res === 'object' && 'data' in res ? (res.data as T) : (res as T),
    );
  }

  private base(orgId: string): string {
    return `/api/v1/users/organizations/${orgId}`;
  }

  // ==================== Users ====================

  // 13.1 GET /api/v1/users/organizations/{orgId}/users
  listUsers(orgId: string, options: ListUsersParams = {}): Observable<PagedUsers> {
    let params = new HttpParams();
    if (options.q) params = params.set('q', options.q);
    if (options.status) params = params.set('status', options.status);
    if (options.page != null) params = params.set('page', String(options.page));
    if (options.size != null) params = params.set('size', String(options.size));
    params = params.set('serviceCode', 'edob');

    const query = params.toString();
    const path = `${this.base(orgId)}/users${query ? `?${query}` : ''}`;
    return this.api.get<ApiWrapper<PagedUsers>>(path, this.authHeaders()).pipe(
      map(res => res.data)
    );
  }

  // 13.2 GET /api/v1/users/organizations/{orgId}/users/stats
  getStats(orgId: string): Observable<UserStats> {
    return this.api.get<any>(`${this.base(orgId)}/users/stats`, this.authHeaders()).pipe(
      map(res => (res && res.data) ? res.data : res)
    );
  }

  // 13.3 GET /api/v1/users/organizations/{orgId}/users/{userId}
  getUserDetail(orgId: string, userId: string): Observable<ServiceUser> {
    return this.api
      .get<any>(`${this.base(orgId)}/users/${userId}`, this.authHeaders())
      .pipe(this.unwrap<ServiceUser>());
  }

  // 13.4 POST /api/v1/users/organizations/{orgId}/users
  // Body is multipart/form-data: a `payload` JSON part + optional `avatar` file.
  // Sends the documented `X-Company-Name` header (company/brand context for the new user).
  createUser(
    orgId: string,
    payload: CreateUserRequest,
    avatar?: File | null,
  ): Observable<ServiceUser> {
    const companyName = this.auth.getOrgName();
    const headers = companyName ? this.formHeaders({ 'X-Company-Name': companyName }) : this.formHeaders();
    const fd = this.toUserFormData(payload, avatar);
    return this.api
      .post<any>(`${this.base(orgId)}/users`, fd, headers)
      .pipe(this.unwrap<ServiceUser>());
  }

  // 13.5 PATCH /api/v1/users/organizations/{orgId}/users/{userId}
  // Body is multipart/form-data: a `payload` JSON part + optional `avatar` file (empty string if none).
  updateUser(orgId: string, userId: string, payload: UpdateUserRequest, avatar?: File | null): Observable<ServiceUser> {
    const fd = this.toUserFormData(payload, avatar);
    return this.api
      .put<any>(`${this.base(orgId)}/users/${userId}`, fd, this.formHeaders())
      .pipe(this.unwrap<ServiceUser>());
  }

  // 13.6 POST /api/v1/users/organizations/{orgId}/users/{userId}/deactivate
  deactivateUser(
    orgId: string,
    userId: string,
    payload: DeactivateUserRequest = { reason: 'OTHER', note: '' },
  ): Observable<ServiceUser> {
    return this.api
      .post<any>(`${this.base(orgId)}/users/${userId}/deactivate`, payload, this.jsonHeaders())
      .pipe(this.unwrap<ServiceUser>());
  }

  // 13.7 POST /api/v1/users/organizations/{orgId}/users/{userId}/reactivate
  reactivateUser(orgId: string, userId: string): Observable<ServiceUser> {
    return this.api
      .post<any>(`${this.base(orgId)}/users/${userId}/reactivate`, {}, this.jsonHeaders())
      .pipe(this.unwrap<ServiceUser>());
  }

  // Resend credentials
  resendCredentials(orgId: string, userId: string, payload: ResendCredentialsRequest): Observable<any> {
    return this.api.post(
      `${this.base(orgId)}/users/${userId}/credentials/resend`,
      payload,
      this.jsonHeaders()
    );
  }

  // ==================== Invitations ====================

  // 13.8 POST /api/v1/users/organizations/{orgId}/users/{userId}/invitations/send
  // NOTE: the documented `X-Company-Name` header is intentionally omitted — it is a
  // custom (non-standard) header that forces a CORS preflight the API server rejects,
  // and the backend resolves the company/brand context itself. Sending the request
  // without it succeeds (verified: user is created/invited and the call returns 2xx).
  sendInvitation(orgId: string, userId: string): Observable<UserInvitation> {
    return this.api
      .post<any>(
        `${this.base(orgId)}/users/${userId}/invitations/send`,
        {},
        this.jsonHeaders(),
      )
      .pipe(this.unwrap<UserInvitation>());
  }

  // 13.9 DELETE /api/v1/users/organizations/{orgId}/invitations/{userInvitationId}
  revokeInvitation(orgId: string, userInvitationId: string): Observable<void> {
    return this.api.delete<void>(
      `${this.base(orgId)}/invitations/${userInvitationId}`,
      this.authHeaders(),
    );
  }

  // 13.10 GET /api/v1/invitations/{token}  (public — no JWT)
  previewInvitation(token: string): Observable<InvitationPreview> {
    return this.api
      .get<any>(`/api/v1/invitations/${token}`)
      .pipe(this.unwrap<InvitationPreview>());
  }

  // 13.11 POST /api/v1/invitations/{token}/accept  (public — no JWT)
  acceptInvitation(token: string, payload: AcceptUserInvitationRequest): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.post<any>(`/api/v1/invitations/${token}/accept`, payload, headers);
  }
}
