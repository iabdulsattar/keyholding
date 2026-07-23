import { Component, OnInit, HostListener } from '@angular/core';
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
    .spinner { width: 1rem; height: 1rem; border: 2px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; vertical-align: middle; }
    @keyframes spin { to { transform: rotate(360deg); } }
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
  selectedFiles: File[] = [];
  attachmentPreviews: { file: File; url: string }[] = [];

  keyTypes: KeyType[] = [];
  keyCategories: KeyCategory[] = [];
  storageLocations: StorageLocation[] = [];
  sites: SiteRecord[] = [];
  clients: Client[] = [];

  typeOpen = false;
  categoryOpen = false;
  filteredTypes: KeyType[] = [];
  filteredCategories: KeyCategory[] = [];
  creatingType = false;
  creatingCategory = false;
  newTypeName = '';
  newCategoryName = '';

  loadingSites = false;
  loadingClients = false;
  catalogLoaded = false;

  private clientId = '';
  private catalogCache: { types: KeyType[]; categories: KeyCategory[]; locations: StorageLocation[] } | null = null;

  constructor(private route: ActivatedRoute, private router: Router, private keyVault: KeyVaultService, private clientService: ClientService, private toast: ToastService) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.clientId = params['clientId'] || '';
    });
    this.loadCatalog();
    this.loadClients();
  }

  loadCatalog(): void {
    if (this.catalogCache) {
      this.keyTypes = this.catalogCache.types;
      this.keyCategories = this.catalogCache.categories;
      this.storageLocations = this.catalogCache.locations;
      this.catalogLoaded = true;
      return;
    }

    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
    if (!orgId) return;

    this.keyVault.listKeyTypes(orgId, false).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res ?? {};
        this.keyTypes = data.items ?? data.data ?? data ?? [];
        this.filteredTypes = [...this.keyTypes];
      },
      complete: () => { this.checkCatalogDone(); }
    });

    this.keyVault.listKeyCategories(orgId, false).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res ?? {};
        this.keyCategories = data.items ?? data.data ?? data ?? [];
        this.filteredCategories = [...this.keyCategories];
      },
      complete: () => { this.checkCatalogDone(); }
    });

    this.keyVault.listStorageLocations(orgId, false).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res ?? {};
        this.storageLocations = data.items ?? data.data ?? data ?? [];
      },
      complete: () => { this.checkCatalogDone(); }
    });
  }

  private checkCatalogDone(): void {
    if (this.keyTypes.length > 0 && this.keyCategories.length > 0 && this.storageLocations.length > 0) {
      this.catalogCache = {
        types: [...this.keyTypes],
        categories: [...this.keyCategories],
        locations: [...this.storageLocations]
      };
      this.catalogLoaded = true;
    }
  }

  loadClients(): void {
    this.loadingClients = true;
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
    if (!orgId) return;
    this.clientService.listClients({ page: 0, size: 100 }).subscribe({
      next: (result: any) => {
        this.clients = result?.items ?? result?.data ?? [];
        if (this.clients.length > 0 && !this.assignClientId) {
          this.assignClient = this.clients[0].name;
          this.assignClientId = this.clients[0].id;
          this.loadSites();
        }
      },
      complete: () => { this.loadingClients = false; }
    });
  }

  loadSites(): void {
    if (!this.assignClientId) {
      this.sites = [];
      return;
    }
    this.loadingSites = true;
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
    if (!orgId) return;
    this.keyVault.listSites(orgId, this.assignClientId, { size: 100 }).subscribe({
      next: (res: any) => {
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
      },
      complete: () => { this.loadingSites = false; }
    });
  }

  onClientChange(): void {
    this.assignSite = '';
    const client = this.clients.find(c => c.id === this.assignClientId);
    this.assignClient = client?.name ?? '';
    this.loadSites();
  }

  toggleTypeDropdown(): void {
    this.typeOpen = !this.typeOpen;
    if (this.typeOpen) {
      this.categoryOpen = false;
      this.filteredTypes = [...this.keyTypes];
      this.creatingType = false;
      this.newTypeName = '';
    }
  }

  toggleCategoryDropdown(): void {
    this.categoryOpen = !this.categoryOpen;
    if (this.categoryOpen) {
      this.typeOpen = false;
      this.filteredCategories = [...this.keyCategories];
      this.creatingCategory = false;
      this.newCategoryName = '';
    }
  }

  selectType(id: string): void {
    this.keyType = id;
    this.typeOpen = false;
    this.creatingType = false;
  }

  selectCategory(id: string): void {
    this.keyCategory = id;
    this.categoryOpen = false;
    this.creatingCategory = false;
  }

  confirmCreateType(): void {
    if (!this.newTypeName.trim()) return;
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
    if (!orgId) return;

    this.keyVault.createKeyType(orgId, { name: this.newTypeName.trim(), active: true }).subscribe((res: any) => {
      const newType = res?.data ?? res;
      this.keyTypes = [...this.keyTypes, newType];
      this.filteredTypes = [...this.keyTypes];
      this.keyType = newType.id ?? '';
      this.creatingType = false;
      this.newTypeName = '';
      this.catalogCache = null;
      this.toast.success('Key type created');
    });
  }

  confirmCreateCategory(): void {
    if (!this.newCategoryName.trim()) return;
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
    if (!orgId) return;

    this.keyVault.createKeyCategory(orgId, { name: this.newCategoryName.trim(), active: true }).subscribe((res: any) => {
      const newCategory = res?.data ?? res;
      this.keyCategories = [...this.keyCategories, newCategory];
      this.filteredCategories = [...this.keyCategories];
      this.keyCategory = newCategory.id ?? '';
      this.creatingCategory = false;
      this.newCategoryName = '';
      this.catalogCache = null;
      this.toast.success('Key category created');
    });
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.shadow-lg')) {
      this.typeOpen = false;
      this.categoryOpen = false;
      this.creatingType = false;
      this.creatingCategory = false;
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    Array.from(input.files).forEach(file => {
      this.selectedFiles.push(file);
      const reader = new FileReader();
      reader.onload = () => this.attachmentPreviews.push({ file, url: reader.result as string });
      reader.readAsDataURL(file);
    });
    this.fileName = this.selectedFiles.map(f => f.name).join(', ') || '';
    input.value = '';
  }

  removeAttachment(index: number): void {
    this.selectedFiles.splice(index, 1);
    const url = this.attachmentPreviews[index]?.url;
    this.attachmentPreviews.splice(index, 1);
    if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
    this.fileName = this.selectedFiles.map(f => f.name).join(', ') || '';
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
      this.selectedFiles = [];
      this.attachmentPreviews.forEach(item => { if (item.url.startsWith('blob:')) URL.revokeObjectURL(item.url); });
      this.attachmentPreviews = [];
      this.typeOpen = false;
      this.categoryOpen = false;
      this.creatingType = false;
      this.creatingCategory = false;
      this.newTypeName = '';
      this.newCategoryName = '';
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
      next: (res: any) => {
        const createdKey = res?.data ?? res;
        const keyId = createdKey?.id;
        if (keyId && this.selectedFiles.length) {
          this.uploadAttachments(orgId, keyId);
        } else {
          this.toast.success('Key saved successfully!');
          setTimeout(() => this.router.navigate(['/clients', this.clientId]), 800);
        }
      },
      error: () => {
        this.toast.error('Failed to save key. Please try again.');
      }
    });
  }

  private uploadAttachments(orgId: string, keyId: string): void {
    let pending = this.selectedFiles.length;
    if (!pending) {
      this.toast.success('Key saved successfully!');
      setTimeout(() => this.router.navigate(['/clients', this.clientId]), 800);
      return;
    }

    this.selectedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        this.keyVault.addKeyAttachment(orgId, keyId, {
          fileName: file.name,
          contentType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
          storagePath: reader.result as string,
        }).subscribe({
          next: () => {
            pending--;
            if (pending <= 0) {
              this.toast.success('Key saved successfully!');
              setTimeout(() => this.router.navigate(['/clients', this.clientId]), 800);
            }
          },
          error: () => {
            pending--;
            if (pending <= 0) {
              this.toast.success('Key saved successfully!');
              setTimeout(() => this.router.navigate(['/clients', this.clientId]), 800);
            }
          }
        });
      };
      reader.readAsDataURL(file);
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
