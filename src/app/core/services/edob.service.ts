import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { ApiWrapper } from '../models/auth.models';
import {
  EntryType,
  CreateEntryTypeRequest,
  UpdateEntryTypeRequest,
  IncidentType,
  CreateIncidentTypeRequest,
  UpdateIncidentTypeRequest,
  HandoverType,
  CreateHandoverTypeRequest,
  UpdateHandoverTypeRequest,
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  Entry,
  CreateEntryRequest,
  UpdateEntryRequest,
  ListEntriesRequest,
  ListEntriesResponse,
  EntryAttachment,
  Role,
  CreateRoleRequest,
  UpdateRoleRequest,
  AssignRolesRequest,
  OrgUser,
  Comment,
  Permission,
  PermissionsGrouped,
  MyPermissionsResponse,
  DashboardData
} from '../models/edob.models';

@Injectable({ providedIn: 'root' })
export class EdobService {
  constructor(private api: ApiService) {}

  private basePath(orgId: string) {
    return `/api/v1/edob/organizations/${orgId}`;
  }

  // GET /api/v1/edob/organizations/{orgId}/dashboard
  getDashboard(orgId: string): Observable<DashboardData> {
    return this.api.get<ApiWrapper<DashboardData>>(`${this.basePath(orgId)}/dashboard`).pipe(map(res => res.data));
  }

  // ==================== Entry Types ====================

  // GET /api/v1/edob/organizations/{orgId}/entry-types
  listEntryTypes(orgId: string): Observable<EntryType[]> {
    return this.api.get<ApiWrapper<EntryType[]>>(`${this.basePath(orgId)}/entry-types`).pipe(map(res => res.data));
  }

