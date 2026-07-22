import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

export interface KeyVaultClient {
  id?: string;
  code?: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  region: string;
  address?: string;
  industry?: string;
  vatTaxNumber?: string;
  registrationNumber?: string;
  contactPerson?: string;
  designation?: string;
  contactEmail?: string;
  notes?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  sites?: number;
  users?: number;
  created?: string;
  [key: string]: any;
}

export interface KeyVaultSite {
  id?: string;
  code?: string;
  name: string;
  siteType: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postcode?: string;
  country?: string;
  primaryContactName?: string;
  designation?: string;
  phone?: string;
  email?: string;
  altContactName?: string;
  altPhone?: string;
  accessInstructions?: string;
  accessSchedule?: 'BUSINESS_HOURS' | 'BY_APPOINTMENT' | '24_7';
  securityLevel?: 'STANDARD' | 'HIGH' | 'VERY_HIGH';
  alarmSystem?: string;
  appointment?: {
    minimumNoticeRequired?: string;
    approvalRequiredName?: string;
    approvalRequiredNumber?: string;
    approvalRequiredEmail?: string;
    notes?: string;
  };
  status?: 'ACTIVE' | 'INACTIVE';
  [key: string]: any;
}

export interface KeyVaultKey {
  id?: string;
  code?: string;
  name: string;
  type: string;
  category?: string;
  clientId?: string;
  siteId?: string;
  storageLocation?: string;
  brand?: string;
  model?: string;
  colour?: string;
  tag?: string;
  status?: 'IN_STORAGE' | 'ISSUED' | 'IN_USE' | 'OVERDUE' | 'LOST';
  notes?: string;
  [key: string]: any;
}

export interface KeyVaultRole {
  id?: string;
  code: string;
  name: string;
  description?: string;
  color?: string;
  permissions?: string[];
  active?: boolean;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class KeyVaultService {
  private getAuthHeaders() {
    const token = this.auth.getAccessToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
  }

  constructor(private api: ApiService, private auth: AuthService) {}

  // Clients
  listClients(orgId: string, params?: { q?: string; status?: string; region?: string; page?: number; size?: number }): Observable<any> {
    const headers = this.getAuthHeaders();
    const q = new URLSearchParams();
    if (params?.q) q.set('q', params.q);
    if (params?.status) q.set('status', params.status);
    if (params?.region) q.set('region', params.region);
    q.set('page', String(params?.page ?? 0));
    q.set('size', String(params?.size ?? 10));
    const query = q.toString();
    return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/clients${query ? `?${query}` : ''}`, headers);
  }

  getClientStats(orgId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/clients/stats`, headers);
  }

