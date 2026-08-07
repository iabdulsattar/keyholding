import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { KeyVaultService, KeyType, KeyCategory, KeyAttachment } from '../../core/services/keyvault.service';
import { ClientService, SiteRecord, Client } from '../../core/services/client.service';
import { ToastService } from '../../core/services/toast.service';
import { RichSelectComponent } from '../../shared/components/form/rich-select/rich-select.component';
import { RichSelectOption } from '../../shared/components/form/rich-select/rich-select.component';
import { PageBreadcrumbComponent, BreadcrumbItem } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { NavigationReferrerService } from '../../core/services/navigation-referrer.service';

@Component({
  selector: 'app-add-key',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, RichSelectComponent, PageBreadcrumbComponent],
  templateUrl: './add-key.component.html',
  styles: `
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
    select { appearance: none; background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 1rem center; background-size: 1rem; }
    .spinner { width: 1rem; height: 1rem; border: 2px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; vertical-align: middle; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .file-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
    .file-card { background: #ffffff; border: 1px solid #e3e6ea; border-radius: 14px; padding: 10px; display: flex; flex-direction: column; box-shadow: 0 1px 2px rgba(16, 24, 40, 0.06), 0 1px 3px rgba(16, 24, 40, 0.04); transition: transform 0.15s ease, box-shadow 0.15s ease; }
    .file-card:hover { transform: translateY(-2px); box-shadow: 0 4px 10px rgba(16, 24, 40, 0.08), 0 2px 4px rgba(16, 24, 40, 0.06); }
    .thumb { width: 100%; aspect-ratio: 16 / 11; border-radius: 8px; overflow: hidden; background: #f1f2f5; display: flex; align-items: center; justify-content: center; margin-bottom: 10px; }
    .thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .thumb.doc-thumb { padding: 6px; }
    .thumb.doc-thumb svg { width: 100%; height: 100%; }
    .file-meta { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .file-info { min-width: 0; }
    .file-name { font-size: 13.5px; font-weight: 600; color: #1f2430; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .file-size { font-size: 12px; color: #8a91a0; margin-top: 2px; }
    .view-btn { flex-shrink: 0; width: 28px; height: 28px; border-radius: 50%; border: none; background: transparent; color: #2f6fed; display: flex; align-items: center; justify-content: center; cursor: pointer; }
    .view-btn:hover { background: rgba(47, 111, 237, 0.1); }
    .view-btn:focus-visible { outline: 2px solid #2f6fed; outline-offset: 2px; }
    .view-btn svg { width: 17px; height: 17px; }
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
  keyBrand = '';
  keyModel = '';
  keyColour = '';
  keyTag = '';
  keyStatus: 'active' | 'inactive' = 'active';
  fileName = '';
  selectedFiles: File[] = [];
  attachmentPreviews: { file: File; url: string }[] = [];
  existingAttachments: KeyAttachment[] = [];
  attachmentsLoading = false;
  attachmentError = '';

  keyTypes: KeyType[] = [];
  keyCategories: KeyCategory[] = [];
  sites: SiteRecord[] = [];
  clients: Client[] = [];

  loadingSites = false;
  loadingClients = false;
  loadingCatalog = false;
  editing = false;
  pageTitle = 'Add New Key';
  clientName = '';
  showClientDropdown = false;

  submitted = false;

  activeSection = 'information';
  touched = new Set<string>();
  sectionErrors: { information: string[]; assign: string[]; details: string[]; status: string[] } = {
    information: [],
    assign: [],
    details: [],
    status: []
  };

  keyTypeOptions: RichSelectOption[] = [
        
  ];
  keyCategoryOptions: RichSelectOption[] = [];
  clientOptions: RichSelectOption[] = [];
  siteOptions: RichSelectOption[] = [];

  private clientId = '';
  private editKeyId = '';
  private catalogCache: { types: KeyType[]; categories: KeyCategory[] } | null = null;

  constructor(private route: ActivatedRoute, private router: Router, private keyVault: KeyVaultService, private clientService: ClientService, private toast: ToastService, private referrer: NavigationReferrerService) {}

  get breadcrumbs(): BreadcrumbItem[] {
    const crumbs: BreadcrumbItem[] = [{ label: 'Keys', link: '/keys/all-keys' }];
    if (this.clientId && this.assignClient) {
      crumbs.unshift({ label: this.assignClient, link: ['/clients', this.clientId] });
      crumbs.unshift({ label: 'Clients', link: '/clients' });
      crumbs.unshift({ label: 'Client Management', link: '/clients' });
    }
    crumbs.push({ label: this.pageTitle });
    return crumbs;
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.clientId = params['clientId'] || '';
      this.editKeyId = params['editId'] || '';
      this.editing = !!this.editKeyId;
      this.pageTitle = this.editing ? 'Edit Key' : 'Add New Key';
      this.showClientDropdown = !this.clientId && !this.editing;
    });
    this.loadAll();
    if (this.editing && this.editKeyId) {
      this.loadKey(this.editKeyId);
    } else {
      this.generateKeyCode();
    }
  }

  private generateKeyCode(): void {
    const random = Math.floor(100000 + Math.random() * 900000);
    this.keyId = `KEY-${random}`;
  }

  copyClientCode(): void {
    if (!this.keyId) return;
    navigator.clipboard.writeText(this.keyId).then(() => {
      this.toast.success('Key code copied to clipboard');
    });
  }

  private toRichOptions(items: any[], labelKey = 'name', valueKey = 'id'): RichSelectOption[] {
    return items.map((item: any) => ({
      value: item[valueKey] || '',
      label: item[labelKey] || ''
    }));
  }

  loadAll(): void {
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
    if (!orgId) return;

    this.loadingCatalog = true;
    this.loadingClients = true;

    forkJoin({
      types: this.keyVault.listKeyTypes(orgId, false),
      categories: this.keyVault.listKeyCategories(orgId, false),
    }).subscribe({
      next: ({ types, categories }) => {
        this.keyTypes = types;
        this.keyCategories = categories;
        this.keyTypeOptions = this.toRichOptions(types);
        this.keyCategoryOptions = this.toRichOptions(categories);
        this.catalogCache = { types: [...this.keyTypes], categories: [...this.keyCategories] };
        this.loadingCatalog = false;
      },
      error: () => {
        this.loadingCatalog = false;
        this.toast.error('Failed to load catalog data. Please refresh.');
      }
    });

    this.clientService.listClients({ page: 0, size: 100 }).subscribe({
      next: (result: any) => {
        this.clients = result?.items ?? result?.data ?? [];
        this.clientOptions = this.toRichOptions(this.clients);
        if (this.clients.length > 0 && !this.assignClientId && this.clientId && !this.editing) {
          const prefetch = this.clients.find((c: any) => c.id === this.clientId);
          const pick = prefetch || this.clients[0];
          this.assignClient = pick.name;
          this.assignClientId = pick.id;
          this.loadSites();
        }
      },
      error: () => {
        this.clients = [];
        this.clientOptions = [];
        this.loadingClients = false;
        this.toast.error('Failed to load clients. Please refresh.');
      }
    });
  }

  loadSites(): void {
    this.siteOptions = [];
    this.sites = [];
    if (!this.assignClientId) {
      this.loadingSites = false;
      return;
    }
    this.loadingSites = true;
    this.clientService.getSitesByClient(this.assignClientId).subscribe({
      next: (sites: any[]) => {
        this.sites = sites || [];
        this.siteOptions = this.toRichOptions(this.sites);
        this.loadingSites = false;
      },
      error: () => {
        this.sites = [];
        this.siteOptions = [];
        this.loadingSites = false;
      }
    });
  }

  onClientChange(value: string): void {
    this.assignClientId = value;
    this.assignSite = '';
    const client = this.clients.find(c => c.id === this.assignClientId);
    this.assignClient = client?.name ?? '';
    this.loadSites();
  }

  private loadKey(keyId: string): void {
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
    if (!orgId) return;
    this.keyVault.getKey(orgId, keyId).subscribe({
      next: (res: any) => {
        const item = res?.data ?? res;
        if (!item) return;
        this.keyName = item.name || '';
        this.keyId = item.reference || item.keyCode || '';
        this.keyType = item.keyTypeId || '';
        this.keyCategory = item.keyCategoryId || '';
        this.keyNotes = item.description || '';
        this.assignClientId = item.clientId || '';
        this.assignSite = item.siteId || '';
        this.keyBrand = item.makeBrand || '';
        this.keyModel = item.model || '';
        this.keyColour = item.colour || '';
        this.keyTag = item.tagLabel || '';
        const status = item.status || 'IN_STORAGE';
        this.keyStatus = status === 'INACTIVE' ? 'inactive' : 'active';
        const client = this.clients.find(c => c.id === this.assignClientId);
        this.assignClient = client?.name ?? '';
        if (this.assignClientId) this.loadSites();
      },
      error: () => this.toast.error('Failed to load key details.')
    });
    this.loadExistingAttachments(keyId);
  }

  setStatus(status: 'active' | 'inactive'): void {
    this.keyStatus = status;
  }

  private loadExistingAttachments(keyId: string): void {
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
    if (!orgId || !keyId) return;
    this.attachmentsLoading = true;
    this.attachmentError = '';
    this.keyVault.listKeyAttachments(orgId, keyId).subscribe({
      next: (res: any) => {
        const payload = res?.data ?? res ?? [];
        this.existingAttachments = Array.isArray(payload) ? payload : [];
        this.attachmentsLoading = false;
      },
      error: () => {
        this.existingAttachments = [];
        this.attachmentsLoading = false;
        this.attachmentError = 'Unable to load existing attachments.';
      }
    });
  }

  deleteExistingAttachment(attachmentId: string | undefined): void {
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
    if (!orgId || !this.editKeyId || !attachmentId) return;
    this.keyVault.deleteKeyAttachment(orgId, this.editKeyId, attachmentId).subscribe({
      next: () => {
        this.toast.success('Attachment removed');
        this.existingAttachments = this.existingAttachments.filter(a => a.id !== attachmentId);
      },
      error: () => this.toast.error('Failed to remove attachment')
    });
  }

  get totalAttachments(): number {
    return this.existingAttachments.length + this.selectedFiles.length;
  }

  get hasAttachments(): boolean {
    return this.totalAttachments > 0;
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    if (this.totalAttachments >= 1) {
      this.toast.error('Only 1 attachment is allowed. Remove the existing one first.');
      input.value = '';
      return;
    }
    const remaining = 1 - this.selectedFiles.length;
    if (remaining <= 0) {
      this.toast.error('Only 1 attachment is allowed.');
      input.value = '';
      return;
    }
    const files = Array.from(input.files).slice(0, remaining);
    files.forEach(file => {
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
    this.keyName = '';
    this.keyId = '';
    this.keyType = '';
    this.keyCategory = '';
    this.keyNotes = '';
    if (this.clientId || this.editing) {
      this.assignClient = this.clients.length > 0 ? this.clients[0].name : '';
      this.assignClientId = this.clients.length > 0 ? this.clients[0].id : '';
    } else {
      this.assignClient = '';
      this.assignClientId = '';
    }
    this.assignSite = '';
    this.keyBrand = '';
    this.keyModel = '';
    this.keyColour = '';
    this.keyTag = '';
    this.keyStatus = 'active';
    this.fileName = '';
    this.selectedFiles = [];
    this.attachmentPreviews.forEach(item => { if (item.url.startsWith('blob:')) URL.revokeObjectURL(item.url); });
    this.attachmentPreviews = [];
    this.existingAttachments = [];
    this.attachmentsLoading = false;
    this.attachmentError = '';
    if (this.returnUrl) {
      this.router.navigateByUrl(this.returnUrl);
    } else if (this.clientId) {
      this.router.navigate(['/clients', this.clientId]);
    } else {
      this.router.navigate(['/keys/all-keys']);
    }
  }

  submitKeyForm(): void {
    if (!this.validate()) {
      return;
    }

    const statusMap: Record<string, string> = {
      'active': 'IN_STORAGE',
      'inactive': 'INACTIVE',
    };

    const key: any = {
      name: this.keyName,
      reference: this.keyId,
      keyTypeId: this.keyType,
      keyCategoryId: this.keyCategory,
      description: this.keyNotes,
      clientId: this.assignClientId,
      siteId: this.assignSite,
      assignedToUserId: null,
      makeBrand: this.keyBrand,
      model: this.keyModel,
      colour: this.keyColour,
      tagLabel: this.keyTag,
      status: statusMap[this.keyStatus] || 'IN_STORAGE',
    };

    if (!this.assignClientId) {
      this.toast.error('Please select a client before saving.');
      return;
    }

    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
    if (!orgId) {
      this.toast.error('Missing organization context. Please sign in again.');
      return;
    }

    const request$ = this.editing
      ? this.keyVault.updateKey(orgId, this.editKeyId, key)
      : this.keyVault.createKey(orgId, key);

    request$.subscribe({
      next: (res: any) => {
        const savedKey = res?.data ?? res;
        const savedKeyId = savedKey?.id || this.editKeyId;
        if (savedKeyId && this.selectedFiles.length) {
          if (this.editing && this.existingAttachments.length > 0) {
            this.deleteExistingAttachmentsBeforeUpload(orgId, savedKeyId);
          } else {
            this.uploadAttachments(orgId, savedKeyId);
          }
        } else {
          this.finishKeySubmit();
        }
      },
      error: () => {
        this.toast.error(this.editing ? 'Failed to update key. Please try again.' : 'Failed to save key. Please try again.');
      }
    });
  }

  private uploadAttachments(orgId: string, keyId: string): void {
    let pending = this.selectedFiles.length;
    if (!pending) {
      this.finishKeySubmit();
      return;
    }

    this.selectedFiles.forEach(file => {
      this.keyVault.addKeyAttachment(orgId, keyId, file).subscribe({
        next: () => {
          pending--;
          this.maybeFinishKeySubmit(pending);
        },
        error: () => {
          pending--;
          this.maybeFinishKeySubmit(pending);
        }
      });
    });
  }

  private deleteExistingAttachmentsBeforeUpload(orgId: string, keyId: string): void {
    let pending = this.existingAttachments.length;
    if (!pending) {
      this.uploadAttachments(orgId, keyId);
      return;
    }

    this.existingAttachments.forEach(att => {
      if (!att.id) {
        pending--;
        if (pending <= 0) this.uploadAttachments(orgId, keyId);
        return;
      }
      this.keyVault.deleteKeyAttachment(orgId, keyId, att.id).subscribe({
        next: () => {
          pending--;
          if (pending <= 0) this.uploadAttachments(orgId, keyId);
        },
        error: () => {
          pending--;
          if (pending <= 0) this.uploadAttachments(orgId, keyId);
        }
      });
    });
  }

  private maybeFinishKeySubmit(pending: number): void {
    if (pending <= 0) {
      this.finishKeySubmit();
    }
  }

  get returnUrl(): string {
    return this.route.snapshot.queryParamMap.get('returnUrl') || this.referrer.getPreviousUrl() || '';
  }

  private finishKeySubmit(): void {
    this.toast.success(this.editing ? 'Key updated successfully!' : 'Key saved successfully!');
    const destination = this.returnUrl ? [this.returnUrl] : this.clientId ? ['/clients', this.clientId] : ['/keys/all-keys'];
    setTimeout(() => this.router.navigate(destination), 800);
  }

  markTouched(field: string) {
    this.touched.add(field);
  }

  isSectionValid(section: keyof AddKeyComponent['sectionErrors']): boolean {
    return (this.sectionErrors[section] || []).length === 0;
  }

  get infoInvalid(): boolean {
    return this.submitted && !this.isSectionValid('information');
  }
  get assignInvalid(): boolean {
    return this.submitted && !this.isSectionValid('assign');
  }
  get detailsInvalid(): boolean {
    return this.submitted && !this.isSectionValid('details');
  }
  get statusInvalid(): boolean {
    return this.submitted && !this.isSectionValid('status');
  }

  validate(): boolean {
    const errors: { information: string[]; assign: string[]; details: string[]; status: string[] } = {
      information: [],
      assign: [],
      details: [],
      status: []
    };

    this.submitted = true;

    this.touched.add('keyName');
    this.touched.add('keyType');
    this.touched.add('keyCategory');
    this.touched.add('assignClientId');
    this.touched.add('assignSite');

    if (!this.keyName.trim()) errors.information.push('Key Name is required');
    if (!this.keyType) errors.information.push('Key Type is required');
    if (!this.keyCategory) errors.information.push('Key Category is required');
    if (!this.assignClientId) errors.assign.push('Client is required');
    if (!this.assignSite) errors.assign.push('Site is required');
    this.sectionErrors = errors;
    return !errors.information.length && !errors.assign.length && !errors.details.length && !errors.status.length;
  }

  get statusClass(): string {
    const map: Record<string, string> = {
      'active': 'bg-emerald-50 text-emerald-600',
      'inactive': 'bg-rose-50 text-rose-600',
    };
    return map[this.keyStatus] || 'bg-slate-100 text-slate-600';
  }

  get keyStatusDisplay(): string {
    const map: Record<string, string> = {
      'active': 'Active',
      'inactive': 'Inactive',
    };
    return map[this.keyStatus] || this.keyStatus;
  }

  get showPreview(): boolean {
    return !!(this.keyName || this.keyType || this.keyCategory || this.assignSite);
  }

  isImage(type = ''): boolean {
    return type.toLowerCase().startsWith('image/');
  }

  formatSize(bytes = 0): string {
    if (!bytes) return '-';
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
  }

  iconForType(type = ''): string {
    const t = type.toLowerCase();
    if (t.includes('image')) return 'image';
    if (t.includes('pdf')) return 'pdf';
    return 'doc';
  }

  trackByIndex(index: number): number {
    return index;
  }
}
