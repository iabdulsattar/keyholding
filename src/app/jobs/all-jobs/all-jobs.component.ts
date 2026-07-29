import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-all-jobs',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './all-jobs.component.html',
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  `]
})
export class AllJobsComponent implements OnInit {
  jobs = [
    { id: 'JOB-001248', client: 'Metro Security Services', site: 'Head Office', type: 'Key Collection', officer: 'James Walker', date: '16 May 2024, 09:00 AM', status: 'Scheduled', priority: 'Medium' },
    { id: 'JOB-001247', client: 'Alpha Security Ltd.', site: 'Warehouse - North', type: 'Lock Service', officer: 'Sarah Miller', date: '16 May 2024, 08:00 AM', status: 'In Progress', priority: 'High' },
    { id: 'JOB-001246', client: 'Beta Facilities Management', site: 'Retail Store - Central', type: 'Unlock Service', officer: 'David Johnson', date: '15 May 2024, 04:30 PM', status: 'Completed', priority: 'Low' },
    { id: 'JOB-001245', client: 'Gamma Group', site: 'Data Centre', type: 'Key Drop Off', officer: 'Michael Brown', date: '15 May 2024, 03:00 PM', status: 'Completed', priority: 'Medium' },
    { id: 'JOB-001244', client: 'Delta Property Services', site: 'Head Office', type: 'Lock Service', officer: 'James Walker', date: '15 May 2024, 11:00 AM', status: 'Overdue', priority: 'High' },
    { id: 'JOB-001243', client: 'Omega Security Solutions', site: 'Branch Office - South', type: 'Unlock Service', officer: 'Sarah Miller', date: '14 May 2024, 02:00 PM', status: 'Cancelled', priority: 'Low' },
    { id: 'JOB-001242', client: 'SecureGuard Ltd.', site: 'Warehouse - West', type: 'Key Collection', officer: 'David Johnson', date: '14 May 2024, 09:00 AM', status: 'Scheduled', priority: 'Medium' },
    { id: 'JOB-001241', client: 'Prime Security Services', site: 'Retail Store - High St', type: 'Lock Service', officer: 'James Walker', date: '14 May 2024, 08:00 AM', status: 'In Progress', priority: 'High' },
    { id: 'JOB-001240', client: 'Titan Security Group', site: 'Construction Site A', type: 'Unlock Service', officer: 'Sarah Miller', date: '13 May 2024, 05:00 PM', status: 'Completed', priority: 'Low' },
    { id: 'JOB-001239', client: 'Falcon Security Ltd.', site: 'Data Centre', type: 'Key Drop Off', officer: 'Michael Brown', date: '13 May 2024, 02:30 PM', status: 'Completed', priority: 'Medium' },
  ];

  statusClass(status: string): string {
    const map: Record<string, string> = {
      'Scheduled': 'bg-purple-50 text-purple-600',
      'In Progress': 'bg-orange-50 text-orange-500',
      'Completed': 'bg-green-50 text-green-600',
      'Overdue': 'bg-red-50 text-red-500',
      'Cancelled': 'bg-slate-100 text-slate-500',
    };
    return map[status] || 'bg-slate-100 text-slate-500';
  }

  priorityClass(priority: string): string {
    const map: Record<string, string> = {
      'High': 'text-red-500',
      'Medium': 'text-orange-500',
      'Low': 'text-green-500',
    };
    return map[priority] || 'text-slate-500';
  }

  typeIcon(type: string): string {
    if (type.includes('Key')) {
      return `<svg class="w-3.5 h-3.5 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 11-12 0 6 6 0 0112 0zM3 21l6.5-6.5"/></svg>`;
    }
    return `<svg class="w-3.5 h-3.5 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>`;
  }

  toggleDropdown(id: string): void {
    const dropdown = document.getElementById(id);
    if (dropdown) {
      dropdown.classList.toggle('hidden');
    }
  }

  viewJob(jobId: string): void {
    console.log('View job:', jobId);
  }

  ngOnInit(): void {}
}
