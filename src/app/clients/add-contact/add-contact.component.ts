import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientService, ContactRecord } from '../../core/services/client.service';
import { ToastService } from '../../core/services/toast.service';
import { PageBreadcrumbComponent, BreadcrumbItem } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { RichSelectComponent, RichSelectOption } from '../../shared/components/form/rich-select/rich-select.component';

@Component({
  selector: 'app-add-contact',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PageBreadcrumbComponent, RichSelectComponent],
  templateUrl: './add-contact.component.html',
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
    select { appearance: none; background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 1rem center; background-size: 1rem; }
    .field-label { display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 0.375rem; }
    .field-label .text-rose-500 { color: #f43f5e; }
    .field-input { width: 100%; padding: 0.625rem 0.75rem; font-size: 0.875rem; line-height: 1.25rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; color: #1e293b; background-color: #fff; transition: border-color 0.15s, box-shadow 0.15s; }
    .field-input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
    .field-input::placeholder { color: #94a3b8; }
    .field-hint { font-size: 0.75rem; color: #62748e; margin-top: 0.25rem; font-weight: 500}
    .btn-outline { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem 1rem; font-size: 0.875rem; font-weight: 500; color: #475569; background-color: #fff; border: 1px solid #e2e8f0; border-radius: 0.5rem; cursor: pointer; transition: background-color 0.15s, color 0.15s; }
    .btn-outline:hover { background-color: #f8fafc; color: #1e293b; }
    .btn-primary { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.5rem 1rem; font-size: 0.875rem; font-weight: 600; color: #fff; background-color: #155dfc; border: 1px solid transparent; border-radius: 0.5rem; cursor: pointer; transition: background-color 0.15s; }
    .btn-primary:hover { background-color: #155dfc; }
  `]
})
export class AddContactComponent implements OnInit {
  clientId = '';
  clientName = 'Metro Security Services';
  contactId = '';

  firstName = '';
  lastName = '';
  jobTitle = '';
  email = '';
  phone = '';
  phoneCountryCode = '+44';
  department = '';
  primaryContact = true;
  status = 'Active';
  preferredContactMethod = 'Email';
  address = '';
  notes = '';

  departmentOptions: RichSelectOption[] = [
    { value: '', label: 'Select department' },
    { value: 'Operations', label: 'Operations' },
    { value: 'Accounts', label: 'Accounts' },
    { value: 'Finance', label: 'Finance' },
    { value: 'Human Resources', label: 'Human Resources' },
    { value: 'Compliance', label: 'Compliance' },
    { value: 'Customer Support', label: 'Customer Support' },
    { value: 'IT', label: 'IT' },
    { value: 'Procurement', label: 'Procurement' },
  ];
  statusOptions: RichSelectOption[] = [
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
  ];
  preferredContactMethodOptions: RichSelectOption[] = [
    { value: 'Email', label: 'Email' },
    { value: 'Phone', label: 'Phone' },
    { value: 'SMS', label: 'SMS' },
  ];

  countryCodes: { code: string; label: string; flag: string }[] = [
    { code: '+44', label: '+44', flag: '🇬🇧' },
    { code: '+1', label: '+1', flag: '🇺🇸' },
    { code: '+1', label: '+1', flag: '🇨🇦' },
    { code: '+61', label: '+61', flag: '🇦🇺' },
    { code: '+91', label: '+91', flag: '🇮🇳' },
    { code: '+92', label: '+92', flag: '🇵🇰' },
    { code: '+966', label: '+966', flag: '🇸🇦' },
    { code: '+971', label: '+971', flag: '🇦🇪' },
    { code: '+65', label: '+65', flag: '🇸🇬' },
    { code: '+60', label: '+60', flag: '🇲🇾' },
    { code: '+27', label: '+27', flag: '🇿🇦' },
    { code: '+234', label: '+234', flag: '🇳🇬' },
    { code: '+254', label: '+254', flag: '🇰🇪' },
    { code: '+20', label: '+20', flag: '🇪🇬' },
    { code: '+973', label: '+973', flag: '🇧🇭' },
    { code: '+974', label: '+974', flag: '🇶🇦' },
    { code: '+968', label: '+968', flag: '🇴🇲' },
    { code: '+964', label: '+964', flag: '🇮🇶' },
    { code: '+98', label: '+98', flag: '🇮🇷' },
    { code: '+90', label: '+90', flag: '🇹🇷' },
    { code: '+880', label: '+880', flag: '🇧🇩' },
    { code: '+94', label: '+94', flag: '🇱🇰' },
    { code: '+977', label: '+977', flag: '🇳🇵' },
    { code: '+66', label: '+66', flag: '🇹🇭' },
    { code: '+63', label: '+63', flag: '🇵🇭' },
    { code: '+62', label: '+62', flag: '🇮🇩' },
    { code: '+84', label: '+84', flag: '🇻🇳' },
    { code: '+86', label: '+86', flag: '🇨🇳' },
    { code: '+81', label: '+81', flag: '🇯🇵' },
    { code: '+82', label: '+82', flag: '🇰🇷' },
    { code: '+852', label: '+852', flag: '🇭🇰' },
    { code: '+886', label: '+886', flag: '🇹🇼' },
    { code: '+48', label: '+48', flag: '🇵🇱' },
    { code: '+49', label: '+49', flag: '🇩🇪' },
    { code: '+33', label: '+33', flag: '🇫🇷' },
    { code: '+34', label: '+34', flag: '🇪🇸' },
    { code: '+39', label: '+39', flag: '🇮🇹' },
    { code: '+31', label: '+31', flag: '🇳🇱' },
    { code: '+46', label: '+46', flag: '🇸🇪' },
    { code: '+47', label: '+47', flag: '🇳🇴' },
    { code: '+45', label: '+45', flag: '🇩🇰' },
    { code: '+358', label: '+358', flag: '🇫🇮' },
    { code: '+41', label: '+41', flag: '🇨🇭' },
    { code: '+43', label: '+43', flag: '🇦🇹' },
    { code: '+32', label: '+32', flag: '🇧🇪' },
    { code: '+351', label: '+351', flag: '🇵🇹' },
    { code: '+30', label: '+30', flag: '🇬🇷' },
    { code: '+420', label: '+420', flag: '🇨🇿' },
    { code: '+36', label: '+36', flag: '🇭🇺' },
    { code: '+40', label: '+40', flag: '🇷🇴' },
    { code: '+7', label: '+7', flag: '🇷🇺' },
    { code: '+55', label: '+55', flag: '🇧🇷' },
    { code: '+52', label: '+52', flag: '🇲🇽' },
    { code: '+54', label: '+54', flag: '🇦🇷' },
    { code: '+56', label: '+56', flag: '🇨🇱' },
    { code: '+57', label: '+57', flag: '🇨🇴' },
    { code: '+51', label: '+51', flag: '🇵🇪' },
    { code: '+593', label: '+593', flag: '🇪🇨' },
    { code: '+58', label: '+58', flag: '🇻🇪' },
    { code: '+63', label: '+63', flag: '🇵🇭' },
    { code: '+66', label: '+66', flag: '🇹🇭' },
  ];

  saving = false;
  touched = new Set<string>();
  submitted = false;

  get informationInvalid(): boolean {
    return this.submitted && (
      !this.firstName.trim() ||
      !this.lastName.trim() ||
      !this.jobTitle.trim() ||
      !this.email.trim() ||
      !this.phone.trim()
    );
  }

  get contactInvalid(): boolean {
    return this.submitted && (!this.status);
  }

  markTouched(field: string): void {
    this.touched.add(field);
  }

  get breadcrumbs(): BreadcrumbItem[] {
    return [
      { label: 'Client Management', link: '/clients' },
      { label: 'Clients', link: '/clients' },
      { label: this.clientName, link: ['/clients', this.clientId] },
      { label: 'Contacts' },
      { label: this.isEditMode ? 'Edit Contact' : 'Add Contact' }
    ];
  }

  constructor(private route: ActivatedRoute, private router: Router, private clientService: ClientService, private toast: ToastService) {}

  get isEditMode(): boolean {
    return !!this.contactId;
  }

  ngOnInit(): void {
    this.clientId = this.route.snapshot.paramMap.get('id') || '';
    this.contactId = this.route.snapshot.queryParamMap.get('contactId') || '';
    this.loadClientName();
    this.detectCountryCode();

    if (this.contactId) {
      this.loadContact();
    }
  }

  private detectCountryCode(): void {
    if (typeof navigator !== 'undefined') {
      const locale = navigator.language || (navigator as any).userLanguage || 'en-GB';
      const region = locale.split('-')[1] || locale.split('_')[1];
      if (region) {
        const regionUpper = region.toUpperCase();
        const matched = this.countryCodes.find(c => c.code === this.regionToCode(regionUpper));
        if (matched) {
          this.phoneCountryCode = matched.code;
          return;
        }
      }
    }
    this.phoneCountryCode = '+44';
  }

  private regionToCode(region: string): string {
    const map: Record<string, string> = {
      'GB': '+44', 'US': '+1', 'CA': '+1', 'AU': '+61', 'IN': '+91',
      'PK': '+92', 'SA': '+966', 'AE': '+971', 'SG': '+65', 'MY': '+60',
      'ZA': '+27', 'NG': '+234', 'KE': '+254', 'EG': '+20', 'BH': '+973',
      'QA': '+974', 'OM': '+968', 'IQ': '+964', 'IR': '+98', 'TR': '+90',
      'BD': '+880', 'LK': '+977', 'NP': '+977', 'TH': '+66', 'PH': '+63',
      'ID': '+62', 'VN': '+84', 'CN': '+86', 'JP': '+81', 'KR': '+82',
      'HK': '+852', 'TW': '+886', 'PL': '+48', 'DE': '+49', 'FR': '+33',
      'ES': '+34', 'IT': '+39', 'NL': '+31', 'SE': '+46', 'NO': '+47',
      'DK': '+45', 'FI': '+358', 'CH': '+41', 'AT': '+43', 'BE': '+32',
      'PT': '+351', 'GR': '+30', 'CZ': '+420', 'HU': '+36', 'RO': '+40',
      'RU': '+7', 'BR': '+55', 'MX': '+52', 'AR': '+54', 'CL': '+56',
      'CO': '+57', 'PE': '+51', 'EC': '+593', 'VE': '+58',
    };
    return map[region] || '+44';
  }

  private loadClientName(): void {
    if (!this.clientId) return;
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
    if (!orgId) return;
    this.clientService.getClientById(orgId, this.clientId).subscribe({
      next: (client) => {
        if (client?.name) {
          this.clientName = client.name;
        }
      },
      error: () => {}
    });
  }

  private loadContact(): void {
    if (!this.clientId || !this.contactId) return;
    this.clientService.getContact(this.clientId, this.contactId).subscribe({
      next: (contact: ContactRecord | undefined) => {
        if (contact) {
          this.firstName = contact.firstName || '';
          this.lastName = contact.lastName || '';
          this.jobTitle = contact.jobTitle || '';
          this.email = contact.email || '';
          this.phone = contact.phone || '';
          this.phoneCountryCode = contact.phoneCountryCode || '+44';
          this.department = contact.department || '';
          this.primaryContact = contact.primaryContact ?? false;
          this.status = contact.status || 'Active';
          this.preferredContactMethod = contact.preferredMethod || 'Email';
          this.address = contact.address || '';
          this.notes = contact.notes || '';
        }
      },
      error: () => {
        this.toast.error('Failed to load contact');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/clients', this.clientId]);
  }

  cancel(): void {
    this.goBack();
  }

  saveContact(): void {
    if (this.saving) return;
    this.submitted = true;
    this.touched.add('firstName');
    this.touched.add('lastName');
    this.touched.add('jobTitle');
    this.touched.add('email');
    this.touched.add('phone');
    this.touched.add('status');

    if (!this.firstName.trim() || !this.lastName.trim()) {
      this.toast.error('First name and last name are required');
      return;
    }
    if (!this.email.trim()) {
      this.toast.error('Email address is required');
      return;
    }

    this.saving = true;
    const contact: Partial<ContactRecord> = {
      firstName: this.firstName,
      lastName: this.lastName,
      jobTitle: this.jobTitle,
      email: this.email,
      phone: this.phone,
      phoneCountryCode: this.phoneCountryCode,
      department: this.department,
      primaryContact: this.primaryContact,
      status: this.status as 'Active' | 'Inactive',
      preferredMethod: this.preferredContactMethod,
      address: this.address,
      notes: this.notes,
    };

    const handleSuccess = () => {
      this.saving = false;
      this.toast.success(this.isEditMode ? 'Contact updated successfully' : 'Contact created successfully');
      this.router.navigate(['/clients', this.clientId]);
    };

    const handleError = () => {
      this.saving = false;
      this.toast.error(this.isEditMode ? 'Failed to update contact' : 'Failed to create contact');
    };

    if (this.isEditMode) {
      this.clientService.updateContact(this.clientId, this.contactId, contact).subscribe({
        next: handleSuccess,
        error: handleError,
      });
    } else {
      this.clientService.createContact(this.clientId, contact).subscribe({
        next: handleSuccess,
        error: handleError,
      });
    }
  }
}
