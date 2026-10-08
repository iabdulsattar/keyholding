import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { KeyVaultService } from '../../core/services/keyvault.service';
import { ClientService } from '../../core/services/client.service';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../core/services/toast.service';
import { MultiSelectComponent, Option as MultiOption } from '../../shared/components/form/multi-select/multi-select.component';
import { RichSelectComponent } from '../../shared/components/form/rich-select/rich-select.component';
import { RichSelectOption } from '../../shared/components/form/rich-select/rich-select.component';
import { DatePickerComponent } from '../../shared/components/form/date-picker/date-picker.component';
import { TimePickerComponent } from '../../shared/components/form/time-picker/time-picker.component';
import { scheduleToUtc, scheduleUtcToLocal } from '../../core/utils/date.utils';

interface Key {
  id: string;
  code: string;
  name: string;
  cabinet: string;
  hook: string;
  site: string;
  room: string;
  status: 'Available' | 'Unavailable';
  selected: boolean;
  /** assignedToOtherJob from the API: only a key assigned to this job can be picked. */
  selectable: boolean;
  assignedJobCode?: string | null;
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

export type JobScheduleType = 'OPEN' | 'SCHEDULED';

const THIRD_PARTY_ACCESS_JOB_TYPE = 'Third Party Access';

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
    scheduleType: 'SCHEDULED' as JobScheduleType,
    date: '',
    startTime: '',
    endTime: '',
    duration: '',
    officer: '',
    priority: 'Low',
    idChecked: false,
    idType: '',
    notifyCompletion: '',
    notifyNotCompleted: '',
    notes: '',
    visitorFullName: '',
    visitorCompany: '',
    visitorContactNumber: '',
    visitorPurposeOfVisit: ''
  };

  idTypeOptions: RichSelectOption[] = [
    { value: 'ID name', label: 'ID name' },
    { value: 'Photo ID', label: 'Photo ID' },
    { value: 'Employee ID', label: 'Employee ID' },
    { value: 'Passport', label: 'Passport' },
    { value: 'Driving Licence', label: 'Driving Licence' },
  ];

  /**
 * `visitorTypeId` is the id from the visitor-types lookup, resolved only when a
 * Third Party Access job type is selected.
 */
  get visitorTypeId(): string | null {
    return this.showVisitorType ? (this.selectedVisitorType || null) : null;
  }

  showAddKeysModal = false;
  showAddChecklistModal = false;
  showAddJobTypeModal = false;
  newJobTypeName = '';
  keys: Key[] = [];
  /** Full availability response; search, status filter and paging run over it. */
  availableKeys: Key[] = [];
  private retainedSelectedKeys: Key[] = [];
  keysLoading = true;
  currentPage = 0;
  pageSize = 6;
  totalPages = 0;
  // Filters inside the "Add Required Keys" modal. The site list reuses the
  // form's `siteOptions` so both dropdowns list the same sites.
  keySearch = '';
  keySiteFilter = '';
  keyStatusFilter = '';
  totalElements = 0;
  checklistItems: ChecklistItem[] = [];
  newChecklistItem = '';
  checklistLoading = false;
  activeTab = 0;
  status: 'active' | 'inactive' = 'active';

  clientOptions: RichSelectOption[] = [];
  siteOptions: RichSelectOption[] = [];
  jobTypeOptions: RichSelectOption[] = [];
  officerOptions: RichSelectOption[] = [];
  priorityOptions: RichSelectOption[] = [
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' },
  ];

  // Visitor types come from /visitor-types and are loaded when a Third Party
  // Access job type is selected, so the placeholder is all this form starts with.
  VisitorTypeOptions: RichSelectOption[] = [
    { value: '', label: 'Select visitor type' },
  ];
  visitorTypesLoading = false;
  selectedVisitorType = '';

  setStatus(status: 'active' | 'inactive'): void {
    this.status = status;
  }

  /** The Yes/No control drives the `idChecked` payload flag. */
  setIdChecked(checked: boolean): void {
    this.job.idChecked = checked;
  }

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
  keysModalSubmitted = false;
  keysModalError = '';

  // Present when the route carries an :id, which turns the same form into an
  // edit for an existing job.
  jobId: string | null = null;
  isEditMode = false;
  loadingJob = false;

  constructor(private router: Router, private route: ActivatedRoute, private keyVault: KeyVaultService, private clientService: ClientService, private userService: UserService, private toast: ToastService) {}

  ngOnInit(): void {
    this.jobId = this.route.snapshot.paramMap.get('id') || null;
    this.isEditMode = !!this.jobId;
    this.loadJobTypes();
    this.loadClients();
    this.loadOfficers();
    if (this.jobId) {
      this.loadJobForEdit(this.jobId);
    }
  }

  get pageTitle(): string {
    return this.isEditMode ? 'Edit Job' : 'Create Job';
  }

  get pageSubtitle(): string {
    return this.isEditMode
      ? 'Update the details below to edit this job.'
      : 'Fill in the details below to create a new job.';
  }

  get submitLabel(): string {
    if (this.saving) return this.isEditMode ? 'Saving...' : 'Creating...';
    return this.isEditMode ? 'Save Changes' : 'Create Job';
  }

  get selectedKeys(): Key[] {
    const selectedById = new Map<string, Key>();
    for (const key of [...this.retainedSelectedKeys, ...this.availableKeys, ...this.keys]) {
      if (key.selected) selectedById.set(key.id, key);
    }
    return Array.from(selectedById.values());
  }

  get checklistLeft(): ChecklistItem[] {
    return this.checklistItems.filter((_, i) => i % 2 === 0);
  }

  get checklistRight(): ChecklistItem[] {
    return this.checklistItems.filter((_, i) => i % 2 === 1);
  }

  get checklistHeading(): string {
    const label = this.selectedJobTypeLabel || 'Job Type';
    return `${label} Checklist`;
  }

  get startIndex(): number {
    return this.totalElements > 0 ? this.currentPage * this.pageSize + 1 : 0;
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
    // Session storage is checked too: without "remember device" the org id
    // only lives there, and a miss here silently empties every lookup.
    return sessionStorage.getItem('org_id') || sessionStorage.getItem('organizationId')
      || localStorage.getItem('org_id') || localStorage.getItem('organizationId') || null;
  }

  private loadJobTypes(): void {
    const orgId = this.getOrgId();
    if (!orgId) return;
    this.keyVault.listJobTypes(orgId, false).subscribe((res: any) => {
      const items = res?.data?.items ?? res?.items ?? res?.data ?? res ?? [];
      const list = Array.isArray(items) ? items : [];
      if (list.length > 0) {
        this.jobTypeOptions = this.toRichOptions(list);
      }
      this.ensureThirdPartyAccessJobType(orgId, list);
    });
  }

  /**
   * "Third Party Access" ships as a standard job type, so it is created for the
   * organisation once if it is not already returned by the job types endpoint.
   */
  private ensureThirdPartyAccessJobType(orgId: string, items: any[]): void {
    const exists = items.some((t: any) => (t?.name || '').trim().toLowerCase() === THIRD_PARTY_ACCESS_JOB_TYPE.toLowerCase());
    if (exists) return;

    this.keyVault.createJobType(orgId, {
      name: THIRD_PARTY_ACCESS_JOB_TYPE,
      description: 'Third party access, escorted entry and collection on a client site.',
      iconKey: 'briefcase',
      sortOrder: items.length + 1,
      active: true,
    }).subscribe({
      next: (res: any) => {
        const created = res?.data ?? res;
        if (!created?.id) return;
        this.jobTypeOptions = [
          ...this.jobTypeOptions,
          { value: created.id, label: created.name || THIRD_PARTY_ACCESS_JOB_TYPE },
        ];
      },
      error: () => {
        // Not fatal: the user can still add the type manually.
      },
    });
  }

  /**
   * Populate the form from an existing job. Client and site option lists load
   * asynchronously, so the dependent lists are requested once the ids are set.
   */
  private loadJobForEdit(jobId: string): void {
    const orgId = this.getOrgId();
    if (!orgId) return;
    this.loadingJob = true;
    this.keyVault.getJob(orgId, jobId).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res ?? {};
        this.applyJobToForm(data);
        this.loadingJob = false;
      },
      error: () => {
        this.loadingJob = false;
        this.toast.error('Failed to load job');
      },
    });
  }

  private applyJobToForm(data: any): void {
    const priority = String(data.priority || '').toUpperCase();
    const scheduleType: JobScheduleType = String(data.scheduleType || '').toUpperCase() === 'OPEN' ? 'OPEN' : 'SCHEDULED';

    this.job.title = data.title || '';
    this.job.reference = data.reference || '';
    this.job.description = data.description || '';
    this.job.notes = data.additionalNotes || '';
    this.job.idChecked = data.idChecked === true;
    this.job.idType = data.idType || this.job.idType;
    this.job.priority = this.fromApiPriority(priority);

    const scheduledDate = this.toApiDateOnly(data.scheduledDate);
    const dueDate = this.toApiDateOnly(data.dueDate);
    this.job.scheduleType = scheduleType;
    this.activeTab = scheduleType === 'OPEN' ? 0 : 1;
    const formStart = scheduleUtcToLocal(
      scheduleType === 'OPEN'
        ? (dueDate || scheduledDate)
        : (this.toApiDateOnly(data.startTime) || scheduledDate),
      this.toApiTimeOnly(scheduleType === 'OPEN' ? data.dueDate : data.startTime)
    );
    this.job.date = formStart.date;
    this.job.startTime = formStart.time;
    const scheduledEndDate = this.toApiDateOnly(data.endTime) || scheduledDate;
    this.job.endTime = scheduleUtcToLocal(scheduledEndDate, this.toApiTimeOnly(data.endTime)).time;
    this.updateDuration();

    this.selectedJobType = data.jobTypeId || data.jobType?.id || '';
    this.selectedClient = data.clientId || data.client?.id || '';
    this.selectedSite = data.siteId || data.site?.id || '';
    this.job.officer = data.officerUserId || data.officer?.id || '';

    if (this.selectedClient) {
      this.loadSites(this.selectedClient);
      this.loadEmergencyContacts(this.selectedClient);
    }
    if (this.selectedJobType) {
      this.loadChecklist(this.selectedJobType);
      // Editing a Third Party Access job needs the same visitor-type lookup and
      // must restore the visitor the job already carries.
      this.loadVisitorTypes(true);
      if (data.visitorTypeId) this.selectedVisitorType = data.visitorTypeId;
    }

    // Visitor details are top-level on the job, not nested under a visitor object.
    this.job.visitorFullName = data.visitorFullName ?? '';
    this.job.visitorCompany = data.visitorCompany ?? '';
    this.job.visitorContactNumber = data.visitorContactNumber ?? '';
    this.job.visitorPurposeOfVisit = data.visitorPurposeOfVisit ?? '';

    const escalation = data.escalation || {};
    this.selectedCompletionContactIds = this.toContactIds(escalation.notifyOnCompletion);
    this.selectedNotCompletedContactIds = this.toContactIds(escalation.notifyOnNotCompleted);

    this.applyJobChecklist(data.checklist?.items);
    this.applyJobKeys(data.requiredKeys?.keys || data.keys || []);
  }

  private applyJobChecklist(items: any[]): void {
    const list = Array.isArray(items) ? items : [];
    if (!list.length) return;
    this.checklistItems = list.map((ci: any) => ({
      id: ci.id || ci.checklistItemId || '',
      title: ci.title || ci.text || '',
      text: ci.title || ci.text || '',
    }));
  }

  private applyJobKeys(keys: any[]): void {
    const list = Array.isArray(keys) ? keys : [];
    this.keys = list.map((k: any) => ({
      id: k.id || k.keyId || k.keyCode || '',
      code: k.keyCode || k.code || '',
      name: k.keyName || k.name || '',
      cabinet: k.storageLocation || k.cabinet || '',
      hook: k.hook || '',
      site: k.siteName || k.site || '',
      room: k.description || k.room || '',
      // Keys already on the job stay selectable so they can be unchecked again.
      status: 'Available',
      selected: true,
      selectable: true,
      assignedJobCode: k.assignedJobCode ?? null,
    }));
  }

  private toContactIds(list: any): string[] {
    if (!Array.isArray(list)) return [];
    return list.map((c: any) => (typeof c === 'string' ? c : c?.id || c?.contactId || '')).filter(Boolean);
  }

  /** `2026-05-15T18:30:00Z` -> `2026-05-15`. */
  private toApiDateOnly(value?: string | null): string {
    if (!value) return '';
    const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : '';
  }

  /** `18:30`, `18:30:00` or a full ISO timestamp -> `18:30`. */
  private toApiTimeOnly(value?: string | null): string {
    if (!value) return '';
    const match = String(value).match(/T(\d{2}):(\d{2})/) || String(value).match(/^(\d{2}):(\d{2})/);
    return match ? `${match[1]}:${match[2]}` : '';
  }

  private fromApiPriority(priority: string): string {
    if (priority === 'HIGH') return 'High';
    if (priority === 'MEDIUM') return 'Medium';
    return 'Low';
  }

  private loadClients(): void {
    this.clientService.listClients({ page: 0, size: 200, status: 'ACTIVE' }).subscribe((result: any) => {
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
      this.siteOptions = this.toRichOptions(sites.filter(s => s.status === 'ACTIVE'));
    });
  }

  private loadEmergencyContacts(clientId: string): void {
    if (!clientId) {
      this.completionContactOptions = [];
      this.notCompletedContactOptions = [];
      return;
    }
    this.contactsLoading = true;
    this.clientService.listEmergencyContacts(clientId, { page: 0, size: 200 }).subscribe({
      next: (result: any) => {
        const items = result?.items ?? result?.data ?? result ?? [];
        const options: MultiOption[] = items.map((item: any) => ({
          value: item.id ?? '',
          text: `${item.firstName || ''} ${item.lastName || ''}`.trim() || item.fullName || item.name || 'Emergency Contact'
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
    this.loadEmergencyContacts(clientId);
  }

  onSiteChange(siteId: string): void {
    this.selectedSite = siteId;
    this.loadKeys(0);
  }

  onJobTypeChange(jobTypeId: string): void {
    this.selectedJobType = jobTypeId;
    this.checklistItems = [];
    this.loadChecklist(jobTypeId);
    // Visitor types are only meaningful for a Third Party Access job, so the
    // lookup is made here rather than on page load.
    this.loadVisitorTypes();
    this.applyDefaultScheduleTab();
  }

  /**
   * Third Party Access jobs are walk-in / ad-hoc, so the Open tab is
   * pre-selected and the Scheduled tab is disabled. Lock and unlock jobs are
   * point-in-time jobs, so they open on the Scheduled tab. Everything else
   * defaults to Open.
   */
  private applyDefaultScheduleTab(): void {
    const isThirdParty = this.showVisitorType;
    let scheduleType: JobScheduleType = 'OPEN';

    if (isThirdParty || !this.selectedJobTypeLabel.toLowerCase().includes('lock')) {
      this.activeTab = 0;
      scheduleType = 'OPEN';
      if (isThirdParty) {
        // Open jobs have no start/end window, so clear any window fields so they
        // are never sent by accident for a Third Party Access job.
        this.job.date = '';
        this.job.startTime = '';
        this.job.endTime = '';
        this.updateDuration();
      }
    } else {
      this.activeTab = 1;
      scheduleType = 'SCHEDULED';
    }

    this.job.scheduleType = scheduleType;
    delete this.errors['date'];
    delete this.errors['startTime'];
    delete this.errors['endTime'];
    this.loadKeys(0);
  }

  
  private loadVisitorTypes(force = false): void {
    if (!this.showVisitorType) {
      // Leaving Third Party Access clears the choice so no stale id is sent.
      this.selectedVisitorType = '';
      this.VisitorTypeOptions = [{ value: '', label: 'Select visitor type' }];
      return;
    }
    if (!force && this.VisitorTypeOptions.length > 1) return;

    const orgId = this.getOrgId();
    if (!orgId) return;

    this.visitorTypesLoading = true;
    this.keyVault.listVisitorTypes(orgId, false).subscribe({
      next: (res: any) => {
        this.visitorTypesLoading = false;
        const data = res?.data ?? res ?? [];
        const items = Array.isArray(data) ? data : (data.content ?? data.items ?? []);
        this.VisitorTypeOptions = [
          { value: '', label: 'Select visitor type' },
          ...items.map((v: any) => ({
            value: v.id ?? v.visitorTypeId ?? v.code ?? v.name ?? '',
            label: v.name ?? v.label ?? v.code ?? '—',
          })).filter((v: RichSelectOption) => !!v.value)
        ];
      },
      error: () => {
        this.visitorTypesLoading = false;
        this.VisitorTypeOptions = [{ value: '', label: 'Select visitor type' }];
      }
    });
  }

  onVisitorTypeChange(value: string): void {
    this.selectedVisitorType = value;
  }

  /**
   * The "Job Schedule" cards are the only control for the job's schedule kind,
   * so the API `scheduleType` follows the selected tab: Open -> OPEN,
   * Scheduled -> SCHEDULED.
   */
  onScheduleTabChange(tab: number): void {
    // The Scheduled tab is disabled for Third Party Access jobs; ignore clicks
    // that would switch away from Open while it is disabled.
    if (tab === 1 && this.scheduleTabDisabled) return;
    this.job.scheduleType = tab === 0 ? 'OPEN' : 'SCHEDULED';
    this.updateDuration();
    this.refreshKeyAvailability();
    // Each tab validates only its own fields, so anything the previous tab
    // flagged must not keep blocking the form.
    delete this.errors['date'];
    delete this.errors['startTime'];
    delete this.errors['endTime'];
  }

  get isOpenSchedule(): boolean {
    const label = this.selectedJobTypeLabel.trim().toLowerCase();
    if (!this.selectedJobType) return true;
    if (label === THIRD_PARTY_ACCESS_JOB_TYPE.toLowerCase()) return true;
    if (label.includes('lock')) return false;
    return true;
  }

  /** True when the job type forces the Scheduled tab. */
  get isScheduledOnly(): boolean {
    const label = this.selectedJobTypeLabel.trim().toLowerCase();
    return !!this.selectedJobType && label.includes('lock');
  }

  /** True when the job type forces the Open tab. */
  get isOpenOnly(): boolean {
    return this.showVisitorType;
  }

  /** Both tabs disabled when the job type locks the schedule kind. */
  get scheduleLocked(): boolean {
    return this.isOpenOnly || this.isScheduledOnly;
  }

  /** Open tab disabled for lock/unlock job types. */
  get openTabDisabled(): boolean {
    return this.isScheduledOnly;
  }

  /** Scheduled tab disabled for Third Party Access job type. */
  get scheduleTabDisabled(): boolean {
    return this.isOpenOnly;
  }

  getJobTypeBgClass(): string {
  if (
    this.selectedJobTypeLabel === 'Lock Service' ||
    this.selectedJobTypeLabel === 'Lock Job'
  ) {
    return 'bg-orange-50';
  }

  if (
    this.selectedJobTypeLabel === 'Unlock Service' ||
    this.selectedJobTypeLabel === 'Unlock Job'
  ) {
    return 'bg-emerald-50';
  }

  return 'bg-gray-50';
}

  getPriorityBgClass(): string {
    const value = this.priorityOptions.find(p => p.value === this.job.priority)?.value;
    if (value === 'Low') {
      return 'bg-emerald-50';
    }
    if (value === 'Medium') {
      return 'bg-orange-50';
    }
    if (value === 'High') {
      return 'bg-rose-50';
    }
    return 'bg-gray-50';
  }

  onDateChange(event: any): void {
    const dateStr = event?.dateStr || this.job.date;
    this.job.date = this.toApiDate(dateStr);
    this.refreshKeyAvailability();
  }

  onStartTimeChange(time: string): void {
    this.job.startTime = this.toApiTime(time || this.job.startTime);
    this.updateDuration();
    this.refreshKeyAvailability();
  }

  onEndTimeChange(time: string): void {
    this.job.endTime = this.toApiTime(time || this.job.endTime);
    this.updateDuration();
    this.refreshKeyAvailability();
  }

  /**
   * Availability depends on the job's schedule window, so an open key list has
   * to be re-fetched once the date, times or schedule kind change.
   */
  private refreshKeyAvailability(): void {
    if (!this.showAddKeysModal) return;
    this.loadKeys(0);
  }

  private updateDuration(): void {
    if (this.isOpenSchedule) {
      this.job.duration = '';
      return;
    }
    if (this.job.startTime && this.job.endTime) {
      this.job.duration = this.calculateDuration(this.job.startTime, this.job.endTime);
    } else {
      this.job.duration = '';
    }
  }

  /**
   * Open jobs carry a single `dueDate` instead of a start/end window. The Open
   * tab only asks for a "due by" date, so an unset time means end of the
   * selected calendar day in the configured timezone.
   */
  private toApiDueDate(): string | undefined {
    if (!this.job.date) return undefined;
    const time = this.job.startTime ? this.job.startTime : '23:59';
    const utcDueDate = scheduleToUtc(this.job.date, time);
    return `${utcDueDate.date}T${utcDueDate.time}:00Z`;
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

    const file = files[0];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      this.attachmentError = 'Only image and PDF files are allowed.';
      input.value = '';
      return;
    }

    if (this.selectedFiles.length >= 1) {
      this.attachmentError = 'Only one file is allowed.';
      input.value = '';
      return;
    }

    this.selectedFiles.push(file);
    const reader = new FileReader();
    reader.onload = () => this.attachmentPreviews.push({ file, url: reader.result as string, status: 'pending' });
    reader.readAsDataURL(file);

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
        this.toast.success('Job created successfully!');
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

    this.keysLoading = true;
    this.keyVault.getKeyAvailability(orgId, {
      scheduleType: this.job.scheduleType,
      // Only a scheduled job has a window; an open job's due date must not be
      // sent here or the API would filter on the wrong dates.
      // The availability endpoint takes the date on its own and `HH:mm` times, not
      // full UTC instants, so the query deliberately differs from the save payload.
      scheduledDate: this.isOpenSchedule ? undefined : (this.job.date || undefined),
      startTime: this.isOpenSchedule ? undefined : (this.job.startTime || undefined),
      endTime: this.isOpenSchedule ? undefined : (this.job.endTime || undefined),
      clientId: this.selectedClient || undefined,
      // The modal's own site filter narrows the form's site rather than
      // replacing it, so a job with no site set can still filter by site.
      siteId: this.keySiteFilter || this.selectedSite || undefined,
      // Editing must not filter out the keys the job already holds.
      excludeJobId: this.isEditMode ? (this.jobId || undefined) : undefined
    }).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res ?? {};
        const items = data.content ?? data.items ?? data.data ?? data ?? [];
        // Keys already chosen must survive a refresh of the availability list.
        const selectedKeys = this.selectedKeys;
        const selectedIds = new Set(selectedKeys.map((k: Key) => k.id));
        const itemIds = new Set(items.map((k: any) => k.id ?? k.keyId ?? '').filter(Boolean));
        this.retainedSelectedKeys = selectedKeys.filter((key: Key) => !itemIds.has(key.id));
        this.availableKeys = items.map((k: any) => {
          const id = k.id ?? k.keyId ?? '';
          // assignedToOtherJob is the API's signal that the key is booked elsewhere:
          // false = free for this job and selectable, true = unavailable.
          const selectable = k.assignedToOtherJob === false;
          return {
            code: k.keyCode ?? '',
            id,
            name: k.keyName ?? k.name ?? '',
            cabinet: k.storageLocationName ?? k.storageLocation ?? '',
            hook: k.hookNo != null ? String(k.hookNo) : '',
            site: k.siteName ?? '',
            room: k.description ?? '',
            status: selectable ? 'Available' : 'Unavailable',
            // A key already chosen for this job stays checked even if the API reports it as
            // taken, so editing never silently drops an existing assignment.
            selected: selectedIds.has(id) || (selectable && k.selected === true),
            selectable,
            assignedJobCode: k.assignedJobCode ?? null
          } as Key;
        });
        // The endpoint takes no paging or filter arguments, so the search box,
        // status filter and pager are applied to the returned set.
        this.applyKeyFilters(page);
        this.keysLoading = false;
      },
      error: () => {
        this.availableKeys = [];
        this.keys = [];
        this.totalElements = 0;
        this.totalPages = 0;
        this.keysLoading = false;
      }
    });
  }

  /** Client-side search, status filter and paging over the available key set. */
  private applyKeyFilters(page = this.currentPage): void {
    const q = this.keySearch.trim().toLowerCase();
    const filtered = this.availableKeys.filter((k: Key) => {
      const matchesQuery = !q || (k.code || '').toLowerCase().includes(q) || (k.name || '').toLowerCase().includes(q);
      const matchesStatus = !this.keyStatusFilter || (k.status || '').toLowerCase() === this.keyStatusFilter.toLowerCase();
      return matchesQuery && matchesStatus;
    });

    this.totalElements = filtered.length;
    this.totalPages = Math.ceil(filtered.length / this.pageSize);
    this.currentPage = this.totalPages > 0
      ? Math.min(Math.max(0, page), this.totalPages - 1)
      : 0;

    const start = this.currentPage * this.pageSize;
    const pageKeys = filtered.slice(start, start + this.pageSize);
    this.keys = pageKeys;
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.applyKeyFilters(page);
    }
  }

  onKeySearchChange(): void {
    this.currentPage = 0;
    this.applyKeyFilters(0);
  }

  onKeySiteFilterChange(siteId: string): void {
    this.keySiteFilter = siteId || '';
    this.currentPage = 0;
    this.loadKeys(0);
  }

  onKeyStatusFilterChange(status: string): void {
    this.keyStatusFilter = status || '';
    this.currentPage = 0;
    this.applyKeyFilters(0);
  }

  prevPage(): void {
    if (this.currentPage > 0) {
      this.applyKeyFilters(this.currentPage - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.applyKeyFilters(this.currentPage + 1);
    }
  }

  get pageNumbers(): (number | '...')[] {
    if (this.totalPages <= 0) return [];
    if (this.totalPages <= 7) {
      return Array.from({ length: this.totalPages }, (_, i) => i + 1);
    }
    const pages: (number | '...')[] = [1];
    const currentPageNumber = this.currentPage + 1;
    const start = Math.max(2, currentPageNumber - 1);
    const end = Math.min(this.totalPages - 1, currentPageNumber + 1);
    if (start > 2) pages.push('...');
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (end < this.totalPages - 1) pages.push('...');
    pages.push(this.totalPages);
    return pages;
  }

  openAddKeysModal(): void {
    this.showAddKeysModal = true;
    // Clear any filter left over from a previous open so the list always
    // starts from the full set for this client.
    this.keySearch = '';
    this.keySiteFilter = '';
    this.keyStatusFilter = '';
    this.currentPage = 0;
    this.loadKeys(0);
  }

  closeAddKeysModal(): void {
    this.showAddKeysModal = false;
    this.keysModalSubmitted = false;
    this.keysModalError = '';
  }

  confirmAddKeys(): void {
    this.keysModalSubmitted = true;
    if (this.selectedKeys.length === 0) {
      this.keysModalError = 'Please select at least one key';
      return;
    }
    this.closeAddKeysModal();
  }

  toggleKeySelection(key: Key): void {
    // Keys the API reports as not assigned to this job cannot be added.
    if (!key.selectable) return;
    key.selected = !key.selected;
  }

  clearAllKeys(): void {
    this.retainedSelectedKeys.forEach(k => k.selected = false);
    this.availableKeys.forEach(k => k.selected = false);
    this.keys.forEach(k => k.selected = false);
  }

  removeKey(key: Key): void {
    key.selected = false;
    const availableKey = this.availableKeys.find(availableKey => availableKey.id === key.id);
    if (availableKey) availableKey.selected = false;
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

    // Third Party Access checklist items are org-level, so no `jobTypeId` is
    // sent for them; every other job type sends its own id.
    const isThirdPartyAccess = this.showVisitorType;
    this.keyVault.createChecklistItem(orgId, {
      title,
      jobTypeId: isThirdPartyAccess ? undefined : this.selectedJobType,
      sortOrder: this.checklistItems.length + 1,
      active: true,
    }).subscribe((res: any) => {
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
    this.checklistItems = this.checklistItems.filter(item => item.id !== id);
  }

  private validateForm(): boolean {
    this.errors = {};
    this.submitted = true;

    if (!this.selectedJobType) this.errors['jobType'] = 'Job type is required';
    if (!this.selectedClient) this.errors['client'] = 'Client is required';
    if (!this.selectedSite) this.errors['site'] = 'Site is required';
    if (!this.job.title.trim()) this.errors['title'] = 'Job title is required';
    // Only the fields of the selected schedule tab are validated: an open job
    // is available immediately so its due date stays optional, while a
    // scheduled job needs the full date and time window.
    if (!this.isOpenSchedule) {
      if (!this.job.date) this.errors['date'] = 'Date is required';
      if (!this.job.startTime) this.errors['startTime'] = 'Start time is required';
      if (!this.job.endTime) this.errors['endTime'] = 'End time is required';
    }
    // Visitor fields validation (only for Third Party Access job type)
    if (this.showVisitorType) {
      if (!this.job.visitorFullName.trim()) this.errors['visitorFullName'] = 'Visitor full name is required';
      if (!this.job.visitorCompany.trim()) this.errors['visitorCompany'] = 'Visitor company name is required';
      if (!this.job.visitorPurposeOfVisit.trim()) this.errors['visitorPurposeOfVisit'] = 'Purpose of visit is required';
    }
    if (this.job.idChecked && !this.job.idType.trim()) this.errors['idType'] = 'ID type is required';
    if (!this.job.officer) this.errors['officer'] = 'Officer is required';
    if (this.selectedKeys.length === 0) this.errors['keys'] = 'At least one key is required';

    return Object.keys(this.errors).length === 0;
  }

  createJob(): void {
    // A second click while the first request is in flight would create a
    // duplicate job, so the submit is ignored until it settles.
    if (this.saving) return;
    const orgId = this.getOrgId();
    if (!orgId) return;

    if (!this.validateForm()) return;

    const payload = this.buildJobPayload();

    if (this.isEditMode && this.jobId) {
      this.saving = true;
      this.keyVault.updateJob(orgId, this.jobId, payload).subscribe({
        next: () => {
          this.saving = false;
          this.toast.success('Job updated successfully!');
          this.router.navigate(['/jobs', this.jobId]);
        },
        error: (err) => {
          console.error('Failed to update job', err);
          this.saving = false;
          this.toast.error('Failed to update job');
        }
      });
      return;
    }

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

  private buildJobPayload(): any {
    const payload: any = {
      jobTypeId: this.selectedJobType,
      title: this.job.title,
      clientId: this.selectedClient || this.job.client,
      siteId: this.selectedSite || this.job.site,
      visitorTypeId: this.visitorTypeId ?? undefined,
      reference: this.job.reference || '',
      description: this.job.description || undefined,
      scheduleType: this.job.scheduleType,
      officerUserId: this.job.officer || undefined,
      priority: this.mapPriority(this.job.priority),
      keyIds: this.selectedKeys.map(k => k.id),
      checklistItems: this.checklistItems.map(ci => ci.id),
      idChecked: this.job.idChecked,
      // An ID type only means anything when verification is switched on.
      idType: this.job.idChecked ? (this.job.idType || undefined) : undefined,
      notifyOnCompletion: this.selectedCompletionContactIds,
      notifyOnNotCompleted: this.selectedNotCompletedContactIds,
      platform: 'WEB',
      additionalNotes: this.job.notes || undefined,
      // Visitor details belong to the job payload itself and travel with both
      // schedule types.
      visitorFullName: this.job.visitorFullName || undefined,
      visitorCompany: this.job.visitorCompany || undefined,
      visitorContactNumber: this.job.visitorContactNumber || undefined,
      visitorPurposeOfVisit: this.job.visitorPurposeOfVisit || undefined
    };

// Open jobs are due at a single instant; scheduled jobs span a window. Only the
  // fields belonging to the chosen schedule type are sent, so an open job never
  // carries a window and a scheduled job never carries a due date.
  if (this.isOpenSchedule) {
    payload.dueDate = this.toApiDueDate();
  } else {
    const start = scheduleToUtc(this.job.date, this.job.startTime);
    const end = scheduleToUtc(this.job.date, this.job.endTime);
    payload.scheduledDate = start.date || undefined;
    payload.startTime = start.time || undefined;
    payload.endTime = end.time || undefined;
  }

    return payload;
  }

  get selectedJobTypeLabel(): string {
    return this.jobTypeOptions.find(o => o.value === this.selectedJobType)?.label || 'Select job type';
  }

  /**
   * Visitor type only applies to escorted/third party entry. Lock and unlock
   * jobs carry no visitor, so the field is hidden rather than left misleading.
   */
  get showVisitorType(): boolean {
    const label = this.selectedJobTypeLabel.trim().toLowerCase();
    if (!this.selectedJobType || label === 'select job type') return false;
    return label === THIRD_PARTY_ACCESS_JOB_TYPE.toLowerCase();
  }

  get selectedSiteLabel(): string {
    return this.siteOptions.find(o => o.value === this.selectedSite)?.label || 'Select site';
  }

  get selectedClientLabel(): string {
    return this.clientOptions.find(o => o.value === this.selectedClient)?.label || 'Select client';
  }

 getPriorityColor(priority: string): string {
  switch (priority) {
    case 'Low':
      return '#22C55E';

    case 'Medium':
      return '#F59E0B';

    case 'High':
      return '#EF4444';

    default:
      return '#6B7280';
  }
}

  private mapPriority(priority: string): string {
    const map: Record<string, string> = {
      'Low': 'LOW',
      'Medium': 'MEDIUM',
      'High': 'HIGH',
    };
    return map[priority] || 'LOW';
  }

  goBack(): void {
    this.router.navigate(['/jobs']);
  }
}