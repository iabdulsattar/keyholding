import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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
  constructor(private router: Router) {}

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
      'Scheduled': 'bg-indigo-50 text-indigo-600',
      'In Progress': 'bg-amber-50 text-amber-600',
      'Completed': 'bg-emerald-50 text-emerald-600',
      'Overdue': 'bg-red-50 text-red-600',
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
      return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_2296_135)">
    <path d="M10.332 4.99946L11.8654 6.53279C11.99 6.65495 12.1575 6.72337 12.332 6.72337C12.5065 6.72337 12.6741 6.65495 12.7987 6.53279L14.1987 5.13279C14.3208 5.00817 14.3893 4.84063 14.3893 4.66613C14.3893 4.49163 14.3208 4.32408 14.1987 4.19946L12.6654 2.66613M13.9986 1.33279L7.59863 7.73279M8.66536 10.3328C8.66536 12.3578 7.02374 13.9995 4.9987 13.9995C2.97365 13.9995 1.33203 12.3578 1.33203 10.3328C1.33203 8.30775 2.97365 6.66613 4.9987 6.66613C7.02374 6.66613 8.66536 8.30775 8.66536 10.3328Z" stroke="#64748B" stroke-width="2" stroke-linecap="round"/>
    </g>
    <defs>
    <clipPath id="clip0_2296_135">
    <rect width="16" height="16" fill="white"/>
    </clipPath>
    </defs>
    </svg>`;
    }else if (type.includes('Lock')) {
      return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.6667 6.66667H3.33333C2.59695 6.66667 2 7.26362 2 8V13.3333C2 14.0697 2.59695 14.6667 3.33333 14.6667H12.6667C13.4031 14.6667 14 14.0697 14 13.3333V8C14 7.26362 13.4031 6.66667 12.6667 6.66667Z" stroke="#64748B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M10.6667 6.66667V4.66667C10.6667 3.93029 10.0697 3.33333 9.33333 3.33333H6.66667C5.93029 3.33333 5.33333 3.93029 5.33333 4.66667V6.66667" stroke="#64748B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
    } else {
      return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 1V15M1 8H15" stroke="#64748B" stroke-width="2" stroke-linecap="round"/>
    </svg>`;
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
    this.router.navigate(['/jobs', jobId]);
  }

  ngOnInit(): void {}
}
