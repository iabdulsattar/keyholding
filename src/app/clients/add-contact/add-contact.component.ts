import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-add-contact',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './add-contact.component.html',
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
    select { appearance: none; background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 1rem center; background-size: 1rem; }
    .field-label { display: block; font-size: 0.875rem; font-weight: 600; color: #334155; margin-bottom: 0.375rem; }
    .field-label .text-rose-500 { color: #f43f5e; }
    .field-input { width: 100%; padding: 0.625rem 0.75rem; font-size: 0.875rem; line-height: 1.25rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; color: #1e293b; background-color: #fff; transition: border-color 0.15s, box-shadow 0.15s; }
    .field-input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
    .field-input::placeholder { color: #94a3b8; }
    .field-hint { font-size: 0.75rem; color: #94a3b8; margin-top: 0.25rem; }
    .btn-outline { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.5rem 1rem; font-size: 0.875rem; font-weight: 500; color: #475569; background-color: #fff; border: 1px solid #e2e8f0; border-radius: 0.5rem; cursor: pointer; transition: background-color 0.15s, color 0.15s; }
    .btn-outline:hover { background-color: #f8fafc; color: #1e293b; }
    .btn-primary { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.5rem 1rem; font-size: 0.875rem; font-weight: 600; color: #fff; background-color: #4338ca; border: 1px solid transparent; border-radius: 0.5rem; cursor: pointer; transition: background-color 0.15s; }
    .btn-primary:hover { background-color: #372da3; }
  `]
})
export class AddContactComponent implements OnInit {
  clientId = '';
  clientName = 'Metro Security Services';

  firstName = '';
  lastName = '';
  jobTitle = '';
  email = '';
  phone = '';
  department = '';
  primaryContact = true;
  status = 'Active';
  preferredContactMethod = 'Email';
  address = '';
  notes = '';

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.clientId = this.route.snapshot.paramMap.get('id') || '';
    this.route.queryParams.subscribe(params => {
      this.clientName = params['clientName'] || this.clientName;
    });
  }

  goBack(): void {
    this.router.navigate(['/clients', this.clientId]);
  }

  saveContact(): void {
    console.log('Save contact:', {
      clientId: this.clientId,
      firstName: this.firstName,
      lastName: this.lastName,
      jobTitle: this.jobTitle,
      email: this.email,
      phone: this.phone,
      department: this.department,
      primaryContact: this.primaryContact,
      status: this.status,
      preferredContactMethod: this.preferredContactMethod,
      address: this.address,
      notes: this.notes,
    });
  }
}
