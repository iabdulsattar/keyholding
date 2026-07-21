import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

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
  private clients: Client[] = [
    { code: 'CLT-1001', name: 'Metro Security Services', email: 'contact@metrosecurity.co.uk', region: 'London, UK', status: 'Active', sites: 12, users: 28, created: '15 May 2024', phone: '+44 020 7946 0958', website: 'https://metrosecurity.co.uk', address: '25 Fenchurch Street, London, EC3M 3AY, UK', industry: 'Security Services', vatNumber: 'GB123456789', registrationNumber: '09876543', contactPerson: 'James Walker', designation: 'Operations Manager', contactEmail: 'james.walker@metrosecurity.co.uk', notes: 'Primary security services provider for corporate clients in London.' },
    { code: 'CLT-1002', name: 'SecurePlus Ltd.', email: 'info@secureplus.com', region: 'Manchester, UK', status: 'Active', sites: 8, users: 16, created: '10 May 2024' },
    { code: 'CLT-1003', name: 'Guardian Keyholding', email: 'hello@guardiankey.co.uk', region: 'Birmingham, UK', status: 'Active', sites: 6, users: 14, created: '08 May 2024' },
    { code: 'CLT-1004', name: 'Alpha Facilities Group', email: 'admin@alphafacilities.co.uk', region: 'Leeds, UK', status: 'Active', sites: 10, users: 22, created: '05 May 2024' },
    { code: 'CLT-1005', name: 'Northshield Services', email: 'operations@northshield.com', region: 'Newcastle, UK', status: 'Inactive', sites: 5, users: 10, created: '28 Apr 2024' },
    { code: 'CLT-1006', name: 'SafeGuard Solutions', email: 'support@safeguard.solutions', region: 'Bristol, UK', status: 'Active', sites: 7, users: 12, created: '22 Apr 2024' },
    { code: 'CLT-1007', name: 'Delta Security Ltd.', email: 'info@deltasecurity.co.uk', region: 'Glasgow, UK', status: 'Pending', sites: 3, users: 5, created: '18 May 2024' },
    { code: 'CLT-1008', name: 'Central Key Services', email: 'contact@centralkeys.co.uk', region: 'Nottingham, UK', status: 'Active', sites: 4, users: 8, created: '12 Apr 2024' },
    { code: 'CLT-1009', name: 'Premier Security Ops', email: 'enquiries@premiersecops.com', region: 'Liverpool, UK', status: 'Inactive', sites: 2, users: 4, created: '01 Apr 2024' },
    { code: 'CLT-1010', name: 'Titan Key Holding', email: 'hello@titankeyholding.co.uk', region: 'Sheffield, UK', status: 'Active', sites: 9, users: 18, created: '30 Mar 2024' }
  ];

  listClients(): Observable<Client[]> {
    return of([...this.clients]);
  }

  getClientByCode(code: string): Observable<Client | undefined> {
    return of(this.clients.find(c => c.code === code));
  }

  createClient(client: Client): Observable<Client> {
    this.clients = [client, ...this.clients];
    return of(client);
  }

  private keys: KeyRecord[] = [
    { id: 'KEY-000156', name: 'Master Key', type: 'Master Key', typeColor: 'blue', site: 'Head Office', status: 'In Storage', statusColor: 'emerald', storageLocation: 'Head Office Safe', storageDetail: 'Cabinet A - Hook 12', assignedTo: '—', lastMovement: '15 May 2024', lastMovementTime: '10:30 AM' },
    { id: 'KEY-000155', name: 'Front Door Key', type: 'Door Key', typeColor: 'emerald', site: 'Head Office', status: 'Issued', statusColor: 'amber', storageLocation: '—', storageDetail: '', assignedTo: 'James Walker', lastMovement: '15 May 2024', lastMovementTime: '09:15 AM' },
    { id: 'KEY-000154', name: 'Alarm Keypad Key', type: 'Alarm Key', typeColor: 'purple', site: 'Head Office', status: 'In Storage', statusColor: 'emerald', storageLocation: 'Head Office Safe', storageDetail: 'Cabinet B - Hook 03', assignedTo: '—', lastMovement: '14 May 2024', lastMovementTime: '04:10 PM' },
    { id: 'KEY-000153', name: 'Warehouse Gate Key', type: 'Gate Key', typeColor: 'amber', site: 'Warehouse', status: 'In Use', statusColor: 'blue', storageLocation: '—', storageDetail: '', assignedTo: 'Sarah Miller', lastMovement: '15 May 2024', lastMovementTime: '08:45 AM' },
    { id: 'KEY-000152', name: 'Plant Room Key', type: 'Utility Key', typeColor: 'cyan', site: 'Warehouse', status: 'In Storage', statusColor: 'emerald', storageLocation: 'Warehouse Safe', storageDetail: 'Cabinet A - Hook 07', assignedTo: '—', lastMovement: '13 May 2024', lastMovementTime: '02:20 PM' },
    { id: 'KEY-000151', name: 'Fire Exit Key', type: 'Door Key', typeColor: 'emerald', site: 'Retail Store - High St', status: 'Overdue', statusColor: 'rose', storageLocation: '—', storageDetail: '', assignedTo: 'David Lee', lastMovement: '10 May 2024', lastMovementTime: '11:05 AM' },
    { id: 'KEY-000150', name: 'Delivery Office Key', type: 'Office Key', typeColor: 'slate', site: 'Retail Store - High St', status: 'Lost', statusColor: 'slate', storageLocation: '—', storageDetail: '', assignedTo: '—', lastMovement: '02 May 2024', lastMovementTime: '01:30 PM' },
    { id: 'KEY-000149', name: 'Server Room Key', type: 'IT Key', typeColor: 'indigo', site: 'Data Centre', status: 'In Storage', statusColor: 'emerald', storageLocation: 'Data Centre Safe', storageDetail: 'Cabinet C - Hook 01', assignedTo: '—', lastMovement: '14 May 2024', lastMovementTime: '03:45 PM' }
  ];

  getKeysByClient(clientCode: string): Observable<KeyRecord[]> {
    return of([...this.keys]);
  }

  private sites: SiteRecord[] = [
    { code: 'SITE-00012', name: 'Head Office', type: 'Office', typeColor: 'blue', address: '25 Fenchurch Street, London, EC3M 3AY, UK', contact: 'James Walker', status: 'Active', keys: 48, jobs: 86 },
    { code: 'SITE-00011', name: 'Warehouse', type: 'Warehouse', typeColor: 'purple', address: 'Unit 4, Industrial Park, London, E16 2HB, UK', contact: 'Sarah Miller', status: 'Active', keys: 32, jobs: 64 },
    { code: 'SITE-00010', name: 'Retail Store - High St', type: 'Retail', typeColor: 'amber', address: '142 High Street, London, W1A 1AA, UK', contact: 'David Lee', status: 'Active', keys: 18, jobs: 42 },
    { code: 'SITE-00009', name: 'Distribution Centre', type: 'Distribution', typeColor: 'orange', address: 'Logistics Way, Barking, IG11 0YZ, UK', contact: 'Emma Roberts', status: 'Active', keys: 24, jobs: 58 },
    { code: 'SITE-00008', name: 'Data Centre', type: 'Data Centre', typeColor: 'cyan', address: 'Tech Park, Docklands, London, E14 9SR, UK', contact: 'Michael Turner', status: 'Active', keys: 16, jobs: 33 },
    { code: 'SITE-00007', name: 'Remote Office', type: 'Office', typeColor: 'blue', address: '3 Station Road, Croydon, CR0 2EE, UK', contact: 'James Walker', status: 'Inactive', keys: 8, jobs: 12 },
    { code: 'SITE-00006', name: 'Construction Site A', type: 'Construction', typeColor: 'emerald', address: 'Building Site, Stratford, London, E15 1NG, UK', contact: 'Sarah Miller', status: 'Active', keys: 6, jobs: 18 },
    { code: 'SITE-00005', name: 'Storage Lockup', type: 'Storage', typeColor: 'slate', address: 'Storage Yard, Enfield, EN3 7QA, UK', contact: 'David Lee', status: 'Inactive', keys: 4, jobs: 8 },
    { code: 'SITE-00004', name: 'Westside Hub', type: 'Office', typeColor: 'blue', address: '88 Westway, Acton, W3 6AL, UK', contact: 'Alex Mercer', status: 'Active', keys: 12, jobs: 24 },
    { code: 'SITE-00003', name: 'Southend Facility', type: 'Warehouse', typeColor: 'purple', address: 'Southend Airport Park, SS2 6YF, UK', contact: 'Emma Roberts', status: 'Active', keys: 20, jobs: 39 },
    { code: 'SITE-00002', name: 'City Retail', type: 'Retail', typeColor: 'amber', address: '55 Cheapside, London, EC2V 6AX, UK', contact: 'Michael Turner', status: 'Active', keys: 14, jobs: 29 },
    { code: 'SITE-00001', name: 'North Gateway', type: 'Office', typeColor: 'blue', address: 'North Circular Rd, London, N12 0SH, UK', contact: 'James Walker', status: 'Active', keys: 10, jobs: 15 }
  ];

  getSitesByClient(clientCode: string): Observable<SiteRecord[]> {
    return of([...this.sites]);
  }
}
