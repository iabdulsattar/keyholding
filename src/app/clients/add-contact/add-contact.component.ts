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
