import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

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

  constructor() {}

  ngOnInit(): void {}

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.fileName = input.files[0].name;
    }
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
    }
  }

  submitSiteForm(): void {
    if (this.siteName && this.siteCode && this.siteType && this.address1 && this.city && this.postcode && this.contactName && this.contactPhone && this.contactEmail && this.accessSchedule && this.securityLevel && this.alarmSystem) {
      alert(`Success! Site "${this.siteName}" has been saved to the database payload structure.`);
      this.resetSiteForm();
    } else {
      alert('Please fill in all required fields.');
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
