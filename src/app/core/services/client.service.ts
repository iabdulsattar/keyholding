import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { KeyVaultService } from './keyvault.service';

export interface PaginatedResult<T> {
  items: T[];
  totalItems: number;
  page: number;
  size: number;
  totalPages: number;
}

export interface KeyRecord {
  id: string;
  keyCode: string;
  name: string;
  type: string;
  typeColor: string;
  site: string;
  siteName: string;
  status: 'In Storage' | 'Issued' | 'In Use' | 'Overdue' | 'Lost' | 'Damaged' | 'Damaged / Lost';
  statusColor: string;
  storageLocation: string;
  storageDetail: string;
  assignedTo: string;
  lastMovement: string;
  lastMovementTime: string;
  clientId?: string;
  clientName?: string;
}

export interface SiteRecord {
  id: string;
  code: string;
  name: string;
  type: string;
  typeColor: string;
  address: string;
  contact: string;
  status: 'Active' | 'Inactive';
  keys: number;
  jobs: number;
  clientId?: string;
  clientName?: string;
}

export interface Client {
  id: string;
  code: string;
  name: string;
  email: string;
  region: string;
  status: 'Active' | 'Inactive' | 'Pending';
  sites: number;
  users: number;
  created: string;
  lastUpdated?: string;
  phone?: string;
  website?: string;
  address?: string;
  industry?: string;
  vatNumber?: string;
  registrationNumber?: string;
  contactPerson?: string;
  designation?: string;
  contactEmail?: string;
  notes?: string;
}

export interface ContactRecord {
  id: string;
  code?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  jobTitle?: string;
  email?: string;
  phone?: string;
  department?: string;
  primaryContact: boolean;
  status: 'Active' | 'Inactive';
  preferredMethod?: string;
  address?: string;
  notes?: string;
  clientId?: string;
}

export interface AuditRecord {
  id: string;
  targetType: string;
  targetId: string;
  action: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  constructor(private keyVault: KeyVaultService) {}

  private getOrgId(): string | null {
    return localStorage.getItem('organizationId') || localStorage.getItem('org_id');
  }

