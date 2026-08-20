import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

export interface KeyVaultClient {
  id?: string;
  code?: string;
  clientCode?: string;
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
  siteCode?: string;
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
  accessSchedule?: 'BUSINESS_HOURS' | 'BY_APPOINTMENT' | '24_7' | 'ALWAYS' | 'RESTRICTED';
  securityLevel?: 'STANDARD' | 'HIGH' | 'VERY_HIGH';
  alarmSystem?: string;
  scheduleConfig?: {
    days?: Array<{ day: string; from: string; until: string }>;
    windows?: Array<{ day: string; from: string; until: string }>;
    rules?: {
      prohibitedOnBankHolidays?: boolean;
      outOfHoursNeedsClientApproval?: boolean;
      officerMustCallBeforeEntry?: boolean;
      securityEscortRequired?: boolean;
    };
    appointmentRequired?: boolean;
    minimumNoticeRequired?: string;
    approvalRequiredName?: string;
    approvalRequiredNumber?: string;
    approvalRequiredEmail?: string;
    notes?: string;
  };
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
  keyCode?: string;
  name: string;
  description?: string;
  type?: string;
  category?: string;
  clientId?: string;
  siteId?: string;
  storageLocation?: string;
  storageLocationId?: string;
  keyTypeId?: string;
  keyCategoryId?: string;
  brand?: string;
  makeBrand?: string;
  model?: string;
  colour?: string;
  tagLabel?: string;
  reference?: string;
  status?: 'IN_STORAGE' | 'ISSUED' | 'IN_USE' | 'OVERDUE' | 'LOST' | 'DAMAGED' | 'INACTIVE';
  active?: boolean;
  assignedToUserId?: string | null;
  notes?: string;
  [key: string]: any;
}

export interface KeyType {
  id?: string;
  code?: string;
  name: string;
  description?: string;
  color?: string;
  sortOrder?: number;
  active?: boolean;
  [key: string]: any;
}

export interface KeyCategory {
  id?: string;
  code?: string;
  name: string;
  description?: string;
  color?: string;
  sortOrder?: number;
  active?: boolean;
  [key: string]: any;
}

export interface KeyVaultContact {
  id?: string;
  code?: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  email?: string;
  phoneCountryCode?: string;
  phone?: string;
  department?: string;
  primaryContact?: boolean;
  status?: 'ACTIVE' | 'INACTIVE';
  preferredMethod?: string;
  address?: string;
  notes?: string;
  clientId?: string;
  [key: string]: any;
}

export interface EmergencyContact {
  id?: string;
  firstName: string;
  lastName: string;
  department?: string;
  phoneCountryCode?: string;
  phone?: string;
  email?: string;
  availability?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  primaryContact?: boolean;
  notifyFor?: 'ALL_EMERGENCIES' | 'KEY_RELATED' | 'SITE_RELATED' | 'SECURITY_INCIDENTS' | 'OTHER';
  address?: string;
  notes?: string;
  clientId?: string;
  [key: string]: any;
}

export interface StorageLocation {
  id?: string;
  code?: string;
  locationCode?: string;
  name: string;
  siteBuilding?: string;
  site?: string;
  building?: string;
  buildingName?: string;
  locationType?: string;
  address?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postcode?: string;
  postalCode?: string;
  zipCode?: string;
  country?: string;
  responsiblePerson?: string;
  responsiblePersonName?: string;
  contactPerson?: string;
  contactNumber?: string;
  phone?: string;
  accessInstructions?: string;
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  active?: boolean;
  sortOrder?: number;
  fireRating?: string;
  totalCabinets?: number;
  totalHooks?: number;
  keysInStorage?: number;
  availableHooks?: number;
  outOfOrderHooks?: number;
  [key: string]: any;
}

export interface Cabinet {
  id?: string;
  code?: string;
  cabinetCode?: string;
  storageLocationId: string;
  name: string;
  cabinetType?: string;
  description?: string;
  numberOfHooks?: number;
  securityLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'TOP_SECRET';
  fireRating?: string;
  installedOn?: string;
  installedBy?: string;
  responsiblePerson?: string;
  notes?: string;
  cctvMonitored?: boolean;
  alarmSystem?: boolean;
  status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  [key: string]: any;
}

