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
  name: string;
  type: string;
  typeColor: string;
  site: string;
  status: 'In Storage' | 'Issued' | 'In Use' | 'Overdue' | 'Lost';
  statusColor: string;
  storageLocation: string;
  storageDetail: string;
  assignedTo: string;
  lastMovement: string;
  lastMovementTime: string;
}

export interface SiteRecord {
  code: string;
  name: string;
  type: string;
  typeColor: string;
  address: string;
  contact: string;
  status: 'Active' | 'Inactive';
  keys: number;
  jobs: number;
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

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  constructor(private keyVault: KeyVaultService) {}

  private getOrgId(): string | null {
    return localStorage.getItem('organizationId') || localStorage.getItem('org_id');
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
    return this.keyVault.getClientStats(orgId).pipe(
      map((res: any) => {
        const clients = res?.data?.clients ?? res?.clients ?? [];
        return clients.find((c: any) => c.code === code) as Client | undefined;
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

  private mapClient(item: any): Client {
    return {
      id: item.id ?? '',
      code: item.code ?? '',
      name: item.name ?? '',
      email: item.email ?? '',
      region: item.region ?? '',
      status: item.status === 'INACTIVE' ? 'Inactive' : item.status === 'PENDING' ? 'Pending' : 'Active',
      sites: item.sites ?? 0,
      users: item.users ?? 0,
      created: item.createdAt ?? item.created ?? '',
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
    return {
      code: item.code ?? '',
      name: item.name ?? '',
      type: item.siteType ?? item.type ?? '',
      typeColor: 'blue',
      address: [item.addressLine1, item.addressLine2, item.city, item.postcode, item.country].filter(Boolean).join(', '),
      contact: item.primaryContactName ?? '',
      status: item.status === 'INACTIVE' ? 'Inactive' : 'Active',
      keys: 0,
      jobs: 0,
    };
  }

  private mapKey(item: any): KeyRecord {
    const statusMap: Record<string, KeyRecord['status']> = {
      'IN_STORAGE': 'In Storage',
      'ISSUED': 'Issued',
      'IN_USE': 'In Use',
      'OVERDUE': 'Overdue',
      'LOST': 'Lost',
    };
    return {
      id: item.code ?? item.id ?? '',
      name: item.name ?? '',
      type: item.type ?? '',
      typeColor: 'blue',
      site: item.siteId ?? '',
      status: statusMap[item.status] ?? 'In Storage',
      statusColor: 'emerald',
      storageLocation: item.storageLocation ?? '',
      storageDetail: '',
      assignedTo: '',
      lastMovement: '',
      lastMovementTime: '',
    };
  }
}
