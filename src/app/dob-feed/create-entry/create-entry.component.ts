import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { of, catchError, map, Observable } from 'rxjs';
import { EdobService } from '../../core/services/edob.service';
import { AuthService } from '../../core/services/auth.service';
import { AIGenerationService, AIMessage } from '../../core/services/ai-generation.service';
import { Entry, EntryType, Category, IncidentType, HandoverType, OrgUser } from '../../core/models/edob.models';
import { DateTimePickerComponent } from '../../shared/components/form/datetime-picker/datetime-picker.component';
import { RichSelectComponent, RichSelectOption } from '../../shared/components/form/rich-select/rich-select.component';
import { MultiSelectComponent, Option as MultiOption } from '../../shared/components/form/multi-select/multi-select.component';

interface AIHistoryItem {
  prompt: string;
  result: string;
  timestamp: Date;
}

interface SelectedFile {
  file?: File;
  previewUrl?: string;
  fileName?: string;
  fileSize?: number;
  isExisting?: boolean;
  attachmentId?: string;
}

type AttachmentType = 'pdf' | 'image' | 'audio';

import { AddCategoryModalComponent } from './add-category-modal/add-category-modal.component';
import { AddEntryTypeModalComponent } from './add-entry-type-modal/add-entry-type-modal.component';

@Component({
  selector: 'app-create-entry',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    DateTimePickerComponent,
    RichSelectComponent,
    MultiSelectComponent,
    AddCategoryModalComponent,
    AddEntryTypeModalComponent,
  ],
  templateUrl: './create-entry.component.html',
})
export class CreateEntryComponent implements OnInit {
  activeTab = 0;
  isSubmitting = false;
  isLoadingEntry = false;
  errorMessage = '';

  editMode = false;
  editEntryId: string | null = null;

  tabs = [
    { id: 'basic', label: 'Basic Entry', icon: '✚', entryTypeCode: 'BASIC' },
    { id: 'incident', label: 'Incident', icon: '⚠️', entryTypeCode: 'INCIDENT' },
    { id: 'handover', label: 'Handover', icon: '👥', entryTypeCode: 'HANDOVER' },
    { id: 'followup', label: 'Follow-Up', icon: '✅', entryTypeCode: 'FOLLOW_UP' },
  ];

  // Common fields
  title = '';
  categoryId = '';
  priority = '';
  description = '';
  assignedToUserId = '';
  location = '';
  occurredAt = '';
  descriptionLength = 0;
  maxChars = 5000;

  // Validation errors
  titleError = '';
  categoryError = '';
  priorityError = '';
  descriptionError = '';
  occurredAtError = '';
  locationError = '';

  // Per-type attachment state (max 2 each)
  pdfFiles: SelectedFile[] = [];
  imageFiles: SelectedFile[] = [];
  audioFiles: SelectedFile[] = [];
  fileError = '';
  readonly maxFilesPerType = 2;
  readonly maxFileSize = 100 * 1024 * 1024;

  // Audio recorder state
  isRecording = false;
  recordingTime = 0;
  isProcessingAudio = false;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private recordingTimer: any = null;
  readonly maxRecordingMs = 10 * 60 * 1000;

  // Incident fields
  incidentTitle = '';
  incidentTypeId = '';
  incidentDate = '';
  incidentTime = '';
  peopleInvolved = '';
  incidentDescription = '';
  immediateActionsTaken = '';
  severityScore = '';
  incidentTitleError = '';
  incidentTypeError = '';
  incidentDateError = '';
  locationIncidentError = '';
  incidentDescriptionError = '';
  immediateActionsError = '';

  // Handover fields
  handoverTitle = '';
  handoverTypeId = '';
  handoverDateTime = '';
  handoverFrom = '';
  handoverTo = '';
  handoverLocation = '';
  operationalSummary = '';
  operationalSummaryLength = 0;
  outstandingIssues = '';
  outstandingActions = '';
  importantInfo = '';
  handoverTitleError = '';
  handoverTypeError = '';
  handoverDateTimeError = '';
  handoverFromError = '';
  handoverToError = '';
  operationalSummaryError = '';
  outstandingIssuesError = '';
  outstandingActionsError = '';
  importantInfoError = '';

  // Follow-Up fields
  followUpTitle = '';
  parentEntryId = '';
  followUpTitleError = '';
  parentEntryIdError = '';

  // API-loaded data
  entryTypes: EntryType[] = [];
  categories: Category[] = [];
  incidentTypes: IncidentType[] = [];
  handoverTypes: HandoverType[] = [];
  orgUsers: OrgUser[] = [];
  isLoadingData = false;

  handoverFromUserId = '';
  handoverToUserId = '';
  peopleInvolvedUserIds: string[] = [];

   showAddCategoryModal = false;
  showAddEntryTypeModal = false;
  entryTypeModalKind: 'incident' | 'handover' = 'incident';