export interface KeyHook {
  id?: string;
  cabinetId?: string;
  hookNo?: number;
  label?: string;
  status?: 'AVAILABLE_FOR_KEY' | 'KEY_HOOKED' | 'KEY_IN_USE' | 'HOOK_DAMAGED';
  notes?: string;
  assignedKeyId?: string | null;
  [key: string]: any;
}

export interface KeyVaultDocument {
  id?: string;
  code?: string;
  name: string;
  category?: string;
  documentType?: string;
  description?: string;
  fileSize?: number;
  fileName?: string;
  contentType?: string;
  storagePath?: string;
  publicUrl?: string;
  relatedToType?: string;
  relatedToId?: string;
  uploadedByUserId?: string;
  uploadedByUserName?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface KeyMovement {
  id?: string;
  keyId?: string;
  action?: string;
  fromStatus?: string;
  toStatus?: string;
  fromLocation?: string;
  toLocation?: string;
  userId?: string;
  userName?: string;
  note?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface KeyAuditEntry {
  id?: string;
  keyId?: string;
  action?: string;
  userId?: string;
  userName?: string;
  details?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface KeyAttachment {
  id?: string;
  keyId?: string;
  fileName?: string;
  contentType?: string;
  sizeBytes?: number;
  storagePath?: string;
  publicUrl?: string;
  uploadedByUserId?: string;
  uploadedByUserName?: string;
  createdAt?: string;
  isImage?: boolean;
  isPdf?: boolean;
  kind?: string;
  [key: string]: any;
}

export interface KeyNote {
  id?: string;
  keyId?: string;
  body?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface KeyVaultAuditEntry {
  id?: string;
  targetType?: 'CLIENT' | 'SITE' | 'KEY' | 'DOCUMENT' | 'CONTACT';
  targetId?: string;
  action?: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  details?: string;
  ipAddress?: string;
  createdAt?: string;
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
  private catalogCache = new Map<string, any[]>();

  private getCatalogCacheKey(catalog: string, orgId: string, includeInactive: boolean): string {
    return `${catalog}:${orgId}:${includeInactive}`;
  }

  private setCatalogCache(key: string, items: any[]): void {
    this.catalogCache.set(key, items);
  }

  private getCachedCatalog(key: string): any[] | undefined {
    return this.catalogCache.get(key);
  }

  private parseCatalogResponse(res: any): any[] {
    const data = res?.data ?? res ?? {};
    return data.items ?? data.data ?? data ?? [];
  }
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

  getDashboardStats(orgId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/dashboard`, headers);
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

  listAllSites(orgId: string, params?: { q?: string; status?: string; siteType?: string; clientId?: string; page?: number; size?: number }): Observable<any> {
    const headers = this.getAuthHeaders();
    const q = new URLSearchParams();
    if (params?.q) q.set('q', params.q);
    if (params?.status) q.set('status', params.status);
    if (params?.siteType) q.set('siteType', params.siteType);
    if (params?.clientId) q.set('clientId', params.clientId);
    q.set('page', String(params?.page ?? 0));
    q.set('size', String(params?.size ?? 10));
    const query = q.toString();
    return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/sites${query ? `?${query}` : ''}`, headers);
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

  // Contacts
  listContacts(orgId: string, clientId: string, params?: { q?: string; status?: string; department?: string; page?: number; size?: number }): Observable<any> {
    const headers = this.getAuthHeaders();
    const q = new URLSearchParams();
    if (params?.q) q.set('q', params.q);
    if (params?.status) q.set('status', params.status);
    if (params?.department) q.set('department', params.department);
    q.set('page', String(params?.page ?? 0));
    q.set('size', String(params?.size ?? 10));
    const query = q.toString();
    return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/clients/${clientId}/contacts${query ? `?${query}` : ''}`, headers);
  }

  getContact(orgId: string, clientId: string, contactId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/clients/${clientId}/contacts/${contactId}`, headers);
  }

  createContact(orgId: string, clientId: string, contact: KeyVaultContact): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(this.auth.getAccessToken() ? { Authorization: `Bearer ${this.auth.getAccessToken()}` } : {})
    });
    return this.api.post<any>(`/api/v1/keyvault/organizations/${orgId}/clients/${clientId}/contacts`, contact, headers);
  }

