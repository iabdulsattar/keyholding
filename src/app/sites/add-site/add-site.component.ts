import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.css';
import { ClientService } from '../../core/services/client.service';
import { ToastService } from '../../core/services/toast.service';
import { KeyVaultService } from '../../core/services/keyvault.service';
import { RichSelectComponent, RichSelectOption } from '../../shared/components/form/rich-select/rich-select.component';
import { PageBreadcrumbComponent, BreadcrumbItem } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';

@Component({
  selector: 'app-add-site',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, RichSelectComponent, PageBreadcrumbComponent],
  templateUrl: './add-site.component.html',
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  `]
})
export class AddSiteComponent implements OnInit, AfterViewChecked {
  siteName = '';
  siteType = '';
  address1 = '';
  address2 = '';
  city = '';
  postcode = '';
  country = 'United Kingdom';
  contactName = '';
  designation = '';
  contactPhone = '';
  contactEmail = '';
  altContactName = '';
  altPhone = '';
  accessInstructions = '';
accessSchedule = '4';
securityLevel = '';
  alarmSystem = '';
  private alarmSystemToApi: Record<string, string> = { 'None': 'NONE', 'Intruder Alarm': 'INTRUDER_ALARM', 'CCTV': 'CCTV', 'Intruder & CCTV': 'INTRUDER_AND_CCTV' };
  private alarmSystemFromApi: Record<string, string> = { 'NONE': 'None', 'INTRUDER_ALARM': 'Intruder Alarm', 'CCTV': 'CCTV', 'INTRUDER_AND_CCTV': 'Intruder & CCTV' };
  private securityLevelToApi: Record<string, string> = { 'Low': 'LOW', 'Standard': 'STANDARD', 'High': 'HIGH', 'Very High': 'VERY_HIGH' };
  private securityLevelFromApi: Record<string, string> = { 'LOW': 'Low', 'STANDARD': 'Standard', 'HIGH': 'High', 'VERY_HIGH': 'Very High' };
  get accessScheduleLabel(): string {
    const labels: Record<string, string> = { '1': '24/7 Access', '2': 'Business Hours', '3': 'Restricted Hours', '4': 'By Appointment Only' };
    return labels[this.accessSchedule] || '-';
  }
  fileName = '';
  selectedFiles: File[] = [];
  attachmentPreviews: { file: File; url: string }[] = [];
  apptRequired = true;
  minNotice = '4 Hours';
  approvalContact = 'James Walker';
  apptPhone = '+44 020 7946 0958';
  apptEmail = 'james.walker@metrosecurity.co.uk';
  apptNotes = 'Access will only be granted to scheduled visitors. Please ensure you have valid ID.';
  siteStatus = 'Active';
  restrictedHours: Record<string, { from: string; to: string; closed: boolean }[]> = {
    Monday: [{ from: '08:00', to: '18:00', closed: false }],
    Tuesday: [{ from: '08:00', to: '18:00', closed: false }],
    Wednesday: [{ from: '08:00', to: '18:00', closed: false }],
    Thursday: [{ from: '08:00', to: '18:00', closed: false }],
    Friday: [{ from: '08:00', to: '16:00', closed: false }],
    Saturday: [{ from: 'Closed', to: 'Closed', closed: true }],
    Sunday: [{ from: 'Closed', to: 'Closed', closed: true }],
  };
  restrictedDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  restrictedBankHolidays = true;
  restrictedOutOfHoursApproval = true;
  restrictedCallBeforeEntry = true;
  restrictedSecurityEscort = true;

  submitted = false;

  activeSection = 'information';
  touched = new Set<string>();
  sectionErrors: { information: string[]; contact: string[]; details: string[] } = {
    information: [],
    contact: [],
    details: []
  };
  editMode = false;
  editingSiteId: string | null = null;
  clientId = '';
  clientName = '';
  clients: any[] = [];
  showClientDropdown = false;

  get breadcrumbs(): BreadcrumbItem[] {
    const crumbs: BreadcrumbItem[] = [{ label: 'Sites', link: '/sites/all-sites' }];
    if (this.clientId && this.clientName) {
      crumbs.unshift({ label: this.clientName, link: ['/clients', this.clientId] });
      crumbs.unshift({ label: 'Clients', link: '/clients' });
      crumbs.unshift({ label: 'Client Management', link: '/clients' });
    }
    crumbs.push({ label: this.editMode ? 'Edit Site' : 'Add New Site' });
    return crumbs;
  }
  siteTypeOptions: RichSelectOption[] = [
    { value: '', label: 'Select site type' },
    { value: 'Office', label: 'Office' },
    { value: 'Warehouse', label: 'Warehouse' },
    { value: 'Retail', label: 'Retail' },
    { value: 'Distribution Centre', label: 'Distribution Centre' },
    { value: 'Data Centre', label: 'Data Centre' },
    { value: 'Storage Lockup', label: 'Storage Lockup' },
    { value: 'Construction Site', label: 'Construction Site' },
    { value: 'Remote Office', label: 'Remote Office' },
    { value: 'Other', label: 'Other' },
  ];
  clientOptions: RichSelectOption[] = [];
  countryOptions: RichSelectOption[] = [
    { value: 'United Kingdom', label: 'United Kingdom' },
    { value: 'United States', label: 'United States' },
    { value: 'Canada', label: 'Canada' },
    { value: 'Australia', label: 'Australia' },
    { value: 'Germany', label: 'Germany' },
    { value: 'France', label: 'France' },
  ];
  accessScheduleOptions: RichSelectOption[] = [
    { value: '1', label: '24/7 Access' },
    { value: '2', label: 'Business Hours' },
    { value: '3', label: 'Restricted Hours' },
    { value: '4', label: 'By Appointment Only' },
  ];
  securityLevelOptions: RichSelectOption[] = [
    { value: '', label: 'Select level' },
    { value: 'Low', label: 'Low' },
    { value: 'Standard', label: 'Standard' },
    { value: 'High', label: 'High' },
    { value: 'Very High', label: 'Very High' },
  ];
  alarmSystemOptions: RichSelectOption[] = [
    { value: '', label: 'Select system' },
    { value: 'None', label: 'None' },
    { value: 'Intruder Alarm', label: 'Intruder Alarm' },
    { value: 'CCTV', label: 'CCTV' },
    { value: 'Intruder & CCTV', label: 'Intruder & CCTV' },
  ];
  minNoticeOptions: RichSelectOption[] = [
    { value: '1 Hour', label: '1 Hour' },
    { value: '2 Hours', label: '2 Hours' },
    { value: '4 Hours', label: '4 Hours' },
    { value: '24 Hours', label: '24 Hours' },
    { value: '48 Hours', label: '48 Hours' },
  ];
  approvalContactOptions: RichSelectOption[] = [
    { value: 'James Walker', label: 'James Walker' },
    { value: 'Sarah Miller', label: 'Sarah Miller' },
  ];

  constructor(private route: ActivatedRoute, private router: Router, private clientService: ClientService, private toast: ToastService, private keyVault: KeyVaultService) {}

  markTouched(field: string) {
    this.touched.add(field);
  }

  isSectionValid(section: keyof AddSiteComponent['sectionErrors']): boolean {
    return (this.sectionErrors[section] || []).length === 0;
  }

  get informationInvalid(): boolean {
    return this.submitted && !this.isSectionValid('information');
  }
  get contactInvalid(): boolean {
    return this.submitted && !this.isSectionValid('contact');
  }
  get detailsInvalid(): boolean {
    return this.submitted && !this.isSectionValid('details');
  }

  validate(): boolean {
    const errors: { information: string[]; contact: string[]; details: string[] } = {
      information: [],
      contact: [],
      details: []
    };

    this.submitted = true;

    this.touched.add('siteName');
    this.touched.add('siteType');
    this.touched.add('address1');
    this.touched.add('city');
    this.touched.add('postcode');
    this.touched.add('country');
    this.touched.add('contactName');
    this.touched.add('contactPhone');
    this.touched.add('contactEmail');
    this.touched.add('securityLevel');
    this.touched.add('alarmSystem');

    if (this.showClientDropdown) {
      this.touched.add('clientId');
      if (!this.clientId) errors.information.push('Client is required');
    }

    if (!this.siteName.trim()) errors.information.push('Site Name is required');
    if (!this.siteType) errors.information.push('Site Type is required');
    if (!this.address1.trim()) errors.information.push('Address Line 1 is required');
    if (!this.city.trim()) errors.information.push('City is required');
    if (!this.postcode.trim()) errors.information.push('Postcode is required');
    if (!this.country) errors.information.push('Country is required');
    if (!this.contactName.trim()) errors.contact.push('Primary Contact Name is required');
    if (!this.contactPhone.trim()) errors.contact.push('Phone is required');
    if (!this.contactEmail.trim()) errors.contact.push('Email is required');
    if (!this.securityLevel) errors.details.push('Security Level is required');
    if (!this.alarmSystem) errors.details.push('Alarm System is required');
    this.sectionErrors = errors;
    return !errors.information.length && !errors.contact.length && !errors.details.length;
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.clientId = params['clientId'] || '';
      if (params['editId']) {
        this.editMode = true;
        this.editingSiteId = params['editId'];
        this.loadSite(this.editingSiteId as string);
      } else {
        this.editMode = false;
        this.editingSiteId = null;
      }
      this.showClientDropdown = !this.clientId && !this.editMode;
      if (this.showClientDropdown) {
        this.loadClients();
      }
    });
  }

  ngAfterViewChecked(): void {
    const schedule = this.accessSchedule;
    if (schedule !== '3') return;
    const els = document.querySelectorAll('.time-input');
    els.forEach((el: Element) => {
      if (!(el as any)._flatpickr) {
        flatpickr(el, {
          enableTime: true,
          noCalendar: true,
          dateFormat: 'H:i',
          time_24hr: true,
          hourIncrement: 1,
          minuteIncrement: 1,
        });
      }
    });
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

  isImage(type = ''): boolean {
    return type.toLowerCase().startsWith('image/');
  }

  private loadSite(siteId: string): void {
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
    if (!orgId) return;
    this.clientService.getSiteById(orgId, siteId).subscribe((res: any) => {
      const item = res?.data ?? res;
      if (!item) return;
      this.siteName = item.name || '';
      this.siteType = item.siteType || item.type || '';
      this.address1 = item.addressLine1 || '';
      this.address2 = item.addressLine2 || '';
      this.city = item.city || '';
      this.postcode = item.postcode || '';
      this.country = item.country || 'United Kingdom';
      this.contactName = item.primaryContactName || '';
      this.designation = item.designation || '';
      this.contactPhone = item.phone || '';
      this.contactEmail = item.email || '';
      this.altContactName = item.altContactName || '';
      this.altPhone = item.altPhone || '';
      this.accessInstructions = item.accessInstructions || '';
      this.accessSchedule = item.accessSchedule === 'BUSINESS_HOURS' ? '2' : item.accessSchedule === 'BY_APPOINTMENT' ? '4' : item.accessSchedule === '24_7' ? '1' : item.accessSchedule === 'RESTRICTED_HOURS' ? '3' : '4';
      this.securityLevel = this.securityLevelFromApi[item.securityLevel] || item.securityLevel || '';
      this.alarmSystem = this.alarmSystemFromApi[item.alarmSystem || ''] || '';
      if (item.appointment) {
        this.apptRequired = true;
        this.minNotice = item.appointment.minimumNoticeRequired || '4 Hours';
        this.approvalContact = item.appointment.approvalRequiredName || '';
        this.apptPhone = item.appointment.approvalRequiredNumber || '';
        this.apptEmail = item.appointment.approvalRequiredEmail || '';
        this.apptNotes = item.appointment.notes || '';
      }
if (item.restrictedHours && Array.isArray(item.restrictedHours)) {
         const hours: Record<string, { from: string; to: string; closed: boolean }[]> = {};
         item.restrictedHours.forEach((slot: any) => {
           const day = slot.day;
           if (!hours[day]) { hours[day] = []; }
           hours[day].push({
             from: slot.allowedFrom || '08:00',
             to: slot.allowedUntil || '18:00',
             closed: slot.closed || false,
           });
         });
         this.restrictedHours = { ...this.restrictedHours, ...hours };
       }
    });
  }

  updateContactInfo(): void {
    if (this.approvalContact === 'James Walker') {
      this.apptPhone = '+44 020 7946 0958';
      this.apptEmail = 'james.walker@metrosecurity.co.uk';
    } else {
      this.apptPhone = '+44 020 7946 0000';
      this.apptEmail = 'sarah.miller@metrosecurity.co.uk';
    }
  }

  private loadClients(): void {
    this.clientService.listClients({ page: 0, size: 200 }).subscribe((result: any) => {
      this.clients = result.items || [];
      this.clientOptions = this.clients.map((c: any) => ({ value: c.id, label: c.name }));
      if (this.clientId && !this.clientName) {
        const client = this.clients.find((c: any) => c.id === this.clientId);
        if (client) {
          this.clientName = client.name || '';
        }
      }
    });
  }

  resetSiteForm(): void {
    const targetClientId = this.clientId;
    if (this.showClientDropdown) {
      this.clientId = '';
    }
    this.siteName = '';
    this.siteType = '';
    this.address1 = '';
    this.address2 = '';
    this.city = '';
    this.postcode = '';
    this.country = 'United Kingdom';
    this.contactName = '';
    this.designation = '';
    this.contactPhone = '';
    this.contactEmail = '';
    this.altContactName = '';
    this.altPhone = '';
    this.accessInstructions = '';
    this.accessSchedule = '4';
    this.securityLevel = '';
    this.alarmSystem = '';
    this.fileName = '';
    this.selectedFiles = [];
    this.attachmentPreviews.forEach(item => { if (item.url.startsWith('blob:')) URL.revokeObjectURL(item.url); });
    this.attachmentPreviews = [];
    this.apptRequired = true;
    this.minNotice = '4 Hours';
    this.approvalContact = 'James Walker';
    this.updateContactInfo();
    this.apptNotes = 'Access will only be granted to scheduled visitors. Please ensure you have valid ID.';
    this.restrictedHours = {
       Monday: [{ from: '08:00', to: '18:00', closed: false }],
       Tuesday: [{ from: '08:00', to: '18:00', closed: false }],
       Wednesday: [{ from: '08:00', to: '18:00', closed: false }],
       Thursday: [{ from: '08:00', to: '18:00', closed: false }],
       Friday: [{ from: '08:00', to: '16:00', closed: false }],
       Saturday: [{ from: 'Closed', to: 'Closed', closed: true }],
       Sunday: [{ from: 'Closed', to: 'Closed', closed: true }],
     };
    if (targetClientId) {
      this.router.navigate(['/clients', targetClientId]);
    } else {
      this.router.navigate(['/sites/all-sites']);
    }
  }

  addRestrictedHour(day: string): void {
    if (!this.restrictedHours[day]) {
      this.restrictedHours[day] = [];
    }
    this.restrictedHours[day].push({ from: '08:00', to: '18:00', closed: false });
  }

  removeRestrictedHour(day: string, index: number): void {
    if (this.restrictedHours[day] && this.restrictedHours[day].length > 1) {
      this.restrictedHours[day].splice(index, 1);
    }
  }

  submitSiteForm(): void {
    if (!this.validate()) return;

    const accessScheduleMap: Record<string, 'BUSINESS_HOURS' | 'BY_APPOINTMENT' | '24_7' | 'RESTRICTED_HOURS'> = {
      '1': '24_7',
      '2': 'BUSINESS_HOURS',
      '3': 'RESTRICTED_HOURS',
      '4': 'BY_APPOINTMENT',
    };
    const site: any = {
      name: this.siteName,
      siteType: this.siteType,
      addressLine1: this.address1,
      addressLine2: this.address2,
      city: this.city,
      postcode: this.postcode,
      country: this.country,
      primaryContactName: this.contactName,
      designation: this.designation,
      phone: this.contactPhone,
      email: this.contactEmail,
      altContactName: this.altContactName,
      altPhone: this.altPhone,
      accessInstructions: this.accessInstructions,
      accessSchedule: accessScheduleMap[this.accessSchedule] || 'BUSINESS_HOURS',
      securityLevel: this.securityLevelToApi[this.securityLevel] || this.securityLevel,
      alarmSystem: this.alarmSystemToApi[this.alarmSystem] || this.alarmSystem,
      status: 'ACTIVE',
    };

    if (site.accessSchedule === 'BY_APPOINTMENT') {
      site.appointment = {
        minimumNoticeRequired: this.minNotice,
        approvalRequiredName: this.approvalContact,
        approvalRequiredNumber: this.apptPhone,
        approvalRequiredEmail: this.apptEmail,
        notes: this.apptNotes,
      };
    }

    if (site.accessSchedule === 'RESTRICTED_HOURS' && this.restrictedHours) {
      site.restrictedHours = Object.entries(this.restrictedHours).flatMap(([day, slots]) =>
        slots.map((slot) => ({
          day,
          allowedFrom: slot.closed ? 'Closed' : slot.from,
          allowedUntil: slot.closed ? 'Closed' : slot.to,
          closed: slot.closed,
        }))
      );
      site.restrictedHoursRules = {
        bankHolidays: this.restrictedBankHolidays,
        outOfHoursApproval: this.restrictedOutOfHoursApproval,
        callBeforeEntry: this.restrictedCallBeforeEntry,
        securityEscort: this.restrictedSecurityEscort,
      };
    }

    if (!this.clientId && this.showClientDropdown) {
      return;
    }

    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
    if (!orgId) {
      alert('Missing organization context. Please sign in again.');
      return;
    }

    const onSaved = (siteId: string) => {
      if (this.selectedFiles.length && siteId) {
        this.uploadSiteAttachments(orgId, siteId);
      } else {
        this.finishSiteSubmit();
      }
    };

    if (this.editMode && this.editingSiteId) {
      this.clientService.updateSite(orgId, this.editingSiteId, site).subscribe({
        next: (res: any) => {
          const createdId = res?.id || this.editingSiteId || '';
          onSaved(createdId);
        },
        error: () => {
          this.toast.error('Failed to update site. Please try again.');
        }
      });
    } else {
      this.clientService.createSite(orgId, this.clientId, site).subscribe({
        next: (res: any) => {
          const createdId = res?.id || res?.data?.id || '';
          onSaved(createdId);
        },
        error: () => {
          this.toast.error('Failed to save site. Please try again.');
        }
      });
    }
  }

  private uploadSiteAttachments(orgId: string, siteId: string): void {
    let pending = this.selectedFiles.length;
    if (!pending) {
      this.finishSiteSubmit();
      return;
    }

    this.selectedFiles.forEach(file => {
      const keyVault = (this as any).clientService?.keyVault;
      if (!keyVault) {
        pending--;
        this.maybeFinishSiteSubmit(pending);
        return;
      }
      keyVault.addSiteAttachment(orgId, siteId, file, file.name, file.type || 'application/octet-stream', file.size).subscribe({
        next: () => {
          pending--;
          this.maybeFinishSiteSubmit(pending);
        },
        error: () => {
          pending--;
          this.maybeFinishSiteSubmit(pending);
        }
      });
    });
  }

  private maybeFinishSiteSubmit(pending: number): void {
    if (pending <= 0) {
      this.finishSiteSubmit();
    }
  }

  private finishSiteSubmit(): void {
    this.toast.success(this.editMode ? 'Site updated successfully!' : 'Site saved successfully!');
    setTimeout(() => this.router.navigate(['/clients', this.clientId]), 800);
  }

  get showPreview(): boolean {
    return !!(this.siteName || this.siteType || this.city || this.contactName || this.accessSchedule || this.securityLevel);
  }

  get securityClass(): string {
    const map: Record<string, string> = {
      'Low': 'bg-slate-100 text-slate-700 border border-slate-200/60',
      'Standard': 'bg-blue-50 text-blue-600 border border-blue-200/50',
      'High': 'bg-amber-50 text-amber-600 border border-amber-200/50',
      'Very High': 'bg-rose-50 text-rose-600 border border-rose-200/50'
    };
    return map[this.securityLevel] || 'bg-slate-100 text-slate-500';
  }

  trackByIndex(index: number): number {
    return index;
  }
}
