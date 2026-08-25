import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { KeyVaultService } from '../../core/services/keyvault.service';
import { ClientService } from '../../core/services/client.service';
import { RichSelectComponent } from '../../shared/components/form/rich-select/rich-select.component';
import { RichSelectOption } from '../../shared/components/form/rich-select/rich-select.component';
import { DatePickerComponent } from '../../shared/components/form/date-picker/date-picker.component';
import { TimePickerComponent } from '../../shared/components/form/time-picker/time-picker.component';

interface Key {
  id: string;
  code: string;
  name: string;
  cabinet: string;
  hook: string;
  site: string;
  room: string;
  status: 'Available' | 'Issued';
  selected: boolean;
}

interface ChecklistItem {
  id: string;
  text: string;
}

interface JobTypeOption {
  id: string;
  name: string;
}

@Component({
  selector: 'app-create-job',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, RichSelectComponent, DatePickerComponent, TimePickerComponent],
  templateUrl: './create-job.component.html',
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  `]
})
export class CreateJobComponent implements OnInit {
  job = {
    type: '',
    client: '',
    site: '',
    title: '',
    reference: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    duration: '',
    officer: '',
    priority: 'Medium',
    notifyCompletion: '',
    notifyNotCompleted: '',
    notes: ''
  };

  showAddKeysModal = false;
  showAddChecklistModal = false;
  keys: Key[] = [];
  keysLoading = true;
  currentPage = 0;
  pageSize = 6;
  totalPages = 0;
  totalElements = 0;
  checklistItems: ChecklistItem[] = [];
  newChecklistItem = '';

  clientOptions: RichSelectOption[] = [];
  siteOptions: RichSelectOption[] = [];
  jobTypeOptions: JobTypeOption[] = [];
  selectedClient = '';
  selectedSite = '';
  selectedJobType = '';
  saving = false;

  constructor(private router: Router, private keyVault: KeyVaultService, private clientService: ClientService) {}

  ngOnInit(): void {
    this.loadJobTypes();
    this.loadKeys();
    this.loadClients();
  }

  get selectedKeys(): Key[] {
    return this.keys.filter(k => k.selected);
  }

  get checklistLeft(): ChecklistItem[] {
    return this.checklistItems.filter((_, i) => i % 2 === 0);
  }

  get checklistRight(): ChecklistItem[] {
    return this.checklistItems.filter((_, i) => i % 2 === 1);
  }

  get startIndex(): number {
    return this.currentPage * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
  }

  private toRichOptions(items: any[], labelKey = 'name', valueKey = 'id'): RichSelectOption[] {
    return items.map((item: any) => ({
      value: item[valueKey] || '',
      label: item[labelKey] || ''
    }));
  }

  private getOrgId(): string | null {
    return localStorage.getItem('organizationId') || localStorage.getItem('org_id');
  }

  private loadJobTypes(): void {
    const orgId = this.getOrgId();
    if (!orgId) return;
    this.keyVault.listJobTypes(orgId, false).subscribe((res: any) => {
      const items = res?.data?.items ?? res?.items ?? res?.data ?? res ?? [];
      this.jobTypeOptions = this.toRichOptions(items);
    });
  }

  private loadClients(): void {
    this.clientService.listClients({ page: 0, size: 200 }).subscribe((result: any) => {
      this.clientOptions = this.toRichOptions(result.items);
    });
  }

  private loadSites(clientId: string): void {
    if (!clientId) {
      this.siteOptions = [];
      return;
    }
    this.clientService.getSitesByClient(clientId).subscribe((sites: any[]) => {
      this.siteOptions = this.toRichOptions(sites);
    });
  }

  onClientChange(clientId: string): void {
    this.selectedSite = '';
    this.loadSites(clientId);
  }

  onDateChange(event: any): void {
    this.job.date = event?.dateStr || this.job.date;
  }

  onStartTimeChange(time: string): void {
    this.job.startTime = time || this.job.startTime;
  }

  onEndTimeChange(time: string): void {
    this.job.endTime = time || this.job.endTime;
  }

  loadKeys(page = 0): void {
    const orgId = this.getOrgId();
    if (!orgId) {
      this.keysLoading = false;
      return;
    }

    this.keyVault.listKeys(orgId, { page, size: this.pageSize }).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res ?? {};
        const items = data.content ?? data.items ?? data.data ?? data ?? [];
        this.keys = items.map((k: any) => {
          const status = k.status ?? 'IN_STORAGE';
          const mappedStatus = status === 'IN_STORAGE' ? 'Available' : 'Issued';
          return {
            code: k.keyCode ?? '',
            id: k.id ?? '',
            name: k.name ?? '',
            cabinet: k.storageLocation ?? '',
            hook: '',
            site: k.siteName ?? '',
            room: k.description ?? '',
            status: mappedStatus,
            selected: false
          };
        });
        this.totalElements = res?.meta?.totalElements ?? items.length;
        this.totalPages = res?.meta?.totalPages ?? Math.max(1, Math.ceil(items.length / this.pageSize));
        this.currentPage = page;
        this.keysLoading = false;
      },
      error: () => {
        this.keysLoading = false;
      }
    });
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.loadKeys(page);
    }
  }

  prevPage(): void {
    if (this.currentPage > 0) {
      this.loadKeys(this.currentPage - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.loadKeys(this.currentPage + 1);
    }
  }

  get pageNumbers(): (number | '...')[] {
    if (this.totalPages <= 7) {
      return Array.from({ length: this.totalPages }, (_, i) => i + 1);
    }
    const pages: (number | '...')[] = [1];
    if (this.currentPage > 3) pages.push('...');
    const start = Math.max(2, this.currentPage - 1);
    const end = Math.min(this.totalPages - 1, this.currentPage + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (this.currentPage < this.totalPages - 3) pages.push('...');
    if (this.totalPages > 1) pages.push(this.totalPages);
    return pages;
  }

  openAddKeysModal(): void {
    this.showAddKeysModal = true;
  }

  closeAddKeysModal(): void {
    this.showAddKeysModal = false;
  }

  toggleKeySelection(key: Key): void {
    key.selected = !key.selected;
  }

  clearAllKeys(): void {
    this.keys.forEach(k => k.selected = false);
  }

  removeKey(key: Key): void {
    key.selected = false;
  }

  openAddChecklistModal(): void {
    this.showAddChecklistModal = true;
    this.newChecklistItem = '';
  }

  closeAddChecklistModal(): void {
    this.showAddChecklistModal = false;
    this.newChecklistItem = '';
  }

  addChecklistItem(): void {
    const text = this.newChecklistItem.trim();
    if (!text) return;
    this.checklistItems.push({
      id: Date.now().toString(),
      text
    });
    this.newChecklistItem = '';
    this.closeAddChecklistModal();
  }

  removeChecklistItem(id: string): void {
    this.checklistItems = this.checklistItems.filter(item => item.id !== id);
  }

  createJob(): void {
    const orgId = this.getOrgId();
    if (!orgId) return;

    const payload: any = {
      jobTypeId: this.selectedJobType || this.job.type,
      title: this.job.title,
      clientId: this.selectedClient || this.job.client,
      siteId: this.selectedSite || this.job.site,
      reference: this.job.reference || undefined,
      description: this.job.description || undefined,
      scheduledDate: this.job.date || undefined,
      startTime: this.job.startTime || undefined,
      endTime: this.job.endTime || undefined,
      officerUserId: this.job.officer || undefined,
      priority: this.mapPriority(this.job.priority),
      keyIds: this.selectedKeys.map(k => k.id),
      checklistItems: this.checklistItems.map(ci => ci.id),
      notifyOnCompletion: [],
      notifyOnNotCompleted: [],
      additionalNotes: this.job.notes || undefined
    };

    this.saving = true;
    this.keyVault.createJob(orgId, payload).subscribe({
      next: (res: any) => {
        this.saving = false;
        const createdId = res?.data?.id ?? res?.id;
        if (createdId) {
          this.router.navigate(['/jobs', createdId]);
        } else {
          this.router.navigate(['/jobs']);
        }
      },
      error: (err) => {
        console.error('Failed to create job', err);
        this.saving = false;
      }
    });
  }

  private mapPriority(priority: string): string {
    const map: Record<string, string> = {
      'Low': 'LOW',
      'Medium': 'MEDIUM',
      'High': 'HIGH',
      'Critical': 'CRITICAL'
    };
    return map[priority] || 'MEDIUM';
  }

  goBack(): void {
    this.router.navigate(['/jobs']);
  }
}