  priorities = [
    { value: 'LOW', label: 'Low' },
    { value: 'NORMAL', label: 'Normal' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
    { value: 'CRITICAL', label: 'Critical' },
  ];

  private readonly SHIELD_ICON = '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>';
  private readonly OPS_ICON = '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"></path>';
  private readonly MAINT_ICON = '<path d="M14.7 6.3a4 4 0 1 0-5.4 5.4L2 19l3 3 7.3-7.3a4 4 0 0 0 5.4-5.4l-2.8 2.8-2-2z"></path>';
  private readonly ENV_ICON = '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"></path><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 11 13.09 12 11"></path>';
  private readonly FLAG_ICON = '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line>';

  private buildSvg(path: string, color: string, size = 16): string {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
  }

  private matchUserId(name: string): string {
    if (!name || !this.orgUsers.length) return '';
    const lower = name.toLowerCase();
    const match = this.orgUsers.find(u => `${u.firstName} ${u.lastName}`.toLowerCase() === lower);
    return match ? match.id : '';
  }

  private categoryIcon(name: string): { path: string; color: string; bg: string } {
    const n = (name || '').toLowerCase();
    if (n.includes('security')) return { path: this.SHIELD_ICON, color: '#2563eb', bg: '#eff6ff' };
    if (n.includes('safety')) return { path: this.SHIELD_ICON, color: '#16a34a', bg: '#f0fdf4' };
    if (n.includes('op')) return { path: this.OPS_ICON, color: '#ea580c', bg: '#fff7ed' };
    if (n.includes('maintenance')) return { path: this.MAINT_ICON, color: '#9333ea', bg: '#faf5ff' };
    if (n.includes('env')) return { path: this.ENV_ICON, color: '#059669', bg: '#ecfdf5' };
    return { path: this.SHIELD_ICON, color: '#2563eb', bg: '#eff6ff' };
  }

  get categoryRichOptions(): RichSelectOption[] {
    return this.categories.map((c) => {
      const icon = this.categoryIcon(c.name);
      return {
        value: c.id,
        label: c.name,
        iconSvg: this.buildSvg(icon.path, icon.color),
        iconBg: icon.bg,
      } as RichSelectOption;
    });
  }

  get priorityRichOptions(): RichSelectOption[] {
    const colors: Record<string, string> = {
      CRITICAL: '#dc2626',
      HIGH: '#ef4444',
      MEDIUM: '#f59e0b',
      NORMAL: '#3b82f6',
      LOW: '#9ca3af',
    };
    return this.priorities.map((p) => ({
      value: p.value,
      label: p.label,
      iconSvg: this.buildSvg(this.FLAG_ICON, colors[p.value] || '#9ca3af'),
    }));
  }

  get incidentTypeOptions() {
    return this.incidentTypes.map((t) => ({ value: t.id, label: t.name }));
  }

  get handoverTypeOptions() {
    return this.handoverTypes.map((t) => ({ value: t.id, label: t.name }));
  }

  private readonly USER_COLORS = [
    { bg: '#dbeafe', text: '#1e40af' },
    { bg: '#fce7f3', text: '#be185d' },
    { bg: '#cffafe', text: '#0e7490' },
    { bg: '#ffedd5', text: '#c2410c' },
    { bg: '#dcfce7', text: '#15803d' },
    { bg: '#f3e8ff', text: '#7e22ce' },
    { bg: '#fef9c3', text: '#a16207' },
    { bg: '#fee2e2', text: '#b91c1c' },
  ];

  private userColor(name: string): { bg: string; text: string } {
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return this.USER_COLORS[index % this.USER_COLORS.length];
  }

  private userInitialsSvg(name: string, textColor: string): string {
    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    return `<svg width="16" height="16" viewBox="0 0 24 24"><text x="12" y="16" text-anchor="middle" font-size="10" font-weight="700" fill="${textColor}" stroke="none" font-family="sans-serif">${initials}</text></svg>`;
  }

  get handoverUserOptions(): RichSelectOption[] {
    return this.orgUsers.map((user) => {
      const name = `${user.firstName} ${user.lastName}`.trim();
      const color = this.userColor(name);
      return {
        value: user.id,
        label: name,
        description: user.email,
        iconSvg: this.userInitialsSvg(name, color.text),
        iconBg: color.bg,
      } as RichSelectOption;
    });
  }

  get peopleInvolvedUserOptions(): MultiOption[] {
    return this.orgUsers.map((user) => ({
      value: user.id,
      text: `${user.firstName} ${user.lastName}`.trim(),
    }));
  }

  // AI drawer state
  aiDrawerOpen = false;
  aiPrompt = '';
  aiHistory: AIHistoryItem[] = [];
  isAiGenerating = false;
  aiError = '';

  constructor(
    private edobService: EdobService,
    private router: Router,
    private route: ActivatedRoute,
    private aiService: AIGenerationService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const entryId = params['id'];
      if (entryId) {
        if (!this.editMode || this.editEntryId !== entryId) {
          this.editMode = true;
          this.editEntryId = entryId;
          this.loadEntryForEdit(entryId);
        }
      } else if (this.editMode) {
        this.editMode = false;
        this.editEntryId = null;
        this.onCancel();
      }
      const tab = params['tab'];
      if (tab) {
        const map: Record<string, number> = { basic: 0, incident: 1, handover: 2, followup: 3 };
        this.activeTab = map[tab] ?? 0;
      }
    });
    this.loadFormData();
  }

  private loadFormData(): void {
    const orgId = this.getOrgId();
    if (!orgId) return;

    this.isLoadingData = true;
    const sub = this.edobService.listCategories(orgId).subscribe({
      next: (cats) => {
        const raw = cats as any;
        let list: Category[] = [];

        if (Array.isArray(raw)) {
          list = raw;
        } else if (raw && typeof raw === 'object') {
          list = raw.data ?? raw.categories ?? raw.content ?? raw.items ?? [];
        }

        this.categories = list.filter((c: Category) => c.active);
        this.isLoadingData = false;
      },
      error: (err) => {
        console.error('Failed to load categories', err);
        this.isLoadingData = false;
      },
    });

    this.edobService.listIncidentTypes(orgId).subscribe({
      next: (types) => {
        const raw = types as any;
        let list: IncidentType[] = [];
        if (Array.isArray(raw)) list = raw;
        else if (raw && typeof raw === 'object') list = raw.data ?? raw.incidentTypes ?? raw.content ?? raw.items ?? [];
        this.incidentTypes = list.filter((t: IncidentType) => t.active);
      },
      error: (err) => console.error('Failed to load incident types', err),
    });

    this.edobService.listHandoverTypes(orgId).subscribe({
      next: (types) => {
        const raw = types as any;
        let list: HandoverType[] = [];
        if (Array.isArray(raw)) list = raw;
        else if (raw && typeof raw === 'object') list = raw.data ?? raw.handoverTypes ?? raw.content ?? raw.items ?? [];
        this.handoverTypes = list.filter((t: HandoverType) => t.active);
      },
      error: (err) => console.error('Failed to load handover types', err),
    });

    this.edobService.listOrgUsers(orgId).subscribe({
      next: (users) => {
        const raw = users as any;
        let list: OrgUser[] = [];
        if (Array.isArray(raw)) list = raw;
        else if (raw && typeof raw === 'object') list = raw.data ?? raw.users ?? raw.content ?? raw.items ?? [];
        this.orgUsers = list;
        this.rematchUserSelections();
      },
      error: (err) => console.error('Failed to load org users', err),
    });
  }

  private loadEntryForEdit(entryId: string): void {
    const orgId = this.getOrgId();
    if (!orgId) return;

    this.isLoadingEntry = true;
    this.edobService.getEntry(orgId, entryId).subscribe({
      next: (entry: Entry) => {
        this.prefillForm(entry);
        this.isLoadingEntry = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to load entry.';
        this.isLoadingEntry = false;
      }
    });
  }

  private prefillForm(entry: Entry): void {
    const typeIndexMap: Record<string, number> = { BASIC: 0, INCIDENT: 1, HANDOVER: 2, FOLLOW_UP: 3 };
    this.activeTab = typeIndexMap[entry.entryTypeCode] ?? 0;
    this.title = entry.title || '';
    this.incidentTitle = entry.title || '';
    this.handoverTitle = entry.title || '';
    this.followUpTitle = entry.title || '';
    this.categoryId = entry.categoryId || '';
    this.priority = entry.priority || '';
    this.description = entry.description || '';
    this.incidentDescription = entry.description || '';
    this.assignedToUserId = entry.assignedToUserId || '';
    this.occurredAt = entry.occurredAt ? entry.occurredAt.replace('Z', '').slice(0, 16) : '';

    const data = entry.data || {};
    this.location = data['location'] || '';
    this.incidentTypeId = entry.incidentTypeId || '';
    this.handoverTypeId = entry.handoverTypeId || '';
    this.handoverDateTime = data['shiftDateTime'] || data['handoverDateTime'] || '';
    this.handoverFrom = data['handoverFrom'] || '';
    this.handoverTo = data['handoverTo'] || '';
    this.handoverFromUserId = data['handoverFromUserId'] || this.matchUserId(data['handoverFrom'] || '');
    this.handoverToUserId = data['handoverToUserId'] || this.matchUserId(data['handoverTo'] || '');
    this.handoverLocation = data['handoverLocation'] || '';
    this.peopleInvolved = Array.isArray(data['peopleInvolved']) ? data['peopleInvolved'].join(', ') : (data['peopleInvolved'] || '');
    this.peopleInvolvedUserIds = Array.isArray(data['peopleInvolvedUserIds'])
      ? data['peopleInvolvedUserIds']
      : (Array.isArray(data['peopleInvolved'])
        ? data['peopleInvolved'].map((name: string) => this.matchUserId(name)).filter(Boolean)
        : []);
    this.outstandingIssues = Array.isArray(data['outstandingIssues']) ? data['outstandingIssues'].join('\n') : (data['outstandingIssues'] || '');
    this.outstandingActions = data['outstandingActions'] || '';
    this.importantInfo = data['importantInformation'] || '';
    this.operationalSummary = data['operationalSummary'] || entry.description || '';
    this.operationalSummaryLength = this.operationalSummary.length;
    this.descriptionLength = (this.description || '').length;
    this.parentEntryId = data['parentEntryId'] || '';
    
    if (entry.attachments && entry.attachments.length > 0) {
      this.clearFiles();
      for (const att of entry.attachments) {
        const fileName = att.fileName || (att as any)['filename'] || 'Unknown';
        const fileSize = att.fileSize || (att as any)['sizeBytes'] || 0;
        const mimeType = ((att.mimeType || (att as any)['contentType'] || '') as string).toLowerCase();
        const item: SelectedFile = {
          fileName,
          fileSize,
          previewUrl: att.url,
          isExisting: true,
          attachmentId: att.id,
        };
        if (mimeType.startsWith('image/') || att.type === 'image' || (att as any)['kind'] === 'PHOTO') {
          this.imageFiles.push(item);
        } else if (mimeType.startsWith('audio/') || att.type === 'audio' || (att as any)['kind'] === 'AUDIO') {
          this.audioFiles.push(item);
        } else if (mimeType === 'application/pdf' || att.type === 'document' || (att as any)['kind'] === 'DOCUMENT') {
          this.pdfFiles.push(item);
        } else {
          this.pdfFiles.push(item);
        }
      }
    }
  }

  getOrgId(): string | null {
    const remember = localStorage.getItem('remember_device');
    if (remember === 'true') {
      return localStorage.getItem('org_id') || localStorage.getItem('organizationId') || null;
    }
    return sessionStorage.getItem('org_id') || sessionStorage.getItem('organizationId') || localStorage.getItem('org_id') || localStorage.getItem('organizationId') || null;
  }

  setActiveTab(index: number): void {
    this.activeTab = index;
    this.clearErrors();
  }

  private clearErrors(): void {
    this.titleError = '';
    this.categoryError = '';
    this.priorityError = '';
    this.descriptionError = '';
    this.occurredAtError = '';
    this.locationError = '';
    this.incidentTitleError = '';
    this.incidentTypeError = '';
    this.incidentDateError = '';
    this.locationIncidentError = '';
    this.incidentDescriptionError = '';
    this.immediateActionsError = '';
    this.handoverTitleError = '';
    this.handoverTypeError = '';
    this.handoverDateTimeError = '';
    this.handoverFromError = '';
    this.handoverToError = '';
    this.operationalSummaryError = '';
    this.outstandingIssuesError = '';
    this.outstandingActionsError = '';
    this.importantInfoError = '';
    this.followUpTitleError = '';
    this.parentEntryIdError = '';
  }

  // ==================== Validations ====================

  private validateBasic(): boolean {
    this.clearErrors();
    let valid = true;

    if (!this.title.trim()) { this.titleError = 'Title is required'; valid = false; }
    if (!this.categoryId) { this.categoryError = 'Category is required'; valid = false; }
    if (!this.priority) { this.priorityError = 'Priority is required'; valid = false; }
    if (!this.description.trim()) { this.descriptionError = 'Description is required'; valid = false; }
    if (this.description.length > this.maxChars) { this.descriptionError = `Description must be under ${this.maxChars} characters`; valid = false; }

    return valid;
  }

  private validateIncident(): boolean {
    this.clearErrors();
    let valid = true;

    if (!this.incidentTitle.trim()) { this.incidentTitleError = 'Incident title is required'; valid = false; }
    if (!this.incidentTypeId) { this.incidentTypeError = 'Incident type is required'; valid = false; }
    if (!this.priority) { this.priorityError = 'Priority is required'; valid = false; }
    if (!this.occurredAt) { this.occurredAtError = 'Date and time are required'; valid = false; }
    if (!this.location.trim()) { this.locationIncidentError = 'Location is required'; valid = false; }
    if (!this.incidentDescription.trim()) { this.incidentDescriptionError = 'Description is required'; valid = false; }
    if (!this.immediateActionsTaken.trim()) { this.immediateActionsError = 'Immediate actions taken are required'; valid = false; }

    if (this.severityScore && (Number(this.severityScore) < 1 || Number(this.severityScore) > 10)) {
      this.immediateActionsError = 'Severity score must be between 1 and 10';
      valid = false;
    }

    return valid;
  }

  private validateHandover(): boolean {
    this.clearErrors();
    let valid = true;

    if (!this.handoverTitle.trim()) { this.handoverTitleError = 'Handover title is required'; valid = false; }
    if (!this.handoverTypeId) { this.handoverTypeError = 'Handover type is required'; valid = false; }
    if (!this.handoverDateTime) { this.handoverDateTimeError = 'Date and time are required'; valid = false; }
    if (!this.handoverFromUserId) { this.handoverFromError = 'Handover from is required'; valid = false; }
    if (!this.handoverToUserId) { this.handoverToError = 'Handover to is required'; valid = false; }
    if (!this.priority) { this.priorityError = 'Priority is required'; valid = false; }
    if (!this.operationalSummary.trim()) { this.operationalSummaryError = 'Operational summary is required'; valid = false; }
    if (this.operationalSummary.length > 5000) { this.operationalSummaryError = 'Operational summary must be under 5000 characters'; valid = false; }

    return valid;
  }

  private validateFollowUp(): boolean {
    this.clearErrors();
    let valid = true;

    if (!this.followUpTitle.trim()) { this.followUpTitleError = 'Title is required'; valid = false; }
    if (!this.priority) { this.priorityError = 'Priority is required'; valid = false; }
    if (!this.description.trim()) { this.descriptionError = 'Description is required'; valid = false; }

    return valid;
  }

  private validateForm(): boolean {
    switch (this.tabs[this.activeTab].entryTypeCode) {
      case 'BASIC': return this.validateBasic();
      case 'INCIDENT': return this.validateIncident();
      case 'HANDOVER': return this.validateHandover();
      case 'FOLLOW_UP': return this.validateFollowUp();
      default: return this.validateBasic();
    }
  }

  // ==================== Description handlers ====================

  onDescriptionInput(value: string): void {
    this.description = value;
    this.descriptionLength = value.length;
  }

  onOperationalSummaryInput(value: string): void {
    this.operationalSummary = value;
    this.operationalSummaryLength = value.length;
  }

  // ==================== File handlers ====================

  private validateFile(file: File, type: AttachmentType): boolean {
    if (file.size > this.maxFileSize) {
      this.fileError = `"${file.name}" exceeds the 100MB limit.`;
      return false;
    }
    if (!this.acceptsType(file, type)) {
      this.fileError = `"${file.name}" is not a valid ${type} file.`;
      return false;
    }
    return true;
  }

  private acceptsType(file: File, type: AttachmentType): boolean {
    const name = file.name.toLowerCase();
    if (type === 'pdf') {
      return file.type === 'application/pdf' || name.endsWith('.pdf');
    }
    if (type === 'image') {
      return file.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp)$/.test(name);
    }
    return file.type.startsWith('audio/') || /\.(mp3|m4a|wav|ogg|aac|flac)$/.test(name);
  }

  private getFileList(type: AttachmentType): SelectedFile[] {
    switch (type) {
      case 'pdf': return this.pdfFiles;
      case 'image': return this.imageFiles;
      case 'audio': return this.audioFiles;
    }
  }

  removeFile(type: AttachmentType, index: number): void {
    const list = this.getFileList(type);
    const item = list[index];
    if (!item) return;

    if (item.isExisting && item.attachmentId && this.editMode && this.editEntryId) {
      const orgId = this.getOrgId();
      if (orgId) {
        this.edobService.deleteAttachment(orgId, this.editEntryId, item.attachmentId).subscribe({
          next: () => list.splice(index, 1),
          error: () => list.splice(index, 1),
        });
      } else {
        list.splice(index, 1);
      }
    } else {
      if (item.previewUrl && item.isExisting !== true) {
        URL.revokeObjectURL(item.previewUrl);
      }
      list.splice(index, 1);
    }
    this.fileError = '';
  }

  clearFiles(): void {
    for (const list of [this.pdfFiles, this.imageFiles, this.audioFiles]) {
      for (const item of list) {
        if (item.previewUrl && item.isExisting !== true) {
          URL.revokeObjectURL(item.previewUrl);
        }
      }
      list.length = 0;
    }
  }

  startAudioRecording(): void {
    if (this.isRecording) return;
    if (this.audioFiles.length >= this.maxFilesPerType) {
      this.fileError = `You can attach a maximum of ${this.maxFilesPerType} audio file(s).`;
      return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      this.audioChunks = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : '';
      const ext = mimeType.includes('webm') ? 'webm' : mimeType.includes('mp4') || mimeType.includes('aac') ? 'm4a' : 'webm';
      this.mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 32000 })
        : new MediaRecorder(stream, { audioBitsPerSecond: 32000 });

      this.mediaRecorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) this.audioChunks.push(e.data);
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.audioChunks, { type: mimeType || 'audio/webm' });
        const file = new File([blob], `recording-${Date.now()}.${ext}`, { type: mimeType || 'audio/webm' });
        this.addRecordedAudio(file);
        stream.getTracks().forEach(t => t.stop());
      };

      this.mediaRecorder.start(250);
      this.isRecording = true;
      this.recordingTime = 0;
      this.recordingTimer = setInterval(() => {
        this.recordingTime += 100;
        if (this.recordingTime >= this.maxRecordingMs) {
          this.stopAudioRecording();
        }
      }, 100);
    }).catch(() => {
      this.fileError = 'Microphone access denied. Please allow microphone access or use file upload.';
    });
  }

  stopAudioRecording(): void {
    if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') return;
    this.mediaRecorder.stop();
    this.isRecording = false;
    this.isProcessingAudio = true;
    clearInterval(this.recordingTimer);
  }

  cancelAudioRecording(): void {
    if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') return;
    this.mediaRecorder.onstop = null;
    this.mediaRecorder.stop();
    this.audioChunks = [];
    this.isRecording = false;
    clearInterval(this.recordingTimer);
  }

  private addRecordedAudio(file: File): void {
    const item: SelectedFile = {
      file,
      previewUrl: URL.createObjectURL(file),
      fileName: file.name,
      fileSize: file.size,
    };
    this.audioFiles.push(item);
    this.fileError = '';
    this.isProcessingAudio = false;
  }

  private async compressImage(file: File): Promise<File> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1920;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            const ratio = Math.min(maxDim / width, maxDim / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              const compressed = new File([blob!], file.name, { type: 'image/jpeg', lastModified: Date.now() });
              resolve(compressed);
            },
            'image/jpeg',
            0.7
          );
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  // ==================== File handlers ====================

  async onFileSelected(event: Event, type: AttachmentType): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const list = this.getFileList(type);
    const remaining = this.maxFilesPerType - list.length;
    if (remaining <= 0) {
      this.fileError = `You can attach a maximum of ${this.maxFilesPerType} ${type} file(s).`;
      input.value = '';
      return;
    }

    const incoming = Array.from(input.files).slice(0, remaining);
    for (const file of incoming) {
      if (!this.validateFile(file, type)) continue;
      let processedFile = file;
      if (type === 'image') {
        processedFile = await this.compressImage(file);
      }
      const item: SelectedFile = { file: processedFile };
      if (type === 'image') {
        item.previewUrl = URL.createObjectURL(processedFile);
      }
      list.push(item);
    }

    this.fileError = '';
    input.value = '';
  }

  allFiles(): File[] {
    return [...this.pdfFiles, ...this.imageFiles, ...this.audioFiles].filter(i => i.file).map(i => i.file as File);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  getFileDisplayName(item: SelectedFile): string {
    return item.fileName || item.file?.name || 'Unknown';
  }

  getFileSizeBytes(item: SelectedFile): number {
    if (item.fileSize != null) return item.fileSize;
    return item.file?.size || 0;
  }

  // ==================== Cancel / Category ====================

  onCancel(): void {
    this.title = '';
    this.categoryId = '';
    this.priority = '';
    this.description = '';
    this.assignedToUserId = '';
    this.location = '';
    this.occurredAt = '';
    this.descriptionLength = 0;
    this.clearFiles();
    this.fileError = '';
    this.errorMessage = '';
    this.incidentTitle = '';
    this.incidentTypeId = '';
    this.incidentDate = '';
    this.incidentTime = '';
    this.peopleInvolved = '';
    this.incidentDescription = '';
    this.immediateActionsTaken = '';
    this.severityScore = '';
    this.handoverTitle = '';
    this.handoverTypeId = '';
    this.handoverDateTime = '';
    this.handoverFrom = '';
    this.handoverTo = '';
    this.handoverFromUserId = '';
    this.handoverToUserId = '';
    this.peopleInvolvedUserIds = [];
    this.handoverLocation = '';
    this.operationalSummary = '';
    this.operationalSummaryLength = 0;
    this.outstandingIssues = '';
    this.outstandingActions = '';
    this.importantInfo = '';
    this.followUpTitle = '';
    this.parentEntryId = '';
    this.showAddCategoryModal = false;
    this.showAddEntryTypeModal = false;
    this.clearErrors();
  }

  onCategorySelect(value: string): void {
    this.categoryId = value;
    this.categoryError = '';
  }

  openAddCategoryModal(): void {
    this.showAddCategoryModal = true;
  }

  onCategoryCreated(cat: any): void {
    this.refreshCategories();
  }

  onIncidentTypeSelect(value: string): void {
    this.incidentTypeId = value;
    this.incidentTypeError = '';
  }

  openAddEntryTypeModal(kind: 'incident' | 'handover'): void {
    this.entryTypeModalKind = kind;
    this.showAddEntryTypeModal = true;
  }

  onEntryTypeCreated(entryType: any): void {
    if (this.entryTypeModalKind === 'incident') {
      this.refreshIncidentTypes();
      this.incidentTypeId = entryType.id;
    } else {
      this.refreshHandoverTypes();
      this.handoverTypeId = entryType.id;
    }
  }

  onHandoverTypeSelect(value: string): void {
    this.handoverTypeId = value;
    this.handoverTypeError = '';
  }

  private refreshCategories(): void {
    const orgId = this.getOrgId();
    if (!orgId) return;
    this.edobService.listCategories(orgId).subscribe({
      next: (cats) => {
        const raw = cats as any;
        let list: Category[] = [];
        if (Array.isArray(raw)) list = raw;
        else if (raw && typeof raw === 'object') list = raw.data ?? raw.categories ?? raw.content ?? raw.items ?? [];
        this.categories = list.filter((c: Category) => c.active);
      },
      error: () => {}
    });
  }

  private refreshIncidentTypes(): void {
    const orgId = this.getOrgId();
    if (!orgId) return;
    this.edobService.listIncidentTypes(orgId).subscribe({
      next: (types) => {
        const raw = types as any;
        let list: IncidentType[] = [];
        if (Array.isArray(raw)) list = raw;
        else if (raw && typeof raw === 'object') list = raw.data ?? raw.incidentTypes ?? raw.content ?? raw.items ?? [];
        this.incidentTypes = list.filter((t: IncidentType) => t.active);
      },
      error: () => {}
    });
  }

  private refreshHandoverTypes(): void {
    const orgId = this.getOrgId();
    if (!orgId) return;
    this.edobService.listHandoverTypes(orgId).subscribe({
      next: (types) => {
        const raw = types as any;
        let list: HandoverType[] = [];
        if (Array.isArray(raw)) list = raw;
        else if (raw && typeof raw === 'object') list = raw.data ?? raw.handoverTypes ?? raw.content ?? raw.items ?? [];
        this.handoverTypes = list.filter((t: HandoverType) => t.active);
      },
      error: () => {}
    });
  }

  private ensureCategory(name: string): Observable<string> {
    const trimmed = name.trim();
    if (!trimmed) return of('');
    const existing = this.categories.find(c => c.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return of(existing.id);

    const orgId = this.getOrgId();
    if (!orgId) return of('');

    const code = trimmed.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '') || 'CATEGORY';
    return this.edobService.createCategory(orgId, { code, name: trimmed, active: true }).pipe(
      map(cat => {
        this.categories = [...this.categories, cat];
        return cat.id;
      }),
      catchError(() => of(''))
    );
  }

  private ensureIncidentType(name: string): Observable<string> {
    const trimmed = name.trim();
    if (!trimmed) return of('');
    const existing = this.incidentTypes.find(t => t.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return of(existing.id);

    const orgId = this.getOrgId();
    if (!orgId) return of('');

    const code = trimmed.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '') || 'INCIDENT_TYPE';
    return this.edobService.createIncidentType(orgId, { code, name: trimmed, active: true }).pipe(
      map(t => {
        this.incidentTypes = [...this.incidentTypes, t];
        return t.id;
      }),
      catchError(() => of(''))
    );
  }

  private ensureHandoverType(name: string): Observable<string> {
    const trimmed = name.trim();
    if (!trimmed) return of('');
    const existing = this.handoverTypes.find(t => t.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return of(existing.id);

    const orgId = this.getOrgId();
    if (!orgId) return of('');

    const code = trimmed.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '') || 'HANDOVER_TYPE';
    return this.edobService.createHandoverType(orgId, { code, name: trimmed, active: true }).pipe(
      map(t => {
        this.handoverTypes = [...this.handoverTypes, t];
        return t.id;
      }),
      catchError(() => of(''))
    );
  }

  onHandoverFromChange(value: string): void {
    this.handoverFromUserId = value;
    this.handoverFromError = '';
    const user = this.orgUsers.find(u => u.id === value);
    this.handoverFrom = user ? `${user.firstName} ${user.lastName}`.trim() : '';
  }

  onHandoverToChange(value: string): void {
    this.handoverToUserId = value;
    this.handoverToError = '';
    const user = this.orgUsers.find(u => u.id === value);
    this.handoverTo = user ? `${user.firstName} ${user.lastName}`.trim() : '';
  }

  onPeopleInvolvedChange(values: string[]): void {
    this.peopleInvolvedUserIds = values;
  }

  private rematchUserSelections(): void {
    if (!this.orgUsers.length) return;
    if (this.handoverFrom && !this.handoverFromUserId) {
      this.handoverFromUserId = this.matchUserId(this.handoverFrom);
    }
    if (this.handoverTo && !this.handoverToUserId) {
      this.handoverToUserId = this.matchUserId(this.handoverTo);
    }
    if (this.peopleInvolved && !this.peopleInvolvedUserIds.length) {
      const names = this.peopleInvolved.split(',').map(s => s.trim()).filter(Boolean);
      this.peopleInvolvedUserIds = names.map(name => this.matchUserId(name)).filter(Boolean);
    }
  }

  // ==================== Save / Submit ====================

  onSubmitEntry(): void {
    if (!this.validateForm()) return;
    this.isSubmitting = true;
    this.errorMessage = '';

    const formData = this.buildFormData();
    this.persistEntry(formData);
  }

  private persistEntry(formData: FormData): void {
    const orgId = this.getOrgId();
    if (!orgId) {
      this.errorMessage = 'Organization not found. Please sign in again.';
      this.isSubmitting = false;
      return;
    }

    const done = () => {
      this.isSubmitting = false;
      this.router.navigate(['/entries']);
    };
    const fail = (err: any) => {
      this.isSubmitting = false;
      this.errorMessage = err?.error?.message || 'Failed to save entry. Please try again.';
    };

    if (this.editMode && this.editEntryId) {
      this.edobService.updateEntry(orgId, this.editEntryId, formData).subscribe({ next: done, error: fail });
    } else {
      this.edobService.createEntry(orgId, formData).subscribe({ next: done, error: fail });
    }
  }

  // ==================== Payload builder ====================

  private buildFormData(): FormData {
    const entryPayload: any = {
      entryTypeCode: this.tabs[this.activeTab].entryTypeCode,
      priority: this.priority,
    };

    if (this.tabs[this.activeTab].entryTypeCode === 'BASIC') {
      entryPayload.title = this.title;
      entryPayload.description = this.description;
      if (this.categoryId) entryPayload.categoryId = this.categoryId;
      if (this.assignedToUserId) entryPayload.assignedToUserId = this.assignedToUserId;
    } else if (this.tabs[this.activeTab].entryTypeCode === 'INCIDENT') {
      entryPayload.title = this.incidentTitle;
      entryPayload.description = this.incidentDescription;
      if (this.categoryId) entryPayload.categoryId = this.categoryId;
      if (this.assignedToUserId) entryPayload.assignedToUserId = this.assignedToUserId;
      if (this.occurredAt) entryPayload.occurredAt = new Date(this.occurredAt).toISOString();
      entryPayload.incidentTypeId = this.incidentTypeId;
      if (this.location) entryPayload.location = this.location;

      const data: any = {};
      if (this.peopleInvolvedUserIds.length) {
        data['peopleInvolved'] = this.peopleInvolvedUserIds;
      }
      if (this.immediateActionsTaken) data['immediateActionsTaken'] = this.immediateActionsTaken;
      if (this.severityScore) data['severityScore'] = Number(this.severityScore);
      entryPayload.data = data;
    } else if (this.tabs[this.activeTab].entryTypeCode === 'HANDOVER') {
      entryPayload.title = this.handoverTitle;
      entryPayload.description = this.operationalSummary;
      if (this.categoryId) entryPayload.categoryId = this.categoryId;
      if (this.handoverToUserId) entryPayload.assignedToUserId = this.handoverToUserId;
      if (this.handoverDateTime) entryPayload.occurredAt = new Date(this.handoverDateTime).toISOString();
      entryPayload.handoverTypeId = this.handoverTypeId;
      if (this.handoverFromUserId) entryPayload.handoverFromUserId = this.handoverFromUserId;
      if (this.handoverLocation) entryPayload.location = this.handoverLocation;

      const data: any = {};
      if (this.handoverToUserId) {
        const user = this.orgUsers.find(u => u.id === this.handoverToUserId);
        data['handoverTo'] = user ? `${user.firstName} ${user.lastName}`.trim() : '';
        data['handoverToUserId'] = this.handoverToUserId;
      }
      const issuesArr = this.outstandingIssues.split('\n').map(s => s.trim()).filter(Boolean);
      if (issuesArr.length) data['outstandingIssues'] = issuesArr;
      data['outstandingActions'] = this.parseOutstandingActions(this.outstandingActions);
      if (this.importantInfo) data['importantInformation'] = this.importantInfo;
      entryPayload.data = data;
    } else if (this.tabs[this.activeTab].entryTypeCode === 'FOLLOW_UP') {
      entryPayload.title = this.followUpTitle;
      entryPayload.description = this.description;
      if (this.categoryId) entryPayload.categoryId = this.categoryId;
      if (this.assignedToUserId) entryPayload.assignedToUserId = this.assignedToUserId;
      if (this.occurredAt) entryPayload.occurredAt = new Date(this.occurredAt).toISOString();

      const data: any = {};
      if (this.parentEntryId) data['parentEntryId'] = this.parentEntryId;
      entryPayload.data = data;
    }

    const formData = new FormData();
    formData.append('entry', new Blob([JSON.stringify(entryPayload)], { type: 'application/json' }));

    for (const file of this.allFiles()) {
      formData.append('attachments', file);
    }

    return formData;
  }

  private parseOutstandingActions(raw: string): any[] {
    if (!raw.trim()) return [];
    return raw.split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => ({ task: line, done: false }));
  }

  // ==================== AI Generation ====================

  toggleAiDrawer(): void {
    this.aiDrawerOpen = !this.aiDrawerOpen;
  }

  onGenerateEntry(): void {
    if (!this.aiPrompt.trim()) return;
    this.isAiGenerating = true;
    this.aiError = '';

    const history: AIMessage[] = this.aiHistory
      .slice(-6)
      .map(item => ({ role: 'user' as const, content: item.prompt }));

    const categoryNames = this.categories.map(c => c.name);
    const priorityValues = this.priorities.map(p => p.value);

    const entryTypeCode = this.tabs[this.activeTab].entryTypeCode as 'BASIC' | 'INCIDENT' | 'HANDOVER' | 'FOLLOW_UP';

    this.aiService.generateEntry(this.aiPrompt, history, categoryNames, priorityValues, entryTypeCode).subscribe({
      next: (res) => {
        const text = res?.content || '';
        this.aiHistory.unshift({
          prompt: this.aiPrompt,
          result: text,
          timestamp: new Date()
        });
        this.applyAiContent(text);
        this.aiPrompt = '';
        this.isAiGenerating = false;
      },
      error: (err) => {
        this.aiError = err?.error?.error?.message || err?.message || 'Failed to generate entry. Please try again.';
        this.isAiGenerating = false;
      }
    });
  }

  applyAiContent(text: string): void {
    let parsed: any = {};
    try {
      const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { description: text };
    }

    const entryTypeCode = this.tabs[this.activeTab].entryTypeCode;

    if (entryTypeCode === 'BASIC') {
      this.applyBasicAiContent(parsed);
    } else if (entryTypeCode === 'INCIDENT') {
      this.applyIncidentAiContent(parsed);
    } else if (entryTypeCode === 'HANDOVER') {
      this.applyHandoverAiContent(parsed);
    } else if (entryTypeCode === 'FOLLOW_UP') {
      this.applyFollowUpAiContent(parsed);
    }
  }

  private applyBasicAiContent(parsed: any): void {
    if (parsed.title) this.title = parsed.title;
    if (parsed.description) {
      this.description = parsed.description;
      this.descriptionLength = parsed.description.length;
    }
    if (parsed.priority) {
      const upper = String(parsed.priority).toUpperCase();
      const valid = this.priorities.find(p => p.value === upper);
      if (valid) this.priority = valid.value;
    }
    if (parsed.category) {
      const match = this.categories.find(c => c.name.toLowerCase() === String(parsed.category).toLowerCase());
      if (match) {
        this.categoryId = match.id;
      } else {
        this.ensureCategory(parsed.category).subscribe((id: string) => {
          if (id) this.categoryId = id;
        });
      }
    }
  }

  private applyIncidentAiContent(parsed: any): void {
    if (parsed.title) this.incidentTitle = parsed.title;
    if (parsed.description) {
      this.incidentDescription = parsed.description;
      this.descriptionLength = parsed.description.length;
    }
    if (parsed.priority) {
      const upper = String(parsed.priority).toUpperCase();
      const valid = this.priorities.find(p => p.value === upper);
      if (valid) this.priority = valid.value;
    }
    if (parsed.category) {
      const match = this.categories.find(c => c.name.toLowerCase() === String(parsed.category).toLowerCase());
      if (match) {
        this.categoryId = match.id;
      } else {
        this.ensureCategory(parsed.category).subscribe((id: string) => {
          if (id) this.categoryId = id;
        });
      }
    }
    if (parsed.incidentType) {
      const match = this.incidentTypes.find(t => t.name.toLowerCase() === String(parsed.incidentType).toLowerCase());
      if (match) {
        this.incidentTypeId = match.id;
      } else {
        this.ensureIncidentType(parsed.incidentType).subscribe((id: string) => {
          if (id) this.incidentTypeId = id;
        });
      }
    }
    if (parsed.location) this.location = parsed.location;
    if (parsed.occurredAt) this.occurredAt = parsed.occurredAt;
    if (parsed.peopleInvolved) {
      const arr = Array.isArray(parsed.peopleInvolved) ? parsed.peopleInvolved : [parsed.peopleInvolved];
      this.peopleInvolved = arr.join(', ');
      this.peopleInvolvedUserIds = arr.map((name: string) => this.matchUserId(name)).filter(Boolean);
    }
    if (parsed.immediateActionsTaken) this.immediateActionsTaken = parsed.immediateActionsTaken;
    if (parsed.severityScore != null) this.severityScore = String(parsed.severityScore);
  }

  private applyHandoverAiContent(parsed: any): void {
    if (parsed.title) this.handoverTitle = parsed.title;
    if (parsed.description) {
      this.operationalSummary = parsed.description;
      this.operationalSummaryLength = parsed.description.length;
    }
    if (parsed.priority) {
      const upper = String(parsed.priority).toUpperCase();
      const valid = this.priorities.find(p => p.value === upper);
      if (valid) this.priority = valid.value;
    }
    if (parsed.category) {
      const match = this.categories.find(c => c.name.toLowerCase() === String(parsed.category).toLowerCase());
      if (match) {
        this.categoryId = match.id;
      } else {
        this.ensureCategory(parsed.category).subscribe((id: string) => {
          if (id) this.categoryId = id;
        });
      }
    }
    if (parsed.handoverType) {
      const match = this.handoverTypes.find(t => t.name.toLowerCase() === String(parsed.handoverType).toLowerCase());
      if (match) {
        this.handoverTypeId = match.id;
      } else {
        this.ensureHandoverType(parsed.handoverType).subscribe((id: string) => {
          if (id) this.handoverTypeId = id;
        });
      }
    }
    if (parsed.occurredAt) this.handoverDateTime = parsed.occurredAt;
    if (parsed.handoverFrom) this.handoverFrom = parsed.handoverFrom;
    if (parsed.handoverTo) this.handoverTo = parsed.handoverTo;
    if (parsed.handoverLocation) this.handoverLocation = parsed.handoverLocation;
    if (parsed.outstandingIssues) {
      this.outstandingIssues = Array.isArray(parsed.outstandingIssues) ? parsed.outstandingIssues.join('\n') : parsed.outstandingIssues;
    }
    if (parsed.outstandingActions) {
      if (Array.isArray(parsed.outstandingActions)) {
        this.outstandingActions = parsed.outstandingActions.map((a: any) => a.task || a).join('\n');
      } else {
        this.outstandingActions = parsed.outstandingActions;
      }
    }
    if (parsed.importantInformation) this.importantInfo = parsed.importantInformation;
  }

  private applyFollowUpAiContent(parsed: any): void {
    if (parsed.title) this.followUpTitle = parsed.title;
    if (parsed.description) {
      this.description = parsed.description;
      this.descriptionLength = parsed.description.length;
    }
    if (parsed.priority) {
      const upper = String(parsed.priority).toUpperCase();
      const valid = this.priorities.find(p => p.value === upper);
      if (valid) this.priority = valid.value;
    }
    if (parsed.category) {
      const match = this.categories.find(c => c.name.toLowerCase() === String(parsed.category).toLowerCase());
      if (match) {
        this.categoryId = match.id;
      } else {
        this.ensureCategory(parsed.category).subscribe((id: string) => {
          if (id) this.categoryId = id;
        });
      }
    }
    if (parsed.parentEntryId) this.parentEntryId = parsed.parentEntryId;
  }

  clearAiHistory(): void {
    this.aiHistory = [];
  }
}