  getClient(orgId: string, clientId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/clients/${clientId}`, headers);
  }

  createClient(orgId: string, client: KeyVaultClient): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(this.auth.getAccessToken() ? { Authorization: `Bearer ${this.auth.getAccessToken()}` } : {})
    });
    return this.api.post<any>(`/api/v1/keyvault/organizations/${orgId}/clients`, client, headers);
  }

  updateClient(orgId: string, clientId: string, client: Partial<KeyVaultClient>): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(this.auth.getAccessToken() ? { Authorization: `Bearer ${this.auth.getAccessToken()}` } : {})
    });
    return this.api.put<any>(`/api/v1/keyvault/organizations/${orgId}/clients/${clientId}`, client, headers);
  }

  deactivateClient(orgId: string, clientId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.post<any>(`/api/v1/keyvault/organizations/${orgId}/clients/${clientId}/deactivate`, {}, headers);
  }

  reactivateClient(orgId: string, clientId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.post<any>(`/api/v1/keyvault/organizations/${orgId}/clients/${clientId}/reactivate`, {}, headers);
  }

  deleteClient(orgId: string, clientId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.delete<any>(`/api/v1/keyvault/organizations/${orgId}/clients/${clientId}`, headers);
  }

  // Sites
  listSites(orgId: string, clientId: string, params?: { q?: string; status?: string; siteType?: string; page?: number; size?: number }): Observable<any> {
    const headers = this.getAuthHeaders();
    const q = new URLSearchParams();
    if (params?.q) q.set('q', params.q);
    if (params?.status) q.set('status', params.status);
    if (params?.siteType) q.set('siteType', params.siteType);
    q.set('page', String(params?.page ?? 0));
    q.set('size', String(params?.size ?? 10));
    const query = q.toString();
    return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/clients/${clientId}/sites${query ? `?${query}` : ''}`, headers);
  }

  getSiteStats(orgId: string, clientId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/clients/${clientId}/sites/stats`, headers);
  }

  getSite(orgId: string, siteId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/sites/${siteId}`, headers);
  }

  createSite(orgId: string, clientId: string, site: KeyVaultSite): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(this.auth.getAccessToken() ? { Authorization: `Bearer ${this.auth.getAccessToken()}` } : {})
    });
    return this.api.post<any>(`/api/v1/keyvault/organizations/${orgId}/clients/${clientId}/sites`, site, headers);
  }

  updateSite(orgId: string, siteId: string, site: Partial<KeyVaultSite>): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(this.auth.getAccessToken() ? { Authorization: `Bearer ${this.auth.getAccessToken()}` } : {})
    });
    return this.api.put<any>(`/api/v1/keyvault/organizations/${orgId}/sites/${siteId}`, site, headers);
  }

  deactivateSite(orgId: string, siteId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.post<any>(`/api/v1/keyvault/organizations/${orgId}/sites/${siteId}/deactivate`, {}, headers);
  }

  reactivateSite(orgId: string, siteId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.post<any>(`/api/v1/keyvault/organizations/${orgId}/sites/${siteId}/reactivate`, {}, headers);
  }

  deleteSite(orgId: string, siteId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.delete<any>(`/api/v1/keyvault/organizations/${orgId}/sites/${siteId}`, headers);
  }

  // Roles & Permissions
  listRoles(orgId: string, includeInactive = true): Observable<any> {
    const headers = this.getAuthHeaders();
    const q = includeInactive ? '?includeInactive=true' : '';
    return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/roles${q}`, headers);
  }

  getRoleStats(orgId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/roles/stats`, headers);
  }

  getRole(orgId: string, roleId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/roles/${roleId}`, headers);
  }

  createRole(orgId: string, role: KeyVaultRole): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(this.auth.getAccessToken() ? { Authorization: `Bearer ${this.auth.getAccessToken()}` } : {})
    });
    return this.api.post<any>(`/api/v1/keyvault/organizations/${orgId}/roles`, role, headers);
  }

  updateRole(orgId: string, roleId: string, role: Partial<KeyVaultRole>): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(this.auth.getAccessToken() ? { Authorization: `Bearer ${this.auth.getAccessToken()}` } : {})
    });
    return this.api.put<any>(`/api/v1/keyvault/organizations/${orgId}/roles/${roleId}`, role, headers);
  }

  deleteRole(orgId: string, roleId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.delete<any>(`/api/v1/keyvault/organizations/${orgId}/roles/${roleId}`, headers);
  }

  assignRolesToUser(orgId: string, userId: string, roleIds: string[]): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(this.auth.getAccessToken() ? { Authorization: `Bearer ${this.auth.getAccessToken()}` } : {})
    });
    return this.api.put<any>(`/api/v1/keyvault/organizations/${orgId}/users/${userId}/roles`, { roleIds }, headers);
  }

  listPermissions(orgId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/permissions`, headers);
  }

  listPermissionsGrouped(orgId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/permissions/grouped`, headers);
  }

  // Keys
  listKeys(orgId: string, params?: { clientId?: string; siteId?: string; status?: string; page?: number; size?: number }): Observable<any> {
    const headers = this.getAuthHeaders();
    const q = new URLSearchParams();
    if (params?.clientId) q.set('clientId', params.clientId);
    if (params?.siteId) q.set('siteId', params.siteId);
    if (params?.status) q.set('status', params.status);
    q.set('page', String(params?.page ?? 0));
    q.set('size', String(params?.size ?? 50));
    const query = q.toString();
    return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/keys${query ? `?${query}` : ''}`, headers);
  }

  getKey(orgId: string, keyId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/keys/${keyId}`, headers);
  }

  createKey(orgId: string, key: KeyVaultKey): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(this.auth.getAccessToken() ? { Authorization: `Bearer ${this.auth.getAccessToken()}` } : {})
    });
    return this.api.post<any>(`/api/v1/keyvault/organizations/${orgId}/keys`, key, headers);
  }

  updateKey(orgId: string, keyId: string, key: Partial<KeyVaultKey>): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(this.auth.getAccessToken() ? { Authorization: `Bearer ${this.auth.getAccessToken()}` } : {})
    });
    return this.api.put<any>(`/api/v1/keyvault/organizations/${orgId}/keys/${keyId}`, key, headers);
  }

  deleteKey(orgId: string, keyId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.delete<any>(`/api/v1/keyvault/organizations/${orgId}/keys/${keyId}`, headers);
  }

  getInternalPermissions(authUserId: string, orgId: string): Observable<any> {
    const headers = new HttpHeaders({
      'X-Internal-Secret': '9f2c7b4e1a8d6f3c5b9e2a7d1f4c8e6b3a9d5f2c7e1b8a4d6f9c3e7a2b5d1f8'
    });
    return this.api.get<any>(`/api/v1/keyvault/internal/users/${authUserId}/permissions?organizationId=${orgId}`, headers);
  }

  enableService(orgId: string, serviceCode: string, email: string, code: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(this.auth.getAccessToken() ? { Authorization: `Bearer ${this.auth.getAccessToken()}` } : {})
    });
    return this.api.post<any>(`/api/v1/users/organizations/${orgId}/services/${serviceCode}/enable`, { email, code }, headers);
  }
}
