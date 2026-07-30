import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-view-contact',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './view-contact.component.html',
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
    .badge { display: inline-flex; align-items: center; padding: 0.125rem 0.625rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
    .info-label { font-size: 0.75rem; font-weight: 600; color: #64748b; margin-bottom: 0.25rem; }
    .info-value { font-size: 0.875rem; color: #1e293b; display: flex; align-items: center; gap: 0.5rem; }
    .btn-outline { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.5rem 1rem; font-size: 0.875rem; font-weight: 500; color: #475569; background-color: #fff; border: 1px solid #e2e8f0; border-radius: 0.5rem; cursor: pointer; transition: background-color 0.15s, color 0.15s; text-decoration: none; }
    .btn-outline:hover { background-color: #f8fafc; color: #1e293b; }
  `]
})
export class ViewContactComponent implements OnInit {
  clientId = '';
  clientName = 'Metro Security Services';
  contactId = '';

  firstName = 'James';
  lastName = 'Walker';
  jobTitle = 'Operations Manager';
  email = 'james.walker@metrosecurity.co.uk';
  phone = '+44 020 7946 0958';
  department = 'Operations';
  primaryContact = true;
  status = 'Active';
  preferredContactMethod = 'Email';
  address = 'Metro Security Services\n1 Security House, Park Lane\nLondon, W1K 1AB, UK';
  notes = 'James is the main point of contact for all operational matters and key management operations.';

  jobsAssigned = 48;
  keysManaged = 26;
  sitesAccess = 8;
  primaryFor = 'Metro Security Services';

  addedBy = 'Faisa Ahmed';
  createdOn = '15 May 2024, 09:15 AM';
  lastUpdated = '15 May 2024, 11:20 AM';
  lastUpdatedBy = 'Faisa Ahmed';

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.clientId = this.route.snapshot.paramMap.get('id') || '';
    this.contactId = this.route.snapshot.paramMap.get('contactId') || '';
    this.route.queryParams.subscribe(params => {
      this.clientName = params['clientName'] || this.clientName;
    });
  }

  goBack(): void {
    this.router.navigate(['/clients', this.clientId]);
  }

  editContact(): void {
    console.log('Edit contact:', this.contactId);
  }

  deleteContact(): void {
    console.log('Delete contact:', this.contactId);
  }

  toggleDropdown(id: string): void {
    const dropdown = document.getElementById(id);
    if (dropdown) {
      dropdown.classList.toggle('hidden');
    }
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