  updateContact(orgId: string, clientId: string, contactId: string, contact: Partial<KeyVaultContact>): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(this.auth.getAccessToken() ? { Authorization: `Bearer ${this.auth.getAccessToken()}` } : {})
    });
    return this.api.put<any>(`/api/v1/keyvault/organizations/${orgId}/clients/${clientId}/contacts/${contactId}`, contact, headers);
  }

  deactivateContact(orgId: string, clientId: string, contactId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.post<any>(`/api/v1/keyvault/organizations/${orgId}/clients/${clientId}/contacts/${contactId}/deactivate`, {}, headers);
  }

  reactivateContact(orgId: string, clientId: string, contactId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.post<any>(`/api/v1/keyvault/organizations/${orgId}/clients/${clientId}/contacts/${contactId}/reactivate`, {}, headers);
  }

  deleteContact(orgId: string, clientId: string, contactId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.delete<any>(`/api/v1/keyvault/organizations/${orgId}/clients/${clientId}/contacts/${contactId}`, headers);
  }

  // Emergency Contacts
  listEmergencyContacts(orgId: string, clientId: string, params?: { q?: string; status?: string; department?: string; page?: number; size?: number }): Observable<any> {
    const headers = this.getAuthHeaders();
    const q = new URLSearchParams();
    if (params?.q) q.set('q', params.q);
    if (params?.status) q.set('status', params.status);
    if (params?.department) q.set('department', params.department);
    q.set('page', String(params?.page ?? 0));
    q.set('size', String(params?.size ?? 10));
    const query = q.toString();
    return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/clients/${clientId}/emergency-contacts${query ? `?${query}` : ''}`, headers);
  }

  getEmergencyContact(orgId: string, clientId: string, emergencyContactId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/clients/${clientId}/emergency-contacts/${emergencyContactId}`, headers);
  }

  createEmergencyContact(orgId: string, clientId: string, contact: EmergencyContact): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(this.auth.getAccessToken() ? { Authorization: `Bearer ${this.auth.getAccessToken()}` } : {})
    });
    return this.api.post<any>(`/api/v1/keyvault/organizations/${orgId}/clients/${clientId}/emergency-contacts`, contact, headers);
  }

  updateEmergencyContact(orgId: string, clientId: string, emergencyContactId: string, contact: Partial<EmergencyContact>): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(this.auth.getAccessToken() ? { Authorization: `Bearer ${this.auth.getAccessToken()}` } : {})
    });
    return this.api.put<any>(`/api/v1/keyvault/organizations/${orgId}/clients/${clientId}/emergency-contacts/${emergencyContactId}`, contact, headers);
  }

  deactivateEmergencyContact(orgId: string, clientId: string, emergencyContactId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.post<any>(`/api/v1/keyvault/organizations/${orgId}/clients/${clientId}/emergency-contacts/${emergencyContactId}/deactivate`, {}, headers);
  }

  reactivateEmergencyContact(orgId: string, clientId: string, emergencyContactId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.post<any>(`/api/v1/keyvault/organizations/${orgId}/clients/${clientId}/emergency-contacts/${emergencyContactId}/reactivate`, {}, headers);
  }

  deleteEmergencyContact(orgId: string, clientId: string, emergencyContactId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.delete<any>(`/api/v1/keyvault/organizations/${orgId}/clients/${clientId}/emergency-contacts/${emergencyContactId}`, headers);
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

  deactivateRole(orgId: string, roleId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.post<any>(`/api/v1/keyvault/organizations/${orgId}/roles/${roleId}/deactivate`, { roleIds: [roleId] }, headers);
  }

  reactivateRole(orgId: string, roleId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.post<any>(`/api/v1/keyvault/organizations/${orgId}/roles/${roleId}/reactivate`, { roleIds: [roleId] }, headers);
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
  listKeys(orgId: string, params?: { clientId?: string; siteId?: string; q?: string; status?: string; keyTypeId?: string; page?: number; size?: number }): Observable<any> {
    const headers = this.getAuthHeaders();
    const q = new URLSearchParams();
    if (params?.clientId) q.set('clientId', params.clientId);
    if (params?.siteId) q.set('siteId', params.siteId);
    if (params?.q) q.set('q', params.q);
    if (params?.status) q.set('status', params.status);
    if (params?.keyTypeId) q.set('keyTypeId', params.keyTypeId);
    q.set('page', String(params?.page ?? 0));
    q.set('size', String(params?.size ?? 50));
    const query = q.toString();
    return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/keys${query ? `?${query}` : ''}`, headers);
  }

  listAllKeys(orgId: string, params?: { clientId?: string; q?: string; status?: string; page?: number; size?: number }): Observable<any> {
    const headers = this.getAuthHeaders();
    const q = new URLSearchParams();
    if (params?.clientId) q.set('clientId', params.clientId);
    if (params?.q) q.set('q', params.q);
    if (params?.status) q.set('status', params.status);
    q.set('page', String(params?.page ?? 0));
    q.set('size', String(params?.size ?? 10));
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

  activateKey(orgId: string, keyId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.post<any>(`/api/v1/keyvault/organizations/${orgId}/keys/${keyId}/activate`, {}, headers);
  }

  deactivateKey(orgId: string, keyId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.post<any>(`/api/v1/keyvault/organizations/${orgId}/keys/${keyId}/deactivate`, {}, headers);
  }

  getKeyStats(orgId: string, clientId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/clients/${clientId}/keys/stats`, headers);
  }

  getKeyMovements(orgId: string, keyId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/keys/${keyId}/movements`, headers);
  }

  getKeyAuditLog(orgId: string, keyId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/keys/${keyId}/audit`, headers);
  }

  listKeyAttachments(orgId: string, keyId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/keys/${keyId}/attachments`, headers);
  }

  listSiteAttachments(orgId: string, siteId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/sites/${siteId}/attachments`, headers);
  }

  addKeyAttachment(orgId: string, keyId: string, file: File): Observable<any> {
    const headers = this.getAuthHeaders();
    const fd = new FormData();
    fd.append('file', file, file.name);
    return this.api.post<any>(`/api/v1/keyvault/organizations/${orgId}/keys/${keyId}/attachments`, fd, headers);
  }

  addSiteAttachment(orgId: string, siteId: string, file: File, kind?: string): Observable<any> {
    const headers = this.getAuthHeaders();
    const fd = new FormData();
    fd.append('file', file, file.name);
    if (kind) fd.append('kind', kind);
    return this.api.post<any>(`/api/v1/keyvault/organizations/${orgId}/sites/${siteId}/attachments`, fd, headers);
  }

  deleteSiteAttachment(orgId: string, siteId: string, attachmentId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.delete<any>(`/api/v1/keyvault/organizations/${orgId}/sites/${siteId}/attachments/${attachmentId}`, headers);
  }

  deleteKeyAttachment(orgId: string, keyId: string, attachmentId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.delete<any>(`/api/v1/keyvault/organizations/${orgId}/keys/${keyId}/attachments/${attachmentId}`, headers);
  }

  downloadKeyAttachmentBlob(orgId: string, keyId: string, attachmentId: string): Observable<Blob> {
    const headers = this.getAuthHeaders();
    return this.api.getBlob(`/api/v1/keyvault/organizations/${orgId}/keys/${keyId}/attachments/${attachmentId}/download`, headers);
  }

  downloadSiteAttachmentBlob(orgId: string, siteId: string, attachmentId: string): Observable<Blob> {
    const headers = this.getAuthHeaders();
    return this.api.getBlob(`/api/v1/keyvault/organizations/${orgId}/sites/${siteId}/attachments/${attachmentId}/download`, headers);
  }

  listKeyNotes(orgId: string, keyId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/keys/${keyId}/notes`, headers);
  }

  addKeyNote(orgId: string, keyId: string, note: { body: string }): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(this.auth.getAccessToken() ? { Authorization: `Bearer ${this.auth.getAccessToken()}` } : {})
    });
    return this.api.post<any>(`/api/v1/keyvault/organizations/${orgId}/keys/${keyId}/notes`, note, headers);
  }

  deleteKeyNote(orgId: string, keyId: string, noteId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.delete<any>(`/api/v1/keyvault/organizations/${orgId}/keys/${keyId}/notes/${noteId}`, headers);
  }

  // Key Catalog
  listKeyTypes(orgId: string, includeInactive = false): Observable<any> {
    const headers = this.getAuthHeaders();
    const q = includeInactive ? '?includeInactive=true' : '?includeInactive=false';
    const cacheKey = this.getCatalogCacheKey('keyTypes', orgId, includeInactive);
    const cached = this.getCachedCatalog(cacheKey);
    if (cached) {
      return of(cached);
    }
    return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/catalog/key-types${q}`, headers).pipe(
      map((res: any) => {
        const items = this.parseCatalogResponse(res);
        this.setCatalogCache(cacheKey, items);
        return items;
      })
    );
  }

  createKeyType(orgId: string, keyType: KeyType): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(this.auth.getAccessToken() ? { Authorization: `Bearer ${this.auth.getAccessToken()}` } : {})
    });
    return this.api.post<any>(`/api/v1/keyvault/organizations/${orgId}/catalog/key-types`, keyType, headers);
  }

  updateKeyType(orgId: string, keyTypeId: string, keyType: Partial<KeyType>): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(this.auth.getAccessToken() ? { Authorization: `Bearer ${this.auth.getAccessToken()}` } : {})
    });
    return this.api.put<any>(`/api/v1/keyvault/organizations/${orgId}/catalog/key-types/${keyTypeId}`, keyType, headers);
  }

  deleteKeyType(orgId: string, keyTypeId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.delete<any>(`/api/v1/keyvault/organizations/${orgId}/catalog/key-types/${keyTypeId}`, headers);
  }

  listKeyCategories(orgId: string, includeInactive = false): Observable<any> {
    const headers = this.getAuthHeaders();
    const q = includeInactive ? '?includeInactive=true' : '?includeInactive=false';
    const cacheKey = this.getCatalogCacheKey('keyCategories', orgId, includeInactive);
    const cached = this.getCachedCatalog(cacheKey);
    if (cached) {
      return of(cached);
    }
    return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/catalog/key-categories${q}`, headers).pipe(
      map((res: any) => {
        const items = this.parseCatalogResponse(res);
        this.setCatalogCache(cacheKey, items);
        return items;
      })
    );
  }

  createKeyCategory(orgId: string, keyCategory: KeyCategory): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(this.auth.getAccessToken() ? { Authorization: `Bearer ${this.auth.getAccessToken()}` } : {})
    });
    return this.api.post<any>(`/api/v1/keyvault/organizations/${orgId}/catalog/key-categories`, keyCategory, headers);
  }

  updateKeyCategory(orgId: string, keyCategoryId: string, keyCategory: Partial<KeyCategory>): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(this.auth.getAccessToken() ? { Authorization: `Bearer ${this.auth.getAccessToken()}` } : {})
    });
    return this.api.put<any>(`/api/v1/keyvault/organizations/${orgId}/catalog/key-categories/${keyCategoryId}`, keyCategory, headers);
  }

  deleteKeyCategory(orgId: string, keyCategoryId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.delete<any>(`/api/v1/keyvault/organizations/${orgId}/catalog/key-categories/${keyCategoryId}`, headers);
  }

   listCatalogStorageLocations(orgId: string, includeInactive = false): Observable<any[]> {
    const headers = this.getAuthHeaders();
    const q = includeInactive ? '?includeInactive=true' : '?includeInactive=false';
    const cacheKey = this.getCatalogCacheKey('storageLocations', orgId, includeInactive);
    const cached = this.getCachedCatalog(cacheKey);
    if (cached) {
      return of(cached);
    }
    return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/catalog/storage-locations${q}`, headers).pipe(
      map((res: any) => {
        const items = this.parseCatalogResponse(res);
        this.setCatalogCache(cacheKey, items);
        return items;
      })
    );
   }

   listStorageLocations(orgId: string, params?: { q?: string; status?: string; locationType?: string; page?: number; size?: number }): Observable<any> {
     const headers = this.getAuthHeaders();
     const q = new URLSearchParams();
     if (params?.q) q.set('q', params.q);
     if (params?.status) q.set('status', params.status);
     if (params?.locationType) q.set('locationType', params.locationType);
     q.set('page', String(params?.page ?? 0));
     q.set('size', String(params?.size ?? 10));
     const query = q.toString();
     return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/storage-locations${query ? `?${query}` : ''}`, headers);
   }

   getStorageLocationStats(orgId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/storage-locations/stats`, headers);
   }

   createStorageLocation(orgId: string, storageLocation: StorageLocation): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(this.auth.getAccessToken() ? { Authorization: `Bearer ${this.auth.getAccessToken()}` } : {})
    });
    return this.api.post<any>(`/api/v1/keyvault/organizations/${orgId}/storage-locations`, storageLocation, headers);
   }

   getStorageLocation(orgId: string, storageLocationId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/storage-locations/${storageLocationId}`, headers);
   }

   updateStorageLocation(orgId: string, storageLocationId: string, storageLocation: Partial<StorageLocation>): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(this.auth.getAccessToken() ? { Authorization: `Bearer ${this.auth.getAccessToken()}` } : {})
    });
    return this.api.put<any>(`/api/v1/keyvault/organizations/${orgId}/storage-locations/${storageLocationId}`, storageLocation, headers);
   }

   setStorageLocationMaintenance(orgId: string, storageLocationId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.post<any>(`/api/v1/keyvault/organizations/${orgId}/storage-locations/${storageLocationId}/maintenance`, {}, headers);
   }

   deactivateStorageLocation(orgId: string, storageLocationId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.post<any>(`/api/v1/keyvault/organizations/${orgId}/storage-locations/${storageLocationId}/deactivate`, {}, headers);
   }

   reactivateStorageLocation(orgId: string, storageLocationId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.post<any>(`/api/v1/keyvault/organizations/${orgId}/storage-locations/${storageLocationId}/reactivate`, {}, headers);
   }

   deleteStorageLocation(orgId: string, storageLocationId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.delete<any>(`/api/v1/keyvault/organizations/${orgId}/storage-locations/${storageLocationId}`, headers);
   }

  getOrgSiteStats(orgId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/sites/stats`, headers);
  }

  listDocuments(orgId: string, clientId: string, params?: { q?: string; category?: string; documentType?: string; page?: number; size?: number }): Observable<any> {
    const headers = this.getAuthHeaders();
    const q = new URLSearchParams();
    if (params?.q) q.set('q', params.q);
    if (params?.category) q.set('category', params.category);
    if (params?.documentType) q.set('documentType', params.documentType);
    q.set('page', String(params?.page ?? 0));
    q.set('size', String(params?.size ?? 10));
    const query = q.toString();
    return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/clients/${clientId}/documents${query ? `?${query}` : ''}`, headers);
  }

  getDocumentStats(orgId: string, clientId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/clients/${clientId}/documents/stats`, headers);
  }

  getDocument(orgId: string, clientId: string, documentId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/clients/${clientId}/documents/${documentId}`, headers);
  }

  uploadDocument(orgId: string, clientId: string, file: File, name: string, category: string, documentType: string, description?: string): Observable<any> {
    const headers = this.getAuthHeaders();
    const fd = new FormData();
    fd.append('file', file, file.name);
    fd.append('name', name);
    fd.append('category', category);
    fd.append('documentType', documentType);
    if (description) fd.append('description', description);
    return this.api.post<any>(`/api/v1/keyvault/organizations/${orgId}/clients/${clientId}/documents`, fd, headers);
  }

  updateDocument(orgId: string, clientId: string, documentId: string, params: { name?: string; category?: string }): Observable<any> {
    const headers = this.getAuthHeaders();
    const q = new URLSearchParams();
    if (params?.name) q.set('name', params.name);
    if (params?.category) q.set('category', params.category);
    const query = q.toString();
    return this.api.put<any>(`/api/v1/keyvault/organizations/${orgId}/clients/${clientId}/documents/${documentId}${query ? `?${query}` : ''}`, {}, headers);
  }

  downloadDocument(orgId: string, clientId: string, documentId: string): Observable<Blob> {
    const headers = this.getAuthHeaders();
    return this.api.getBlob(`/api/v1/keyvault/organizations/${orgId}/clients/${clientId}/documents/${documentId}/download`, headers);
  }

  deleteDocument(orgId: string, clientId: string, documentId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.delete<any>(`/api/v1/keyvault/organizations/${orgId}/clients/${clientId}/documents/${documentId}`, headers);
  }

  enableService(orgId: string, serviceCode: string, email: string, code: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(this.auth.getAccessToken() ? { Authorization: `Bearer ${this.auth.getAccessToken()}` } : {})
    });
    return this.api.post<any>(`/api/v1/users/organizations/${orgId}/services/${serviceCode}/enable`, { email, code }, headers);
  }

  // Audit / Activity Log
  listAuditLog(orgId: string, params?: { targetType?: string; targetId?: string; includeRelated?: boolean; page?: number; size?: number }): Observable<any> {
    const headers = this.getAuthHeaders();
    const q = new URLSearchParams();
    if (params?.targetType) q.set('targetType', params.targetType);
    if (params?.targetId) q.set('targetId', params.targetId);
    if (params?.includeRelated) q.set('includeRelated', 'true');
    q.set('page', String(params?.page ?? 0));
    q.set('size', String(params?.size ?? 50));
    const query = q.toString();
    return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/audit${query ? `?${query}` : ''}`, headers);
  }

  listEntityAuditLog(orgId: string, targetType: string, targetId: string, params?: { page?: number; size?: number }): Observable<any> {
    const headers = this.getAuthHeaders();
    const q = new URLSearchParams();
    q.set('page', String(params?.page ?? 0));
    q.set('size', String(params?.size ?? 50));
    const query = q.toString();
     return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/audit/${targetType}/${targetId}${query ? `?${query}` : ''}`, headers);
   }

   // Cabinets
    listCabinets(orgId: string, params?: { storageLocationId?: string; q?: string; status?: string; cabinetType?: string; page?: number; size?: number }): Observable<any> {
      const headers = this.getAuthHeaders();
      const q = new URLSearchParams();
      if (params?.storageLocationId) q.set('storageLocationId', params.storageLocationId);
      if (params?.q) q.set('q', params.q);
      if (params?.status) q.set('status', params.status);
      if (params?.cabinetType) q.set('cabinetType', params.cabinetType);
      q.set('page', String(params?.page ?? 0));
      q.set('size', String(params?.size ?? 10));
      const query = q.toString();
      return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/cabinets${query ? `?${query}` : ''}`, headers);
    }

   createCabinet(orgId: string, cabinet: Cabinet): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(this.auth.getAccessToken() ? { Authorization: `Bearer ${this.auth.getAccessToken()}` } : {})
    });
    return this.api.post<any>(`/api/v1/keyvault/organizations/${orgId}/cabinets`, cabinet, headers);
   }

   getCabinet(orgId: string, cabinetId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/cabinets/${cabinetId}`, headers);
   }

   updateCabinet(orgId: string, cabinetId: string, cabinet: Partial<Cabinet>): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(this.auth.getAccessToken() ? { Authorization: `Bearer ${this.auth.getAccessToken()}` } : {})
    });
    return this.api.put<any>(`/api/v1/keyvault/organizations/${orgId}/cabinets/${cabinetId}`, cabinet, headers);
   }

   deactivateCabinet(orgId: string, cabinetId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.post<any>(`/api/v1/keyvault/organizations/${orgId}/cabinets/${cabinetId}/deactivate`, {}, headers);
   }

   reactivateCabinet(orgId: string, cabinetId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.post<any>(`/api/v1/keyvault/organizations/${orgId}/cabinets/${cabinetId}/reactivate`, {}, headers);
   }

   deleteCabinet(orgId: string, cabinetId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.delete<any>(`/api/v1/keyvault/organizations/${orgId}/cabinets/${cabinetId}`, headers);
   }

    // Hooks
    listHooks(orgId: string, cabinetId: string, params?: { q?: string; status?: string; assigned?: 'ALL' | 'ASSIGNED' | 'UNASSIGNED'; page?: number; size?: number }): Observable<any> {
      const headers = this.getAuthHeaders();
      const q = new URLSearchParams();
      if (params?.q) q.set('q', params.q);
      if (params?.status) q.set('status', params.status);
      if (params?.assigned) q.set('assigned', params.assigned);
      q.set('page', String(params?.page ?? 0));
      q.set('size', String(params?.size ?? 10));
      const query = q.toString();
      return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/cabinets/${cabinetId}/hooks${query ? `?${query}` : ''}`, headers);
    }

    listAllHooks(orgId: string, params?: { q?: string; status?: string; assigned?: 'ALL' | 'ASSIGNED' | 'UNASSIGNED'; page?: number; size?: number }): Observable<any> {
      const headers = this.getAuthHeaders();
      const q = new URLSearchParams();
      if (params?.q) q.set('q', params.q);
      if (params?.status) q.set('status', params.status);
      if (params?.assigned) q.set('assigned', params.assigned);
      q.set('page', String(params?.page ?? 0));
      q.set('size', String(params?.size ?? 10));
      const query = q.toString();
      return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/hooks${query ? `?${query}` : ''}`, headers);
    }

    listAllCabinetHooks(orgId: string, params?: { q?: string; status?: string; assigned?: 'ALL' | 'ASSIGNED' | 'UNASSIGNED'; page?: number; size?: number }): Observable<any> {
      const headers = this.getAuthHeaders();
      const q = new URLSearchParams();
      if (params?.q) q.set('q', params.q);
      if (params?.status) q.set('status', params.status);
      if (params?.assigned) q.set('assigned', params.assigned);
      q.set('page', String(params?.page ?? 0));
      q.set('size', String(params?.size ?? 20));
      const query = q.toString();
      return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/cabinets/hooks${query ? `?${query}` : ''}`, headers);
    }

    getHookStats(orgId: string, cabinetId: string): Observable<any> {
     const headers = this.getAuthHeaders();
     return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/cabinets/${cabinetId}/hooks/stats`, headers);
    }

    getCabinetHooksStats(orgId: string): Observable<any> {
      const headers = this.getAuthHeaders();
      return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/cabinets/hooks/stats`, headers);
    }

    getHook(orgId: string, cabinetId: string, hookId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/cabinets/${cabinetId}/hooks/${hookId}`, headers);
   }

   addHook(orgId: string, cabinetId: string, data: { hookNo?: number; label?: string; status?: string; notes?: string }): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(this.auth.getAccessToken() ? { Authorization: `Bearer ${this.auth.getAccessToken()}` } : {})
    });
    return this.api.post<any>(`/api/v1/keyvault/organizations/${orgId}/cabinets/${cabinetId}/hooks`, data, headers);
   }

   autoGenerateHooks(orgId: string, cabinetId: string, count?: number): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(this.auth.getAccessToken() ? { Authorization: `Bearer ${this.auth.getAccessToken()}` } : {})
    });
    const body = count !== undefined ? { count } : {};
    return this.api.post<any>(`/api/v1/keyvault/organizations/${orgId}/cabinets/${cabinetId}/hooks/auto-generate`, body, headers);
   }

   updateHook(orgId: string, cabinetId: string, hookId: string, data: Partial<KeyHook>): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(this.auth.getAccessToken() ? { Authorization: `Bearer ${this.auth.getAccessToken()}` } : {})
    });
    return this.api.put<any>(`/api/v1/keyvault/organizations/${orgId}/cabinets/${cabinetId}/hooks/${hookId}`, data, headers);
   }

   deleteHook(orgId: string, cabinetId: string, hookId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.delete<any>(`/api/v1/keyvault/organizations/${orgId}/cabinets/${cabinetId}/hooks/${hookId}`, headers);
   }

   assignKeyToHook(orgId: string, cabinetId: string, hookId: string, data: { keyId: string; note?: string }): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(this.auth.getAccessToken() ? { Authorization: `Bearer ${this.auth.getAccessToken()}` } : {})
    });
    return this.api.post<any>(`/api/v1/keyvault/organizations/${orgId}/cabinets/${cabinetId}/hooks/${hookId}/assign-key`, data, headers);
   }

   removeKeyFromHook(orgId: string, cabinetId: string, hookId: string, data: { reason: string; note?: string }): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(this.auth.getAccessToken() ? { Authorization: `Bearer ${this.auth.getAccessToken()}` } : {})
    });
    return this.api.post<any>(`/api/v1/keyvault/organizations/${orgId}/cabinets/${cabinetId}/hooks/${hookId}/remove-key`, data, headers);
   }

   getSubscriptionUsage(orgId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/subscription/usage`, headers);
  }

  getSubscription(orgId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.api.get<any>(`/api/v1/keyvault/organizations/${orgId}/subscription`, headers);
  }

  startTrialSubscription(orgId: string, planId: string): Observable<any> {
    const token = this.auth.getAccessToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
    return this.api.post<any>(`/api/v1/subscriptions/organizations/${orgId}/services/key-vault/start`, { planId, billingPeriod: 'MONTHLY', useTrial: true }, headers);
  }

   moveKeyToHook(orgId: string, cabinetId: string, hookId: string, data: { targetHookId: string; note?: string }): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(this.auth.getAccessToken() ? { Authorization: `Bearer ${this.auth.getAccessToken()}` } : {})
    });
    return this.api.post<any>(`/api/v1/keyvault/organizations/${orgId}/cabinets/${cabinetId}/hooks/${hookId}/move-key`, data, headers);
   }
}
