import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { KeyVaultService } from '../../core/services/keyvault.service';
import { ClientService } from '../../core/services/client.service';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../core/services/toast.service';
import { MultiSelectComponent, Option as MultiOption } from '../../shared/components/form/multi-select/multi-select.component';
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
  imports: [CommonModule, RouterModule, FormsModule, RichSelectComponent, MultiSelectComponent, DatePickerComponent, TimePickerComponent],
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

  completionContactOptions: MultiOption[] = [];
  notCompletedContactOptions: MultiOption[] = [];
  selectedCompletionContactIds: string[] = [];
  selectedNotCompletedContactIds: string[] = [];
  contactsLoading = false;

  selectedFiles: File[] = [];
  attachmentPreviews: { file: File; url: string; status: 'pending' | 'uploading' | 'success' | 'error'; message?: string }[] = [];
  attachmentError = '';
  private readonly MAX_FILE_SIZE = 25 * 1024 * 1024;

  errors: any = {};
  submitted = false;

  constructor(private router: Router, private keyVault: KeyVaultService, private clientService: ClientService, private userService: UserService, private toast: ToastService) {}

  ngOnInit(): void {
    this.loadJobTypes();
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

  private loadContacts(clientId: string): void {
    if (!clientId) {
      this.completionContactOptions = [];
      this.notCompletedContactOptions = [];
      return;
    }
    this.contactsLoading = true;
    this.clientService.listContacts(clientId, { page: 0, size: 200 }).subscribe({
      next: (result: any) => {
        const items = result?.items ?? result?.data ?? result ?? [];
        const options: MultiOption[] = items.map((item: any) => ({
          value: item.id ?? '',
          text: `${item.firstName || ''} ${item.lastName || ''}`.trim() || item.fullName || item.name || 'Contact'
        }));
        this.completionContactOptions = [...options];
        this.notCompletedContactOptions = [...options];
        this.contactsLoading = false;
      },
      error: () => {
        this.completionContactOptions = [];
        this.notCompletedContactOptions = [];
        this.contactsLoading = false;
      }
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
    this.loadContacts(clientId);
  }

  onSiteChange(siteId: string): void {
    this.selectedSite = siteId;
    this.loadKeys(0);
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

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || !files.length) return;

    Array.from(files).forEach((file: File) => {
      if (file.size > this.MAX_FILE_SIZE) {
        this.toast.error(`File "${file.name}" exceeds 25MB limit.`);
        return;
      }
      this.selectedFiles.push(file);
      const reader = new FileReader();
      reader.onload = () => this.attachmentPreviews.push({ file, url: reader.result as string, status: 'pending' });
      reader.readAsDataURL(file);
    });

    this.attachmentError = '';
    input.value = '';
  }

  removeAttachment(index: number): void {
    this.selectedFiles.splice(index, 1);
    const url = this.attachmentPreviews[index]?.url;
    this.attachmentPreviews.splice(index, 1);
    if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
  }

  isImage(type = ''): boolean {
    return type.toLowerCase().startsWith('image/');
  }

  formatSize(bytes = 0): string {
    if (!bytes) return '-';
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
  }

  private uploadJobAttachments(orgId: string, jobId: string): void {
    if (!this.selectedFiles.length) {
      this.saving = false;
      this.toast.success('Job created successfully!');
      this.router.navigate(['/jobs']);
      return;
    }

    let pending = this.selectedFiles.length;
    this.selectedFiles.forEach((file, idx) => {
      const previewIdx = this.attachmentPreviews.findIndex(p => p.file === file);
      if (previewIdx >= 0) this.attachmentPreviews[previewIdx].status = 'uploading';

      this.keyVault.uploadJobAttachment(orgId, jobId, file).subscribe({
        next: () => {
          if (previewIdx >= 0) this.attachmentPreviews[previewIdx].status = 'success';
          pending--;
          this.maybeFinishUpload();
        },
        error: (err: any) => {
          if (previewIdx >= 0) {
            this.attachmentPreviews[previewIdx].status = 'error';
            this.attachmentPreviews[previewIdx].message = err?.error?.message || 'Upload failed';
          }
          pending--;
          this.maybeFinishUpload();
        }
      });
    });
  }

  private maybeFinishUpload(): void {
    const hasError = this.attachmentPreviews.some(p => p.status === 'error');
    const allDone = this.attachmentPreviews.every(p => p.status === 'success' || p.status === 'error');

    if (allDone) {
      this.saving = false;
      if (hasError) {
        this.toast.error('Job created, but some attachments failed to upload.');
      } else {
        this.toast.success('Job created successfully with attachments!');
      }
      setTimeout(() => this.router.navigate(['/jobs']), 600);
    }
  }

  loadKeys(page = 0): void {
    const orgId = this.getOrgId();
    if (!orgId) {
      this.keysLoading = false;
      return;
    }

    this.keyVault.listKeys(orgId, { page, size: this.pageSize, clientId: this.selectedClient || undefined, siteId: this.selectedSite || undefined }).subscribe({
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
      notifyOnCompletion: this.selectedCompletionContactIds,
      notifyOnNotCompleted: this.selectedNotCompletedContactIds,
      additionalNotes: this.job.notes || undefined
    };

    this.saving = true;
    this.keyVault.createJob(orgId, payload).subscribe({
      next: (res: any) => {
        const createdId = res?.data?.id ?? res?.id;
        if (createdId) {
          this.uploadJobAttachments(orgId, createdId);
        } else {
          this.saving = false;
          this.toast.error('Failed to create job');
        }
      },
      error: (err) => {
        console.error('Failed to create job', err);
        this.saving = false;
        this.toast.error('Failed to create job');
      }
    });
  }

  get selectedJobTypeLabel(): string {
    return this.jobTypeOptions.find(o => o.value === this.selectedJobType)?.label || 'Select job type';
  }

  get selectedSiteLabel(): string {
    return this.siteOptions.find(o => o.value === this.selectedSite)?.label || 'Select site';
  }

  get selectedClientLabel(): string {
    return this.clientOptions.find(o => o.value === this.selectedClient)?.label || 'Select client';
  }

  priorityIcon(priority = ''): string {
    const lower = priority.toLowerCase();
    if (lower.includes('high') || lower.includes('critical')) return '<path d="M10 6.6664V10M10 13.3336H10.0083M18.334 10C18.334 14.6027 14.6028 18.334 10 18.334C5.39727 18.334 1.66602 14.6027 1.66602 10C1.66602 5.39726 5.39727 1.666 10 1.666C14.6028 1.666 18.334 5.39726 18.334 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
    if (lower.includes('low')) return '<path d="M10 6.6664V10M10 13.3336H10.0083M18.334 10C18.334 14.6027 14.6028 18.334 10 18.334C5.39727 18.334 1.66602 14.6027 1.66602 10C1.66602 5.39726 5.39727 1.666 10 1.666C14.6028 1.666 18.334 5.39726 18.334 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
    return '<path d="M10 6.6664V10M10 13.3336H10.0083M18.334 10C18.334 14.6027 14.6028 18.334 10 18.334C5.39727 18.334 1.66602 14.6027 1.66602 10C1.66602 5.39726 5.39727 1.666 10 1.666C14.6028 1.666 18.334 5.39726 18.334 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
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