  private formatDate(value: any): string {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  private formatDateTime(value: any): string {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return String(value);
    const datePart = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const timePart = date.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' });
    return `${datePart}, ${timePart}`;
  }

  listClients(params?: { q?: string; status?: string; region?: string; page?: number; size?: number }): Observable<PaginatedResult<Client>> {
    const orgId = this.getOrgId();
    if (!orgId) return of({ items: [], totalItems: 0, page: 0, size: 10, totalPages: 0 });
    const page = params?.page ?? 0;
    const size = params?.size ?? 10;
    return this.keyVault.listClients(orgId, { q: params?.q, status: params?.status, region: params?.region, page, size }).pipe(
      map((res: any) => {
        const data = res?.data ?? res ?? {};
        const items = (data.items ?? data.data ?? data ?? []).map((item: any) => this.mapClient(item));
        const totalItems = data.totalItems ?? data.total ?? items.length;
        const totalPages = data.totalPages ?? Math.max(1, Math.ceil(totalItems / size));
        return { items, totalItems, page, size, totalPages };
      })
    );
  }

  getClientByCode(code: string): Observable<Client | undefined> {
    const orgId = this.getOrgId();
    if (!orgId) return of(undefined);
    return this.keyVault.getClient(orgId, code).pipe(
      map((res: any) => {
        const item = res?.data ?? res;
        return item ? this.mapClient(item) : undefined;
      })
    );
  }

  getClientById(orgId: string, clientId: string): Observable<Client | undefined> {
    return this.keyVault.getClient(orgId, clientId).pipe(
      map((res: any) => {
        const item = res?.data ?? res;
        return item ? this.mapClient(item) : undefined;
      })
    );
  }

  createClient(client: Client): Observable<Client> {
    const orgId = this.getOrgId();
    if (!orgId) return of(client);
    const payload: any = {
      ...client,
      status: client.status === 'Active' ? 'ACTIVE' : client.status === 'Inactive' ? 'INACTIVE' : 'PENDING',
      vatTaxNumber: client.vatNumber,
    };
    return this.keyVault.createClient(orgId, payload).pipe(
      map((res: any) => this.mapClient(res?.data ?? res))
    );
  }

  updateClient(clientId: string, client: Partial<Client>): Observable<Client> {
    const orgId = this.getOrgId();
    if (!orgId) return of(client as Client);
    const payload: any = {
      ...client,
      status: client.status === 'Active' ? 'ACTIVE' : client.status === 'Inactive' ? 'INACTIVE' : 'PENDING',
      vatTaxNumber: client.vatNumber,
    };
    return this.keyVault.updateClient(orgId, clientId, payload).pipe(
      map((res: any) => this.mapClient(res?.data ?? res))
    );
  }

  deactivateClient(clientId: string): Observable<any> {
    const orgId = this.getOrgId();
    if (!orgId) return of(null);
    return this.keyVault.deactivateClient(orgId, clientId);
  }

  reactivateClient(clientId: string): Observable<any> {
    const orgId = this.getOrgId();
    if (!orgId) return of(null);
    return this.keyVault.reactivateClient(orgId, clientId);
  }

  getClientStats(): Observable<any> {
    const orgId = this.getOrgId();
    if (!orgId) return of(null);
    return this.keyVault.getClientStats(orgId);
  }

  getSiteStats(clientId: string): Observable<any> {
    const orgId = this.getOrgId();
    if (!orgId) return of(null);
    return this.keyVault.getSiteStats(orgId, clientId);
  }

  getOrgSiteStats(): Observable<any> {
    const orgId = this.getOrgId();
    if (!orgId) return of(null);
    return this.keyVault.getOrgSiteStats(orgId);
  }

  listDocuments(clientId: string, params?: { q?: string; category?: string; documentType?: string; page?: number; size?: number }): Observable<PaginatedResult<any>> {
    const orgId = this.getOrgId();
    if (!orgId) return of({ items: [], totalItems: 0, page: 0, size: 10, totalPages: 0 });
    const page = params?.page ?? 0;
    const size = params?.size ?? 10;
    return this.keyVault.listDocuments(orgId, clientId, { q: params?.q, category: params?.category, documentType: params?.documentType, page, size }).pipe(
      map((res: any) => {
        const data = res?.data ?? res ?? {};
        const items = (data.items ?? data.data ?? data ?? []).map((item: any) => item);
        const totalItems = data.totalItems ?? data.total ?? items.length;
        const totalPages = data.totalPages ?? Math.max(1, Math.ceil(totalItems / size));
        return { items, totalItems, page, size, totalPages };
      })
    );
  }

  getDocumentStats(clientId: string): Observable<any> {
    const orgId = this.getOrgId();
    if (!orgId) return of(null);
    return this.keyVault.getDocumentStats(orgId, clientId);
  }

  getDocument(clientId: string, documentId: string): Observable<any> {
    const orgId = this.getOrgId();
    if (!orgId) return of(null);
    return this.keyVault.getDocument(orgId, clientId, documentId);
  }

  createDocument(clientId: string, file: File, name: string, category: string, documentType: string, description?: string): Observable<any> {
    const orgId = this.getOrgId();
    if (!orgId) return of(null);
    return this.keyVault.uploadDocument(orgId, clientId, file, name, category, documentType, description);
  }

  updateDocument(clientId: string, documentId: string, params: { name?: string; category?: string }): Observable<any> {
    const orgId = this.getOrgId();
    if (!orgId) return of(null);
    return this.keyVault.updateDocument(orgId, clientId, documentId, params);
  }

  deleteDocument(clientId: string, documentId: string): Observable<any> {
    const orgId = this.getOrgId();
    if (!orgId) return of(null);
    return this.keyVault.deleteDocument(orgId, clientId, documentId);
  }

  downloadDocument(clientId: string, documentId: string): Observable<Blob> {
    const orgId = this.getOrgId();
    if (!orgId) throw new Error('No organization ID');
    return this.keyVault.downloadDocument(orgId, clientId, documentId);
  }

  getKeysByClient(clientCode: string): Observable<KeyRecord[]> {
    const orgId = this.getOrgId();
    if (!orgId) return of([]);
    return this.keyVault.listKeys(orgId, { clientId: clientCode, size: 100 }).pipe(
      map((res: any) => {
        const items = res?.data?.items ?? res?.items ?? res?.data ?? res ?? [];
        return items.map((item: any) => this.mapKey(item));
      })
    );
  }

  getSitesByClient(clientCode: string): Observable<SiteRecord[]> {
    const orgId = this.getOrgId();
    if (!orgId) return of([]);
    return this.keyVault.listSites(orgId, clientCode, { size: 100 }).pipe(
      map((res: any) => {
        const items = res?.data?.items ?? res?.items ?? res?.data ?? res ?? [];
        return items.map((item: any) => this.mapSite(item));
      })
    );
  }

  listAllSites(params?: { q?: string; status?: string; siteType?: string; page?: number; size?: number }): Observable<PaginatedResult<SiteRecord>> {
    const orgId = this.getOrgId();
    if (!orgId) return of({ items: [], totalItems: 0, page: 0, size: 10, totalPages: 0 });
    const page = params?.page ?? 0;
    const size = params?.size ?? 10;
    return this.keyVault.listAllSites(orgId, { q: params?.q, status: params?.status, siteType: params?.siteType, page, size }).pipe(
      map((res: any) => {
        const data = res?.data ?? res ?? {};
        const items = (data.items ?? data.data ?? data ?? []).map((item: any) => this.mapSite(item));
        const totalItems = data.totalItems ?? data.total ?? items.length;
        const totalPages = data.totalPages ?? Math.max(1, Math.ceil(totalItems / size));
        return { items, totalItems, page, size, totalPages };
      })
    );
  }

  getSiteById(orgId: string, siteId: string): Observable<any> {
    return this.keyVault.getSite(orgId, siteId);
  }

  updateSite(orgId: string, siteId: string, site: Partial<any>): Observable<any> {
    return this.keyVault.updateSite(orgId, siteId, site);
  }

  deactivateSite(orgId: string, siteId: string): Observable<any> {
    return this.keyVault.deactivateSite(orgId, siteId);
  }

  reactivateSite(orgId: string, siteId: string): Observable<any> {
    return this.keyVault.reactivateSite(orgId, siteId);
  }

  deleteSite(orgId: string, siteId: string): Observable<any> {
    return this.keyVault.deleteSite(orgId, siteId);
  }

  createSite(orgId: string, clientId: string, site: any): Observable<any> {
    return this.keyVault.createSite(orgId, clientId, site);
  }

  listContacts(clientId: string, params?: { q?: string; status?: string; department?: string; page?: number; size?: number }): Observable<PaginatedResult<ContactRecord>> {
    const orgId = this.getOrgId();
    if (!orgId) return of({ items: [], totalItems: 0, page: 0, size: 10, totalPages: 0 });
    const page = params?.page ?? 0;
    const size = params?.size ?? 10;
    return this.keyVault.listContacts(orgId, clientId, { q: params?.q, status: params?.status, department: params?.department, page, size }).pipe(
      map((res: any) => {
        const data = res?.data ?? res ?? {};
        const meta = res?.meta ?? data?.meta ?? {};
        const items = (Array.isArray(data) ? data : (data.items ?? data.data ?? data ?? [])).map((item: any) => this.mapContact(item));
        const totalItems = data.totalItems ?? data.total ?? meta.totalElements ?? items.length;
        const totalPages = data.totalPages ?? meta.totalPages ?? Math.max(1, Math.ceil(totalItems / size));
        return { items, totalItems, page, size, totalPages };
      })
    );
  }

  getContact(clientId: string, contactId: string): Observable<ContactRecord | undefined> {
    const orgId = this.getOrgId();
    if (!orgId) return of(undefined);
    return this.keyVault.getContact(orgId, clientId, contactId).pipe(
      map((res: any) => {
        const item = res?.data ?? res;
        return item ? this.mapContact(item) : undefined;
      })
    );
  }

   createContact(clientId: string, contact: Partial<ContactRecord>): Observable<ContactRecord> {
     const orgId = this.getOrgId();
     if (!orgId) return of({} as ContactRecord);
     const fullName = `${contact.firstName ?? ''} ${contact.lastName ?? ''}`.trim();
     const payload: any = {
       ...contact,
       fullName: contact.fullName || fullName || `${contact.firstName ?? ''} ${contact.lastName ?? ''}`.trim(),
       status: contact.status === 'Inactive' ? 'INACTIVE' : 'ACTIVE',
     };
     return this.keyVault.createContact(orgId, clientId, payload).pipe(
       map((res: any) => this.mapContact(res?.data ?? res))
     );
   }

   updateContact(clientId: string, contactId: string, contact: Partial<ContactRecord>): Observable<ContactRecord> {
     const orgId = this.getOrgId();
     if (!orgId) return of({} as ContactRecord);
     const fullName = `${contact.firstName ?? ''} ${contact.lastName ?? ''}`.trim();
     const payload: any = {
       ...contact,
       fullName: contact.fullName || fullName || `${contact.firstName ?? ''} ${contact.lastName ?? ''}`.trim(),
     };
     if (payload.status) {
       payload.status = payload.status === 'Inactive' ? 'INACTIVE' : 'ACTIVE';
     }
     return this.keyVault.updateContact(orgId, clientId, contactId, payload).pipe(
       map((res: any) => this.mapContact(res?.data ?? res))
     );
   }

  deactivateContact(clientId: string, contactId: string): Observable<any> {
    const orgId = this.getOrgId();
    if (!orgId) return of(null);
    return this.keyVault.deactivateContact(orgId, clientId, contactId);
  }

  reactivateContact(clientId: string, contactId: string): Observable<any> {
    const orgId = this.getOrgId();
    if (!orgId) return of(null);
    return this.keyVault.reactivateContact(orgId, clientId, contactId);
  }

  deleteContact(clientId: string, contactId: string): Observable<any> {
    const orgId = this.getOrgId();
    if (!orgId) return of(null);
    return this.keyVault.deleteContact(orgId, clientId, contactId);
  }

  listAuditLog(params?: { targetType?: string; targetId?: string; page?: number; size?: number }): Observable<PaginatedResult<AuditRecord>> {
    const orgId = this.getOrgId();
    if (!orgId) return of({ items: [], totalItems: 0, page: 0, size: 10, totalPages: 0 });
    const page = params?.page ?? 0;
    const size = params?.size ?? 50;
    return this.keyVault.listAuditLog(orgId, { targetType: params?.targetType, targetId: params?.targetId, page, size }).pipe(
      map((res: any) => {
        const data = res?.data ?? res ?? {};
        const items = (data.items ?? data.data ?? data ?? []).map((item: any) => this.mapAudit(item));
        const totalItems = data.totalItems ?? data.total ?? items.length;
        const totalPages = data.totalPages ?? Math.max(1, Math.ceil(totalItems / size));
        return { items, totalItems, page, size, totalPages };
      })
    );
  }

  listEntityAuditLog(targetType: string, targetId: string, params?: { page?: number; size?: number }): Observable<PaginatedResult<AuditRecord>> {
    const orgId = this.getOrgId();
    if (!orgId) return of({ items: [], totalItems: 0, page: 0, size: 10, totalPages: 0 });
    const page = params?.page ?? 0;
    const size = params?.size ?? 50;
    return this.keyVault.listEntityAuditLog(orgId, targetType, targetId, { page, size }).pipe(
      map((res: any) => {
        const data = res?.data ?? res ?? {};
        const items = (data.items ?? data.data ?? data ?? []).map((item: any) => this.mapAudit(item));
        const totalItems = data.totalItems ?? data.total ?? items.length;
        const totalPages = data.totalPages ?? Math.max(1, Math.ceil(totalItems / size));
        return { items, totalItems, page, size, totalPages };
      })
    );
  }

  listAllKeys(params?: { q?: string; status?: string; page?: number; size?: number }): Observable<PaginatedResult<KeyRecord>> {
    const orgId = this.getOrgId();
    if (!orgId) return of({ items: [], totalItems: 0, page: 0, size: 10, totalPages: 0 });
    const page = params?.page ?? 0;
    const size = params?.size ?? 10;
    return this.keyVault.listAllKeys(orgId, { q: params?.q, status: params?.status, page, size }).pipe(
      map((res: any) => {
        const data = res?.data ?? res ?? {};
        const items = (data.items ?? data.data ?? data ?? []).map((item: any) => this.mapKey(item));
        const totalItems = data.totalItems ?? data.total ?? items.length;
        const totalPages = data.totalPages ?? Math.max(1, Math.ceil(totalItems / size));
        return { items, totalItems, page, size, totalPages };
      })
    );
  }

  private mapClient(item: any): Client {
    return {
      id: item.id ?? '',
      code: item.code ?? item.clientCode ?? '',
      name: item.name ?? '',
      email: item.email ?? '',
      region: item.region ?? '',
      status: item.status === 'INACTIVE' ? 'Inactive' : item.status === 'PENDING' ? 'Pending' : 'Active',
      sites: item.sites ?? 0,
      users: item.users ?? 0,
      created: this.formatDate(item.createdAt ?? item.created),
      lastUpdated: this.formatDateTime(item.updatedAt ?? item.lastUpdated ?? item.modifiedAt),
      phone: item.phone ?? item.phoneNumber,
      website: item.website,
      address: item.address,
      industry: item.industry,
      vatNumber: item.vatTaxNumber,
      registrationNumber: item.registrationNumber,
      contactPerson: item.contactPerson,
      designation: item.designation,
      contactEmail: item.contactEmail,
      notes: item.notes,
    };
  }

  private mapSite(item: any): SiteRecord {
    const typeColorMap: Record<string, string> = {
      Office: 'blue',
      Warehouse: 'amber',
      Retail: 'emerald',
      'Distribution Centre': 'purple',
      'Data Centre': 'violet',
      Storage: 'slate',
      'Construction Site': 'orange',
      'Remote Office': 'cyan',
      Other: 'gray',
    };
    return {
      id: item.id ?? '',
      code: item.siteCode ?? item.code ?? '',
      name: item.name ?? '',
      type: item.siteType ?? item.type ?? '',
      typeColor: typeColorMap[item.siteType ?? item.type ?? ''] || 'blue',
      address: item.address ?? [item.addressLine1, item.addressLine2, item.city, item.postcode, item.country].filter(Boolean).join(', '),
      contact: item.primaryContactName ?? '',
      status: item.status === 'INACTIVE' ? 'Inactive' : 'Active',
      keys: item.keys ?? item.keyCount ?? 0,
      jobs: item.jobs ?? item.jobCount ?? 0,
      clientId: item.clientId ?? item.client?.id,
      clientName: item.clientName ?? item.client?.name,
    };
  }

   private mapKey(item: any): KeyRecord {
     const statusMap: Record<string, KeyRecord['status']> = {
       'IN_STORAGE': 'In Storage',
       'ISSUED': 'Issued',
       'IN_USE': 'In Use',
       'OVERDUE': 'Overdue',
       'DAMAGED': 'Damaged',
       'LOST': 'Lost',
       'LOST_DAMAGED': 'Damaged / Lost',
       'DAMAGED_LOST': 'Damaged / Lost',
     };
     const typeColorMap: Record<string, string> = {
       'Master Key': 'blue',
       'Door Key': 'emerald',
       'Alarm Key': 'violet',
       'Gate Key': 'orange',
       'Utility Key': 'cyan',
       'Office Key': 'indigo',
       'IT Key': 'violet',
     };
     const statusColorMap: Record<string, string> = {
       'In Storage': 'emerald',
       'Issued': 'blue',
       'In Use': 'indigo',
       'Overdue': 'orange',
       'Damaged': 'violet',
       'Lost': 'rose',
       'Damaged / Lost': 'rose',
     };
     const rawStatus = item.status ?? 'IN_STORAGE';
     const mappedStatus = statusMap[rawStatus] ?? 'In Storage';
     return {
       id: item.id ?? '',
       keyCode: item.keyCode ?? item.code ?? '',
       name: item.name ?? '',
       type: item.keyTypeName ?? item.type ?? '',
       typeColor: typeColorMap[item.keyTypeName ?? item.type ?? ''] || 'blue',
       site: item.siteId ?? '',
       siteName: item.siteName ?? '',
       status: mappedStatus,
       statusColor: rawStatus === 'LOST' || rawStatus === 'LOST_DAMAGED' || rawStatus === 'DAMAGED_LOST' ? 'rose' : statusColorMap[mappedStatus] || 'emerald',
       storageLocation: item.storageLocationName ?? item.storageLocation ?? '',
       storageDetail: '',
       assignedTo: item.assignedToUserName ?? '',
       lastMovement: '',
       lastMovementTime: '',
       clientId: item.clientId ?? item.client?.id,
       clientName: item.clientName ?? item.client?.name,
     };
   }

   private mapContact(item: any): ContactRecord {
     const fullName = item.fullName || `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim();
     const firstName = item.firstName ?? (item.fullName ? item.fullName.split(' ')[0] : '');
     const lastName = item.lastName ?? (item.fullName ? item.fullName.replace(/^\S+\s*/, '') : '');
     return {
       id: item.id ?? '',
       code: item.code ?? '',
       firstName: firstName,
       lastName: lastName,
       fullName: fullName,
       jobTitle: item.jobTitle,
       email: item.email,
       phone: item.phone,
       department: item.department,
       primaryContact: item.primaryContact ?? false,
       status: item.status === 'INACTIVE' ? 'Inactive' : 'Active',
       preferredMethod: item.preferredMethod,
       address: item.address,
       notes: item.notes,
       clientId: item.clientId,
     };
   }

   private mapAudit(item: any): AuditRecord {
     return {
       id: item.id ?? '',
       targetType: item.targetType ?? '',
       targetId: item.targetId ?? '',
       action: item.action ?? '',
       userId: item.userId,
       userName: item.userName,
       userRole: item.userRole,
       details: item.details,
       ipAddress: item.ipAddress,
       createdAt: item.createdAt ?? '',
     };
   }
}