  // POST /api/v1/edob/organizations/{orgId}/entry-types (admin)
  createEntryType(orgId: string, payload: CreateEntryTypeRequest): Observable<EntryType> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.post<EntryType>(`${this.basePath(orgId)}/entry-types`, payload, headers);
  }

  // PUT /api/v1/edob/organizations/{orgId}/entry-types/{entryTypeId}
  updateEntryType(orgId: string, entryTypeId: string, payload: UpdateEntryTypeRequest): Observable<EntryType> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.put<EntryType>(`${this.basePath(orgId)}/entry-types/${entryTypeId}`, payload, headers);
  }

  // DELETE /api/v1/edob/organizations/{orgId}/entry-types/{entryTypeId}
  disableEntryType(orgId: string, entryTypeId: string): Observable<any> {
    return this.api.delete(`${this.basePath(orgId)}/entry-types/${entryTypeId}`);
  }

  // ==================== Incident Types ====================

  // GET /api/v1/edob/organizations/{orgId}/incident-types
  listIncidentTypes(orgId: string): Observable<IncidentType[]> {
    return this.api.get<ApiWrapper<IncidentType[]> | IncidentType[]>(`${this.basePath(orgId)}/incident-types`).pipe(
      map((res: any) => (Array.isArray(res) ? res : (res?.data ?? [])))
    );
  }

  // POST /api/v1/edob/organizations/{orgId}/incident-types
  createIncidentType(orgId: string, payload: CreateIncidentTypeRequest): Observable<IncidentType> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.post<any>(`${this.basePath(orgId)}/incident-types`, payload, headers).pipe(
      map((res: any) => res?.data ?? res)
    );
  }

  // PUT /api/v1/edob/organizations/{orgId}/incident-types/{incidentTypeId}
  updateIncidentType(orgId: string, incidentTypeId: string, payload: UpdateIncidentTypeRequest): Observable<IncidentType> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.put<IncidentType>(`${this.basePath(orgId)}/incident-types/${incidentTypeId}`, payload, headers);
  }

  // DELETE /api/v1/edob/organizations/{orgId}/incident-types/{incidentTypeId}
  disableIncidentType(orgId: string, incidentTypeId: string): Observable<any> {
    return this.api.delete(`${this.basePath(orgId)}/incident-types/${incidentTypeId}`);
  }

  // ==================== Handover Types ====================

  // GET /api/v1/edob/organizations/{orgId}/handover-types
  listHandoverTypes(orgId: string): Observable<HandoverType[]> {
    return this.api.get<ApiWrapper<HandoverType[]> | HandoverType[]>(`${this.basePath(orgId)}/handover-types`).pipe(
      map((res: any) => (Array.isArray(res) ? res : (res?.data ?? [])))
    );
  }

  // POST /api/v1/edob/organizations/{orgId}/handover-types
  createHandoverType(orgId: string, payload: CreateHandoverTypeRequest): Observable<HandoverType> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.post<HandoverType>(`${this.basePath(orgId)}/handover-types`, payload, headers);
  }

  // PUT /api/v1/edob/organizations/{orgId}/handover-types/{handoverTypeId}
  updateHandoverType(orgId: string, handoverTypeId: string, payload: UpdateHandoverTypeRequest): Observable<HandoverType> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.put<HandoverType>(`${this.basePath(orgId)}/handover-types/${handoverTypeId}`, payload, headers);
  }

  // DELETE /api/v1/edob/organizations/{orgId}/handover-types/{handoverTypeId}
  disableHandoverType(orgId: string, handoverTypeId: string): Observable<any> {
    return this.api.delete(`${this.basePath(orgId)}/handover-types/${handoverTypeId}`);
  }

  // ==================== Categories ====================

  // GET /api/v1/edob/organizations/{orgId}/categories
  listCategories(orgId: string): Observable<Category[]> {
    return this.api.get<ApiWrapper<Category[]> | Category[]>(`${this.basePath(orgId)}/categories`).pipe(
      map((res: any) => (Array.isArray(res) ? res : (res?.data ?? [])))
    );
  }

  // POST /api/v1/edob/organizations/{orgId}/categories
  createCategory(orgId: string, payload: CreateCategoryRequest): Observable<Category> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.post<Category>(`${this.basePath(orgId)}/categories`, payload, headers);
  }

  // PUT /api/v1/edob/organizations/{orgId}/categories/{categoryId}
  updateCategory(orgId: string, categoryId: string, payload: UpdateCategoryRequest): Observable<Category> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.put<Category>(`${this.basePath(orgId)}/categories/${categoryId}`, payload, headers);
  }

  // DELETE /api/v1/edob/organizations/{orgId}/categories/{categoryId}
  disableCategory(orgId: string, categoryId: string): Observable<any> {
    return this.api.delete(`${this.basePath(orgId)}/categories/${categoryId}`);
  }

  // ==================== Entries ====================

  // POST /api/v1/edob/organizations/{orgId}/entries (multipart: entry JSON + attachments)
  createEntry(orgId: string, formData: FormData): Observable<Entry> {
    // No Content-Type header — browser sets multipart boundary automatically
    return this.api.post<Entry>(`${this.basePath(orgId)}/entries`, formData);
  }

  // GET /api/v1/edob/organizations/{orgId}/entries
  listEntries(orgId: string, filters?: ListEntriesRequest): Observable<ListEntriesResponse> {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.page !== undefined) params.set('page', String(filters.page));
      if (filters.size !== undefined) params.set('size', String(filters.size));
      if (filters.typeId) params.set('typeId', filters.typeId);
      if (filters.status) params.set('status', filters.status);
      if (filters.priority) params.set('priority', filters.priority);
      if (filters.assignedTo) params.set('assignedTo', filters.assignedTo);
      if (filters.createdBy) params.set('createdBy', filters.createdBy);
      if (filters.from) params.set('from', filters.from);
      if (filters.to) params.set('to', filters.to);
      if (filters.search) params.set('search', filters.search);
    }
    const qs = params.toString();
    return this.api.get<ApiWrapper<any>>(`${this.basePath(orgId)}/entries${qs ? `?${qs}` : ''}`).pipe(
      map(res => ({
        entries: res.data,
        total: res.meta['totalElements'],
        page: res.meta['page'],
        size: res.meta['size']
      }))
    );
  }

  // GET /api/v1/edob/organizations/{orgId}/entries/{entryId}
  getEntry(orgId: string, entryId: string): Observable<Entry> {
    return this.api.get<ApiWrapper<Entry>>(`${this.basePath(orgId)}/entries/${entryId}`).pipe(
      map(res => (res && res.data) ? res.data : (res as unknown as Entry))
    );
  }

  // PATCH /api/v1/edob/organizations/{orgId}/entries/{entryId} (multipart)
  updateEntry(orgId: string, entryId: string, formData: FormData): Observable<Entry> {
    return this.api.patch<Entry>(`${this.basePath(orgId)}/entries/${entryId}`, formData);
  }

  // ==================== Attachments ====================

  // GET /api/v1/edob/organizations/{orgId}/entries/{entryId}/attachments
  listAttachments(orgId: string, entryId: string): Observable<EntryAttachment[]> {
    return this.api.get<EntryAttachment[]>(`${this.basePath(orgId)}/entries/${entryId}/attachments`);
  }

  // GET /api/v1/edob/organizations/{orgId}/entries/{entryId}/attachments/{attachmentId}/download
  downloadAttachment(orgId: string, entryId: string, attachmentId: string): Observable<Blob> {
    return this.api.getBlob(`${this.basePath(orgId)}/entries/${entryId}/attachments/${attachmentId}/download`);
  }

  // DELETE /api/v1/edob/organizations/{orgId}/entries/{entryId}/attachments/{attachmentId}
  deleteAttachment(orgId: string, entryId: string, attachmentId: string): Observable<any> {
    return this.api.delete(`${this.basePath(orgId)}/entries/${entryId}/attachments/${attachmentId}`);
  }

  // ==================== Comments ====================

  // GET /api/v1/edob/organizations/{orgId}/entries/{entryId}/comments
  getComments(orgId: string, entryId: string): Observable<Comment[]> {
    return this.api.get<ApiWrapper<Comment[]>>(`${this.basePath(orgId)}/entries/${entryId}/comments`).pipe(map(res => res.data));
  }

  // POST /api/v1/edob/organizations/{orgId}/entries/{entryId}/comments
  addComment(orgId: string, entryId: string, payload: { body: string }): Observable<Comment> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.post<ApiWrapper<Comment>>(`${this.basePath(orgId)}/entries/${entryId}/comments`, payload, headers)
      .pipe(map(res => res.data));
  }

  // PATCH /api/v1/edob/organizations/{orgId}/comments/{commentId}
  updateComment(orgId: string, commentId: string, payload: { body: string }): Observable<Comment> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.patch<ApiWrapper<Comment>>(`${this.basePath(orgId)}/comments/${commentId}`, payload, headers)
      .pipe(map(res => res.data));
  }

  // DELETE /api/v1/edob/organizations/{orgId}/comments/{commentId}
  deleteComment(orgId: string, commentId: string): Observable<any> {
    return this.api.delete(`${this.basePath(orgId)}/comments/${commentId}`);
  }

  // ==================== Permissions ====================

  // GET /api/v1/edob/organizations/{orgId}/permissions/grouped
  getPermissionsGrouped(orgId: string): Observable<PermissionsGrouped> {
    return this.api.get<ApiWrapper<PermissionsGrouped>>(`${this.basePath(orgId)}/permissions/grouped`).pipe(map(res => res.data));
  }

  // GET /api/v1/edob/organizations/{orgId}/permissions
  listPermissions(orgId: string): Observable<Permission[]> {
    return this.api.get<ApiWrapper<Permission[]>>(`${this.basePath(orgId)}/permissions`).pipe(map(res => res.data));
  }

  // GET /api/v1/edob/organizations/{orgId}/me/permissions
  getMyPermissions(orgId: string): Observable<MyPermissionsResponse> {
    return this.api.get<ApiWrapper<MyPermissionsResponse>>(`${this.basePath(orgId)}/me/permissions`).pipe(map(res => res.data));
  }

  // ==================== Roles ====================

  // GET /api/v1/edob/organizations/{orgId}/roles
  listRoles(orgId: string): Observable<Role[]> {
    return this.api.get<ApiWrapper<Role[]>>(`${this.basePath(orgId)}/roles`).pipe(map(res => res.data));
  }

  // POST /api/v1/edob/organizations/{orgId}/roles
  createRole(orgId: string, payload: CreateRoleRequest): Observable<Role> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.post<Role>(`${this.basePath(orgId)}/roles`, payload, headers);
  }

  // PUT /api/v1/edob/organizations/{orgId}/roles/{roleId}
  updateRole(orgId: string, roleId: string, payload: UpdateRoleRequest): Observable<Role> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.put<Role>(`${this.basePath(orgId)}/roles/${roleId}`, payload, headers);
  }

  // PUT /api/v1/edob/organizations/{orgId}/users/{userId}/roles
  assignRolesToUser(orgId: string, userId: string, payload: AssignRolesRequest): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.put(`${this.basePath(orgId)}/users/${userId}/roles`, payload, headers);
  }

  // DELETE /api/v1/edob/organizations/{orgId}/roles/{roleId}
  deleteRole(orgId: string, roleId: string): Observable<any> {
    return this.api.delete(`${this.basePath(orgId)}/roles/${roleId}`);
  }

  // PUT /api/v1/edob/organizations/{orgId}/roles/{roleId}/deactivate
  deactivateRole(orgId: string, roleId: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.put(`${this.basePath(orgId)}/roles/${roleId}/deactivate`, { roleIds: [roleId] }, headers);
  }

  // PUT /api/v1/edob/organizations/{orgId}/roles/{roleId}/reactivate
  reactivateRole(orgId: string, roleId: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.api.put(`${this.basePath(orgId)}/roles/${roleId}/reactivate`, { roleIds: [roleId] }, headers);
  }

  // GET /api/v1/edob/organizations/{orgId}/roles/{roleId}
  getRole(orgId: string, roleId: string): Observable<Role> {
    return this.api.get<ApiWrapper<Role>>(`${this.basePath(orgId)}/roles/${roleId}`).pipe(map(res => res.data));
  }

  // ==================== Users ====================

  // GET /api/v1/edob/organizations/{orgId}/users
  listOrgUsers(orgId: string): Observable<OrgUser[]> {
    return this.api.get<ApiWrapper<OrgUser[]>>(`${this.basePath(orgId)}/users`).pipe(map(res => res.data));
  }

  // GET /api/v1/edob/organizations/{orgId}/users/{userId}
  getOrgUser(orgId: string, userId: string): Observable<OrgUser> {
    return this.api.get<OrgUser>(`${this.basePath(orgId)}/users/${userId}`);
  }
}