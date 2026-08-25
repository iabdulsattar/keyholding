import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { KeyVaultService } from '../../core/services/keyvault.service';
import { ClientService } from '../../core/services/client.service';
import { UserService } from '../../core/services/user.service';
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
  title: string;
  text?: string;
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
  showAddJobTypeModal = false;
  newJobTypeName = '';
  keys: Key[] = [];
  keysLoading = true;
  currentPage = 0;
  pageSize = 6;
  totalPages = 0;
  totalElements = 0;
  checklistItems: ChecklistItem[] = [];
  newChecklistItem = '';
  checklistLoading = false;

  clientOptions: RichSelectOption[] = [];
  siteOptions: RichSelectOption[] = [];
  jobTypeOptions: RichSelectOption[] = [];
  officerOptions: RichSelectOption[] = [];
  priorityOptions: RichSelectOption[] = [
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' },
    { value: 'Critical', label: 'Critical' }
  ];
  selectedClient = '';
  selectedSite = '';
  selectedJobType = '';
  saving = false;

  errors: any = {};
  submitted = false;

  constructor(private router: Router, private keyVault: KeyVaultService, private clientService: ClientService, private userService: UserService) {}

  ngOnInit(): void {
    this.loadJobTypes();
    this.loadKeys();
    this.loadClients();
    this.loadOfficers();
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
      if (items && items.length > 0) {
        this.jobTypeOptions = this.toRichOptions(items);
      }
    });
  }

  private loadClients(): void {
    this.clientService.listClients({ page: 0, size: 200 }).subscribe((result: any) => {
      this.clientOptions = this.toRichOptions(result.items);
    });
  }

  private loadOfficers(): void {
    const orgId = this.getOrgId();
    if (!orgId) return;
    this.userService.listUsers(orgId, { page: 0, size: 200, status: 'ACTIVE' }).subscribe((res: any) => {
      const items = res?.content ?? res?.items ?? res?.data ?? res ?? [];
      this.officerOptions = items.map((u: any) => ({
        value: u.id,
        label: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || u.id
      }));
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

  private loadChecklist(jobTypeId: string): void {
    const orgId = this.getOrgId();
    if (!orgId || !jobTypeId) return;
    this.checklistLoading = true;
    this.keyVault.listJobChecklist(orgId, jobTypeId).subscribe((res: any) => {
      const items = res?.data?.items ?? res?.items ?? res?.data ?? res ?? [];
      this.checklistItems = items.map((ci: any) => ({
        id: ci.id ?? '',
        title: ci.title ?? '',
        text: ci.title ?? ci.text ?? ''
      }));
      this.checklistLoading = false;
    }, () => {
      this.checklistItems = [];
      this.checklistLoading = false;
    });
  }

  onClientChange(clientId: string): void {
    this.selectedClient = clientId;
    this.selectedSite = '';
    this.loadSites(clientId);
  }

  onJobTypeChange(jobTypeId: string): void {
    this.selectedJobType = jobTypeId;
    this.checklistItems = [];
    this.loadChecklist(jobTypeId);
  }

  onDateChange(event: any): void {
    const dateStr = event?.dateStr || this.job.date;
    this.job.date = this.toApiDate(dateStr);
  }

  onStartTimeChange(time: string): void {
    this.job.startTime = this.toApiTime(time || this.job.startTime);
    this.updateDuration();
  }

  onEndTimeChange(time: string): void {
    this.job.endTime = this.toApiTime(time || this.job.endTime);
    this.updateDuration();
  }

  private updateDuration(): void {
    if (this.job.startTime && this.job.endTime) {
      this.job.duration = this.calculateDuration(this.job.startTime, this.job.endTime);
    } else {
      this.job.duration = '';
    }
  }

  private calculateDuration(start: string, end: string): string {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    let diffMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    if (diffMinutes < 0) diffMinutes += 24 * 60;
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  private toApiDate(dateStr: string): string {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  }

  private toApiTime(timeStr: string): string {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return timeStr;
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const period = match[3].toUpperCase();
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
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

  openAddJobTypeModal(): void {
    this.showAddJobTypeModal = true;
    this.newJobTypeName = '';
  }

  closeAddJobTypeModal(): void {
    this.showAddJobTypeModal = false;
    this.newJobTypeName = '';
  }

  createJobType(): void {
    const name = this.newJobTypeName.trim();
    if (!name) return;
    const orgId = this.getOrgId();
    if (!orgId) return;

    this.keyVault.createJobType(orgId, {
      name,
      description: '',
      iconKey: 'briefcase',
      sortOrder: this.jobTypeOptions.length + 1,
      active: true
    }).subscribe((res: any) => {
      const created = res?.data ?? res;
      if (created && created.id) {
        this.jobTypeOptions = [
          ...this.jobTypeOptions,
          { value: created.id, label: created.name || name }
        ];
        this.selectedJobType = created.id;
        this.onJobTypeChange(created.id);
      }
      this.closeAddJobTypeModal();
    });
  }

  addChecklistItem(): void {
    const title = this.newChecklistItem.trim();
    if (!title) return;
    const orgId = this.getOrgId();
    if (!orgId || !this.selectedJobType) return;

    this.keyVault.addChecklistItem(orgId, this.selectedJobType, { title }).subscribe((res: any) => {
      const created = res?.data ?? res;
      if (created) {
        this.checklistItems.push({
          id: created.id ?? '',
          title: created.title ?? title,
          text: created.title ?? title
        });
      }
      this.newChecklistItem = '';
      this.closeAddChecklistModal();
    });
  }

  removeChecklistItem(id: string): void {
    const orgId = this.getOrgId();
    if (!orgId) return;
    this.keyVault.deleteChecklistItem(orgId, id).subscribe(() => {
      this.checklistItems = this.checklistItems.filter(item => item.id !== id);
    });
  }

  private validateForm(): boolean {
    this.errors = {};
    this.submitted = true;

    if (!this.selectedJobType) this.errors['jobType'] = 'Job type is required';
    if (!this.selectedClient) this.errors['client'] = 'Client is required';
    if (!this.selectedSite) this.errors['site'] = 'Site is required';
    if (!this.job.title.trim()) this.errors['title'] = 'Job title is required';
    if (!this.job.date) this.errors['date'] = 'Date is required';
    if (!this.job.startTime) this.errors['startTime'] = 'Start time is required';
    if (!this.job.endTime) this.errors['endTime'] = 'End time is required';
    if (!this.job.officer) this.errors['officer'] = 'Officer is required';

    return Object.keys(this.errors).length === 0;
  }

  createJob(): void {
    const orgId = this.getOrgId();
    if (!orgId) return;

    if (!this.validateForm()) return;

    const payload: any = {
      jobTypeId: this.selectedJobType,
      title: this.job.title,
      clientId: this.selectedClient || this.job.client,
      siteId: this.selectedSite || this.job.site,
      reference: this.job.reference || '',
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