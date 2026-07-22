import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientService } from '../../core/services/client.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-add-site',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './add-site.component.html',
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
    select { appearance: none; background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 1rem center; background-size: 1rem; }
  `]
})
export class AddSiteComponent implements OnInit {
  siteName = '';
  siteCode = '';
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
  accessSchedule = 'By Appointment Only';
  securityLevel = '';
  alarmSystem = '';
  fileName = '';
  apptRequired = true;
  minNotice = '4 Hours';
  approvalContact = 'James Walker';
  apptPhone = '+44 020 7946 0958';
  apptEmail = 'james.walker@metrosecurity.co.uk';
  apptNotes = 'Access will only be granted to scheduled visitors. Please ensure you have valid ID.';
  restrictedHours: Record<string, { from: string; to: string; closed: boolean }> = {
    Monday: { from: '08:00', to: '18:00', closed: false },
    Tuesday: { from: '08:00', to: '18:00', closed: false },
    Wednesday: { from: '08:00', to: '18:00', closed: false },
    Thursday: { from: '08:00', to: '18:00', closed: false },
    Friday: { from: '08:00', to: '16:00', closed: false },
    Saturday: { from: 'Closed', to: 'Closed', closed: true },
    Sunday: { from: 'Closed', to: 'Closed', closed: true },
  };
  restrictedBankHolidays = true;
  restrictedOutOfHoursApproval = true;
  restrictedCallBeforeEntry = true;
  restrictedSecurityEscort = true;

  private clientId = '';
  editMode = false;
  editingSiteId: string | null = null;

  constructor(private route: ActivatedRoute, private router: Router, private clientService: ClientService, private toast: ToastService) {}

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
    });
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.fileName = input.files[0].name;
    }
  }

  private loadSite(siteId: string): void {
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
    if (!orgId) return;
    this.clientService.getSiteById(orgId, siteId).subscribe((res: any) => {
      const item = res?.data ?? res;
      if (!item) return;
      this.siteName = item.name || '';
      this.siteCode = item.siteCode || item.code || '';
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
      this.accessSchedule = item.accessSchedule === 'BUSINESS_HOURS' ? 'Business Hours' : item.accessSchedule === 'BY_APPOINTMENT' ? 'By Appointment Only' : item.accessSchedule === '24_7' ? '24/7' : item.accessSchedule === 'RESTRICTED_HOURS' ? 'Restricted Hours' : 'By Appointment Only';
      this.securityLevel = item.securityLevel || '';
      this.alarmSystem = item.alarmSystem || '';
      if (item.appointment) {
        this.apptRequired = true;
        this.minNotice = item.appointment.minimumNoticeRequired || '4 Hours';
        this.approvalContact = item.appointment.approvalRequiredName || '';
        this.apptPhone = item.appointment.approvalRequiredNumber || '';
        this.apptEmail = item.appointment.approvalRequiredEmail || '';
        this.apptNotes = item.appointment.notes || '';
      }
      if (item.restrictedHours && Array.isArray(item.restrictedHours)) {
        const hours: Record<string, { from: string; to: string; closed: boolean }> = {};
        item.restrictedHours.forEach((slot: any) => {
          hours[slot.day] = {
            from: slot.allowedFrom || '08:00',
            to: slot.allowedUntil || '18:00',
            closed: slot.closed || false,
          };
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

  resetSiteForm(): void {
    if (confirm('Are you sure you want to discard your current inputs?')) {
      this.siteName = '';
      this.siteCode = '';
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
      this.accessSchedule = 'By Appointment Only';
      this.securityLevel = '';
      this.alarmSystem = '';
      this.fileName = '';
      this.apptRequired = true;
      this.minNotice = '4 Hours';
      this.approvalContact = 'James Walker';
      this.updateContactInfo();
      this.apptNotes = 'Access will only be granted to scheduled visitors. Please ensure you have valid ID.';
      this.restrictedHours = {
        Monday: { from: '08:00', to: '18:00', closed: false },
        Tuesday: { from: '08:00', to: '18:00', closed: false },
        Wednesday: { from: '08:00', to: '18:00', closed: false },
        Thursday: { from: '08:00', to: '18:00', closed: false },
        Friday: { from: '08:00', to: '16:00', closed: false },
        Saturday: { from: 'Closed', to: 'Closed', closed: true },
        Sunday: { from: 'Closed', to: 'Closed', closed: true },
      };
    }
  }

  submitSiteForm(): void {
    const accessScheduleMap: Record<string, 'BUSINESS_HOURS' | 'BY_APPOINTMENT' | '24_7' | 'RESTRICTED_HOURS'> = {
      'Business Hours': 'BUSINESS_HOURS',
      'By Appointment Only': 'BY_APPOINTMENT',
      '24/7': '24_7',
      '24/7 Access': '24_7',
      'Restricted Hours': 'RESTRICTED_HOURS',
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
      securityLevel: this.securityLevel,
      alarmSystem: this.alarmSystem,
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
      site.restrictedHours = Object.entries(this.restrictedHours).map(([day, slot]) => ({
        day,
        allowedFrom: slot.closed ? 'Closed' : slot.from,
        allowedUntil: slot.closed ? 'Closed' : slot.to,
        closed: slot.closed,
      }));
      site.restrictedHoursRules = {
        bankHolidays: this.restrictedBankHolidays,
        outOfHoursApproval: this.restrictedOutOfHoursApproval,
        callBeforeEntry: this.restrictedCallBeforeEntry,
        securityEscort: this.restrictedSecurityEscort,
      };
    }

    if (!this.clientId) {
      alert('Missing client context. Please add this site from a client page.');
      return;
    }

    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
    if (!orgId) {
      alert('Missing organization context. Please sign in again.');
      return;
    }

    if (this.editMode && this.editingSiteId) {
      this.clientService.updateSite(orgId, this.editingSiteId, site).subscribe({
        next: () => {
          this.toast.success('Site updated successfully!');
          setTimeout(() => this.router.navigate(['/clients', this.clientId]), 800);
        },
        error: () => {
          this.toast.error('Failed to update site. Please try again.');
        }
      });
    } else {
      this.clientService.createSite(orgId, this.clientId, site).subscribe({
        next: () => {
          this.toast.success('Site saved successfully!');
          setTimeout(() => this.router.navigate(['/clients', this.clientId]), 800);
        },
        error: () => {
          this.toast.error('Failed to save site. Please try again.');
        }
      });
    }
  }

  get showPreview(): boolean {
    return !!(this.siteName || this.siteCode || this.siteType || this.city || this.contactName || this.accessSchedule || this.securityLevel);
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
}
