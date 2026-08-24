import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-view-job',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './view-job.component.html',
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  `]
})
export class ViewJobComponent implements OnInit {
  jobId: string | null = null;
  activeTab = 'summary';

  tabs = [
    { id: 'summary', label: 'Job Summary', icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>' },
    { id: 'keys', label: 'Required Keys', icon: '<circle cx="8" cy="15" r="4"/><path d="M10.5 12.5 19 4"/>' },
    { id: 'checklist', label: 'Checklist', icon: '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>' },
    { id: 'escalation', label: 'Escalation', icon: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>' }
  ];

  requiredKeys = [
    { id: 'KEY-000401', name: 'Main Entrance Key', storageLocation: 'Main Office Vault', cabinet: 'Cabinet A', hook: 'Hook 02', site: 'Head Office', status: 'Returned', used: true, returned: true },
    { id: 'KEY-000567', name: 'Storage Area 1 Key', storageLocation: 'Main Office Vault', cabinet: 'Cabinet B', hook: 'Hook 11', site: 'Head Office', status: 'Returned', used: true, returned: true },
    { id: 'KEY-000982', name: 'Storage Area 2 Key', storageLocation: 'Main Office Vault', cabinet: 'Cabinet C', hook: 'Hook 06', site: 'Head Office', status: 'Returned', used: true, returned: true },
    { id: 'KEY-000124', name: 'Electrical Room Key', storageLocation: 'Main Office Vault', cabinet: 'Cabinet F', hook: 'Hook 22', site: 'Head Office', status: 'Returned', used: true, returned: true },
    { id: 'KEY-000637', name: 'Rear Gate Key', storageLocation: 'Main Office Vault', cabinet: 'Cabinet M', hook: 'Hook 07', site: 'Head Office', status: 'Returned', used: true, returned: true },
  ];

  checklistItems = [
    { id: '1', text: 'Arrived on site', response: 'Completed', notes: 'On time', images: '2' },
    { id: '2', text: 'Staff/visitors cleared', response: 'Completed', notes: 'All clear', images: '1' },
    { id: '3', text: 'Internal walkthrough completed', response: 'Completed', notes: '-', images: '3' },
    { id: '4', text: 'Windows checked', response: 'Completed', notes: 'All locked', images: '0' },
    { id: '5', text: 'Internal doors checked', response: 'Completed', notes: '-', images: '0' },
    { id: '6', text: 'External doors checked', response: 'Completed', notes: 'All secure', images: '2' },
    { id: '7', text: 'Fire exits checked', response: 'Completed', notes: '-', images: '0' },
    { id: '8', text: 'Lights/equipment checked as instructed', response: 'Completed', notes: 'Switched off', images: '1' },
    { id: '9', text: 'Alarm set', response: 'Completed', notes: 'Verified', images: '0' },
    { id: '10', text: 'Premises secured', response: 'Completed', notes: '-', images: '0' },
    { id: '11', text: 'Keys returned/secured', response: 'Completed', notes: 'Returned to cabinet', images: '1' },
    { id: '12', text: 'Officer departed site', response: 'Completed', notes: '-', images: '0' },
  ];

  escalationCompletionEnabled = true;
  escalationNotCompletedEnabled = true;
  escalationContacts = {
    completion: [
      { name: 'Samantha Palin', role: 'Sales Director', email: 'spalin@alpha-security.com' },
      { name: 'Control Room', role: 'Monitoring Team', email: 'controlroom@alpha-security.com' }
    ],
    notCompleted: [
      { name: 'Steve Wolfeden', role: 'Construction Manager', email: 'steve.w@alpha-security.com' },
      { name: 'Mark Smiths', role: 'Construction Director', email: 'mark.smith@alpha-security.com' }
    ]
  };

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.jobId = this.route.snapshot.paramMap.get('id');
  }

  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
  }
}
