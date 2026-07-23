import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { KeyVaultService, KeyType, KeyCategory, StorageLocation } from '../../core/services/keyvault.service';
import { ClientService, SiteRecord, Client } from '../../core/services/client.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-add-key',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './add-key.component.html',
  styles: `
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
    select { appearance: none; background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 1rem center; background-size: 1rem; }
  `
})
export class AddKeyComponent implements OnInit {
  keyName = '';
  keyId = '';
  keyType = '';
  keyCategory = '';
  keyNotes = '';
  assignClientId = '';
  assignClient = '';
  assignSite = '';
  storageLocation = '';
  keyBrand = '';
  keyModel = '';
  keyColour = '';
  keyTag = '';
  keyStatus = 'In Storage';
  fileName = '';

  keyTypes: KeyType[] = [];
  keyCategories: KeyCategory[] = [];
  storageLocations: StorageLocation[] = [];
  sites: SiteRecord[] = [];
  clients: Client[] = [];

  creatingType = false;
  creatingCategory = false;
  creatingStorageLocation = false;
  creatingSite = false;

  newTypeName = '';
  newCategoryName = '';
  newStorageLocationName = '';
  newSiteName = '';

  private clientId = '';

  constructor(private route: ActivatedRoute, private router: Router, private keyVault: KeyVaultService, private clientService: ClientService, private toast: ToastService) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.clientId = params['clientId'] || '';
    });
    this.loadCatalog();
    this.loadClients();
  }

  loadCatalog(): void {
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
    if (!orgId) return;

    this.keyVault.listKeyTypes(orgId, false).subscribe((res: any) => {
      const data = res?.data ?? res ?? {};
      this.keyTypes = data.items ?? data.data ?? data ?? [];
    });

    this.keyVault.listKeyCategories(orgId, false).subscribe((res: any) => {
      const data = res?.data ?? res ?? {};
      this.keyCategories = data.items ?? data.data ?? data ?? [];
    });

    this.keyVault.listStorageLocations(orgId, false).subscribe((res: any) => {
      const data = res?.data ?? res ?? {};
      this.storageLocations = data.items ?? data.data ?? data ?? [];
    });
  }

  loadClients(): void {
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
    if (!orgId) return;
    this.clientService.listClients({ page: 0, size: 100 }).subscribe((result: any) => {
      this.clients = result?.items ?? result?.data ?? [];
      if (this.clients.length > 0 && !this.assignClientId) {
        this.assignClient = this.clients[0].name;
        this.assignClientId = this.clients[0].id;
        this.loadSites();
      }
    });
  }

  loadSites(): void {
    if (!this.assignClientId) {
      this.sites = [];
      return;
    }
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
    if (!orgId) return;
    this.keyVault.listSites(orgId, this.assignClientId, { size: 100 }).subscribe((res: any) => {
      const data = res?.data ?? res ?? {};
      const items = data.items ?? data.data ?? data ?? [];
      this.sites = items.map((item: any) => ({
        id: item.id ?? '',
        code: item.siteCode ?? item.code ?? '',
        name: item.name ?? '',
        type: item.siteType ?? item.type ?? '',
        typeColor: 'blue',
        address: item.address ?? '',
        contact: item.primaryContactName ?? '',
        status: item.status === 'INACTIVE' ? 'Inactive' : 'Active',
        keys: 0,
        jobs: 0,
      }));
    });
  }

  onClientChange(): void {
    this.assignSite = '';
    const client = this.clients.find(c => c.id === this.assignClientId);
    this.assignClient = client?.name ?? '';
    this.loadSites();
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.fileName = input.files[0].name;
    }
  }

  resetForm(): void {
    if (confirm('Are you sure you want to clear your changes?')) {
      this.keyName = '';
      this.keyId = '';
      this.keyType = '';
      this.keyCategory = '';
      this.keyNotes = '';
      this.assignClient = this.clients.length > 0 ? this.clients[0].name : '';
      this.assignClientId = this.clients.length > 0 ? this.clients[0].id : '';
      this.assignSite = '';
      this.storageLocation = '';
      this.keyBrand = '';
      this.keyModel = '';
      this.keyColour = '';
      this.keyTag = '';
      this.keyStatus = 'In Storage';
      this.fileName = '';
      this.creatingType = false;
      this.creatingCategory = false;
      this.creatingStorageLocation = false;
      this.creatingSite = false;
      this.newTypeName = '';
      this.newCategoryName = '';
      this.newStorageLocationName = '';
      this.newSiteName = '';
    }
  }

  submitKeyForm(): void {
    const statusMap: Record<string, string> = {
      'In Storage': 'IN_STORAGE',
      'Issued': 'ISSUED',
      'In Use': 'IN_USE',
      'Overdue': 'OVERDUE',
      'Lost / Damaged': 'LOST',
    };

    const key: any = {
      name: this.keyName,
      reference: this.keyId,
      keyTypeId: this.keyType,
      keyCategoryId: this.keyCategory,
      clientId: this.assignClientId,
      siteId: this.assignSite,
      storageLocationId: this.storageLocation,
      makeBrand: this.keyBrand,
      model: this.keyModel,
      colour: this.keyColour,
      tagLabel: this.keyTag,
      status: statusMap[this.keyStatus] || 'IN_STORAGE',
      description: this.keyNotes,
    };

    if (!this.clientId) {
      alert('Missing client context. Please add this key from a client page.');
      return;
    }

    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
    if (!orgId) {
      alert('Missing organization context. Please sign in again.');
      return;
    }

    this.keyVault.createKey(orgId, key).subscribe({
      next: () => {
        this.toast.success('Key saved successfully!');
        setTimeout(() => this.router.navigate(['/clients', this.clientId]), 800);
      },
      error: () => {
        this.toast.error('Failed to save key. Please try again.');
      }
    });
  }

  createKeyType(): void {
    if (!this.newTypeName.trim()) return;
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
    if (!orgId) return;

    this.keyVault.createKeyType(orgId, { name: this.newTypeName.trim(), active: true }).subscribe((res: any) => {
      const newType = res?.data ?? res;
      this.keyTypes = [...this.keyTypes, newType];
      this.keyType = newType.id;
      this.creatingType = false;
      this.newTypeName = '';
      this.toast.success('Key type created');
    });
  }

  createKeyCategory(): void {
    if (!this.newCategoryName.trim()) return;
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
    if (!orgId) return;

    this.keyVault.createKeyCategory(orgId, { name: this.newCategoryName.trim(), active: true }).subscribe((res: any) => {
      const newCategory = res?.data ?? res;
      this.keyCategories = [...this.keyCategories, newCategory];
      this.keyCategory = newCategory.id;
      this.creatingCategory = false;
      this.newCategoryName = '';
      this.toast.success('Key category created');
    });
  }

  createStorageLocation(): void {
    if (!this.newStorageLocationName.trim()) return;
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
    if (!orgId) return;

    this.keyVault.createStorageLocation(orgId, { name: this.newStorageLocationName.trim(), active: true }).subscribe((res: any) => {
      const newLocation = res?.data ?? res;
      this.storageLocations = [...this.storageLocations, newLocation];
      this.storageLocation = newLocation.id;
      this.creatingStorageLocation = false;
      this.newStorageLocationName = '';
      this.toast.success('Storage location created');
    });
  }

  createSite(): void {
    if (!this.newSiteName.trim() || !this.assignClientId) return;
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
    if (!orgId) return;

    const payload = { name: this.newSiteName.trim(), status: 'ACTIVE' };

    this.clientService.createSite(orgId, this.assignClientId, payload).subscribe((res: any) => {
      const newSite = res?.data ?? res;
      this.sites = [...this.sites, newSite];
      this.assignSite = newSite.id;
      this.creatingSite = false;
      this.newSiteName = '';
      this.toast.success('Site created');
      this.loadSites();
    });
  }

  get showPreview(): boolean {
    return !!(this.keyName || this.keyId || this.keyType || this.keyCategory || this.assignSite || this.storageLocation);
  }

  get statusClass(): string {
    const map: Record<string, string> = {
      'In Storage': 'bg-emerald-50 text-emerald-600',
      'Issued': 'bg-amber-50 text-amber-600',
      'In Use': 'bg-blue-50 text-blue-600',
      'Overdue': 'bg-purple-50 text-purple-600',
      'Lost / Damaged': 'bg-rose-50 text-rose-600'
    };
    return map[this.keyStatus] || 'bg-slate-100 text-slate-600';
  }
}
