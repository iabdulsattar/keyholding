import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { KeyVaultService, KeyType, KeyCategory, StorageLocation } from '../../core/services/keyvault.service';
import { ClientService, SiteRecord, Client } from '../../core/services/client.service';
import { ToastService } from '../../core/services/toast.service';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

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
    .search-wrap { position: relative; }
    .search-wrap input { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.75rem; font-size: 0.875rem; outline: none; }
    .search-wrap input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
    .create-row { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
    .create-row input { flex: 1; padding: 0.5rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.75rem; font-size: 0.875rem; }
    .spinner { width: 1rem; height: 1rem; border: 2px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; vertical-align: middle; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .dropdown-panel { position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: #fff; border: 1px solid #e2e8f0; border-radius: 0.75rem; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1); z-index: 50; overflow: hidden; }
    .dropdown-panel .search-wrap { padding: 0.5rem; border-bottom: 1px solid #f1f5f9; }
    .dropdown-panel .options-list { max-height: 200px; overflow-y: auto; padding: 0.25rem; }
    .dropdown-panel .option-item { display: flex; align-items: center; gap: 0.625rem; padding: 0.5rem 0.625rem; border-radius: 0.5rem; cursor: pointer; font-size: 0.8125rem; color: #374151; transition: background 0.15s; }
    .dropdown-panel .option-item:hover { background: #f8fafc; }
    .dropdown-panel .option-item.selected { background: #eff6ff; color: #1d4ed8; }
    .dropdown-panel .option-icon { width: 1.5rem; height: 1.5rem; border-radius: 0.375rem; display: flex; align-items: center; justify-content: center; font-size: 0.625rem; font-weight: 700; color: #fff; flex-shrink: 0; text-transform: uppercase; }
    .dropdown-panel .option-icon.type-icon { border-radius: 50%; }
    .dropdown-panel .create-item { display: flex; align-items: center; gap: 0.625rem; padding: 0.5rem 0.625rem; border-radius: 0.5rem; cursor: pointer; font-size: 0.8125rem; color: #2563eb; font-weight: 500; transition: background 0.15s; border-top: 1px solid #f1f5f9; margin-top: 0.25rem; }
    .dropdown-panel .create-item:hover { background: #eff6ff; }
    .dropdown-panel .create-item svg { width: 0.875rem; height: 0.875rem; }
    .empty-state { padding: 1rem; text-align: center; font-size: 0.75rem; color: #94a3b8; }
    .ssr-trigger { display: flex; align-items: center; justify-content: space-between; width: 100%; background: #fff; border: 1px solid #e2e8f0; padding: 0.625rem 0.875rem; border-radius: 0.75rem; font-size: 0.875rem; cursor: pointer; transition: all 0.2s; min-height: 2.5rem; }
    .ssr-trigger:hover { border-color: #93c5fd; }
    .ssr-trigger.open { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
    .ssr-trigger .placeholder { color: #94a3b8; }
    .ssr-trigger .trigger-content { display: flex; align-items: center; gap: 0.5rem; min-width: 0; }
    .ssr-trigger .trigger-content span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
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

  newTypeName = '';
  newCategoryName = '';
  newStorageLocationName = '';

  typeSearch = '';
  categorySearch = '';
  siteSearch = '';
  storageLocationSearch = '';

  filteredKeyTypes: KeyType[] = [];
  filteredKeyCategories: KeyCategory[] = [];
  filteredSites: SiteRecord[] = [];
  filteredStorageLocations: StorageLocation[] = [];

  loadingTypes = false;
  loadingCategories = false;
  loadingSites = false;
  loadingLocations = false;
  loadingClients = false;
  catalogLoaded = false;

  openDropdown: 'type' | 'category' | 'site' | 'storage' | null = null;

  private typeSearch$ = new Subject<string>();
  private categorySearch$ = new Subject<string>();
  private siteSearch$ = new Subject<string>();
  private locationSearch$ = new Subject<string>();

  private clientId = '';
  private catalogCache: { types: KeyType[]; categories: KeyCategory[]; locations: StorageLocation[] } | null = null;

  constructor(private route: ActivatedRoute, private router: Router, private keyVault: KeyVaultService, private clientService: ClientService, private toast: ToastService) {
    this.typeSearch$.pipe(debounceTime(120), distinctUntilChanged()).subscribe(term => {
      const q = term.toLowerCase();
      this.filteredKeyTypes = this.keyTypes.filter(t => t.name.toLowerCase().includes(q));
    });
    this.categorySearch$.pipe(debounceTime(120), distinctUntilChanged()).subscribe(term => {
      const q = term.toLowerCase();
      this.filteredKeyCategories = this.keyCategories.filter(c => c.name.toLowerCase().includes(q));
    });
    this.siteSearch$.pipe(debounceTime(120), distinctUntilChanged()).subscribe(term => {
      const q = term.toLowerCase();
      this.filteredSites = this.sites.filter(s => s.name.toLowerCase().includes(q));
    });
    this.locationSearch$.pipe(debounceTime(120), distinctUntilChanged()).subscribe(term => {
      const q = term.toLowerCase();
      this.filteredStorageLocations = this.storageLocations.filter(l => l.name.toLowerCase().includes(q));
    });
  }

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
      this.filteredKeyTypes = [...this.keyTypes];
      this.keyCategories = this.catalogCache.categories;
      this.filteredKeyCategories = [...this.keyCategories];
      this.storageLocations = this.catalogCache.locations;
      this.filteredStorageLocations = [...this.storageLocations];
      this.catalogLoaded = true;
      return;
    }

    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
    if (!orgId) return;

    this.loadingTypes = true;
    this.loadingCategories = true;
    this.loadingLocations = true;

    this.keyVault.listKeyTypes(orgId, false).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res ?? {};
        this.keyTypes = data.items ?? data.data ?? data ?? [];
        this.filteredKeyTypes = [...this.keyTypes];
      },
      complete: () => { this.loadingTypes = false; this.checkCatalogDone(); }
    });

    this.keyVault.listKeyCategories(orgId, false).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res ?? {};
        this.keyCategories = data.items ?? data.data ?? data ?? [];
        this.filteredKeyCategories = [...this.keyCategories];
      },
      complete: () => { this.loadingCategories = false; this.checkCatalogDone(); }
    });

    this.keyVault.listStorageLocations(orgId, false).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res ?? {};
        this.storageLocations = data.items ?? data.data ?? data ?? [];
        this.filteredStorageLocations = [...this.storageLocations];
      },
      complete: () => { this.loadingLocations = false; this.checkCatalogDone(); }
    });
  }

  private checkCatalogDone(): void {
    if (!this.loadingTypes && !this.loadingCategories && !this.loadingLocations) {
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
      this.filteredSites = [];
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
        this.filteredSites = [...this.sites];
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

  toggleDropdown(name: 'type' | 'category' | 'site' | 'storage' | null): void {
    if (this.openDropdown === name) {
      this.openDropdown = null;
      return;
    }
    this.openDropdown = name;
    this.creatingType = false;
    this.creatingCategory = false;
    this.creatingStorageLocation = false;
    if (name === 'type') { this.typeSearch = ''; this.filteredKeyTypes = [...this.keyTypes]; }
    if (name === 'category') { this.categorySearch = ''; this.filteredKeyCategories = [...this.keyCategories]; }
    if (name === 'site') { this.siteSearch = ''; this.filteredSites = [...this.sites]; }
    if (name === 'storage') { this.storageLocationSearch = ''; this.filteredStorageLocations = [...this.storageLocations]; }
  }

  closeDropdowns(): void {
    this.openDropdown = null;
  }

  onTypeSearch(term: string): void {
    this.typeSearch = term;
    this.typeSearch$.next(term);
  }

  onCategorySearch(term: string): void {
    this.categorySearch = term;
    this.categorySearch$.next(term);
  }

  onSiteSearch(term: string): void {
    this.siteSearch = term;
    this.siteSearch$.next(term);
  }

  onLocationSearch(term: string): void {
    this.storageLocationSearch = term;
    this.locationSearch$.next(term);
  }

  selectType(type: KeyType): void {
    this.keyType = type.id ?? '';
    this.closeDropdowns();
  }

  selectCategory(category: KeyCategory): void {
    this.keyCategory = category.id ?? '';
    this.closeDropdowns();
  }

  selectSite(site: SiteRecord): void {
    this.assignSite = site.id ?? '';
    this.closeDropdowns();
  }

  selectStorageLocation(location: StorageLocation): void {
    this.storageLocation = location.id ?? '';
    this.closeDropdowns();
  }

  getTypeIconColor(type: KeyType): string {
    return (type as any).color || '#64748b';
  }

  getCategoryIconColor(category: KeyCategory): string {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
    const index = (category.name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  }

  getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
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
      this.newTypeName = '';
      this.newCategoryName = '';
      this.newStorageLocationName = '';
      this.typeSearch = '';
      this.categorySearch = '';
      this.siteSearch = '';
      this.storageLocationSearch = '';
      this.closeDropdowns();
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
      this.filteredKeyTypes = [...this.keyTypes];
      this.keyType = newType.id ?? '';
      this.creatingType = false;
      this.newTypeName = '';
      this.typeSearch = '';
      this.catalogCache = null;
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
      this.filteredKeyCategories = [...this.keyCategories];
      this.keyCategory = newCategory.id ?? '';
      this.creatingCategory = false;
      this.newCategoryName = '';
      this.categorySearch = '';
      this.catalogCache = null;
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
      this.filteredStorageLocations = [...this.storageLocations];
      this.storageLocation = newLocation.id ?? '';
      this.creatingStorageLocation = false;
      this.newStorageLocationName = '';
      this.storageLocationSearch = '';
      this.catalogCache = null;
      this.toast.success('Storage location created');
    });
  }

  getSelectedTypeName(): string {
    return this.keyTypes.find(t => t.id === this.keyType)?.name || '';
  }

  getSelectedCategoryName(): string {
    return this.keyCategories.find(c => c.id === this.keyCategory)?.name || '';
  }

  getSelectedSiteName(): string {
    return this.sites.find(s => s.id === this.assignSite)?.name || '';
  }

  getSelectedStorageName(): string {
    return this.storageLocations.find(l => l.id === this.storageLocation)?.name || '';
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

  get typeDropdownLoading(): boolean {
    return this.loadingTypes && this.openDropdown === 'type';
  }

  get categoryDropdownLoading(): boolean {
    return this.loadingCategories && this.openDropdown === 'category';
  }

  get siteDropdownLoading(): boolean {
    return this.loadingSites && this.openDropdown === 'site';
  }

  get storageDropdownLoading(): boolean {
    return this.loadingLocations && this.openDropdown === 'storage';
  }

  get typeDropdownEmpty(): boolean {
    return this.openDropdown === 'type' && !this.loadingTypes && this.filteredKeyTypes.length === 0;
  }

  get categoryDropdownEmpty(): boolean {
    return this.openDropdown === 'category' && !this.loadingCategories && this.filteredKeyCategories.length === 0;
  }

  get siteDropdownEmpty(): boolean {
    return this.openDropdown === 'site' && !this.loadingSites && this.filteredSites.length === 0;
  }

  get storageDropdownEmpty(): boolean {
    return this.openDropdown === 'storage' && !this.loadingLocations && this.filteredStorageLocations.length === 0;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.search-wrap') && !target.closest('.ssr-trigger')) {
      this.closeDropdowns();
    }
  }
}
