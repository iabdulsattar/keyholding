import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { KeyVaultService } from '../../core/services/keyvault.service';

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
  jobs: any[] = [];
  stats: any = {};
  loading = false;

  filters = {
    q: '',
    clientId: '',
    siteId: '',
    jobTypeId: '',
    status: ''
  };

  pagination = {
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0
  };

  constructor(private router: Router, private keyVault: KeyVaultService) {}

  ngOnInit(): void {
    this.loadJobs();
    this.loadStats();
  }

  private getOrgId(): string | null {
    return localStorage.getItem('organizationId') || localStorage.getItem('org_id');
  }

  loadJobs(page = 0): void {
    const orgId = this.getOrgId();
    if (!orgId) return;
    this.loading = true;
    this.keyVault.listJobs(orgId, {
      q: this.filters.q || undefined,
      clientId: this.filters.clientId || undefined,
      siteId: this.filters.siteId || undefined,
      jobTypeId: this.filters.jobTypeId || undefined,
      status: this.filters.status || undefined,
      page,
      size: this.pagination.size
    }).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res ?? {};
        const items = data.content ?? data.items ?? data.data ?? data ?? [];
        this.jobs = items.map((job: any) => this.mapJob(job));
        this.pagination.totalElements = data.totalElements ?? data.total ?? items.length;
        this.pagination.totalPages = data.totalPages ?? Math.max(1, Math.ceil(items.length / this.pagination.size));
        this.pagination.page = page;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  loadStats(): void {
    const orgId = this.getOrgId();
    if (!orgId) return;
    this.keyVault.getJobStats(orgId).subscribe((res: any) => {
      const data = res?.data ?? res ?? {};
      this.stats = data;
    });
  }

  mapJob(job: any): any {
    return {
      id: job.jobCode ?? job.id ?? '',
      client: job.clientName ?? job.client?.name ?? '',
      site: job.siteName ?? job.site?.name ?? '',
      type: job.jobTypeName ?? job.jobType?.name ?? '',
      officer: job.officerName ?? job.officer?.fullName ?? '',
      date: this.formatJobDate(job.scheduledDate, job.startTime),
      status: job.status ?? 'SCHEDULED',
      priority: job.priority ?? 'MEDIUM',
      raw: job
    };
  }

  formatJobDate(scheduledDate?: string, startTime?: string): string {
    if (!scheduledDate) return '';
    try {
      const date = new Date(scheduledDate);
      const day = date.getDate();
      const month = date.toLocaleString('en-GB', { month: 'short' });
      const year = date.getFullYear();
      let timeStr = '';
      if (startTime) {
        const [hours, minutes] = startTime.split(':');
        const h = parseInt(hours, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        timeStr = `, ${h12}:${minutes} ${ampm}`;
      }
      return `${day} ${month} ${year}${timeStr}`;
    } catch {
      return scheduledDate;
    }
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      'SCHEDULED': 'bg-indigo-50 text-indigo-600',
      'IN_PROGRESS': 'bg-amber-50 text-amber-600',
      'COMPLETED': 'bg-emerald-50 text-emerald-600',
      'OVERDUE': 'bg-red-50 text-red-600',
      'CANCELLED': 'bg-slate-100 text-slate-500'
    };
    return map[status] || 'bg-slate-100 text-slate-500';
  }

  priorityClass(priority: string): string {
    const map: Record<string, string> = {
      'HIGH': 'text-red-500',
      'MEDIUM': 'text-orange-500',
      'LOW': 'text-green-500',
      'CRITICAL': 'text-rose-600'
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
    } else if (type.includes('Lock')) {
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

  goToPage(page: number): void {
    if (page >= 0 && page < this.pagination.totalPages) {
      this.loadJobs(page);
    }
  }

  prevPage(): void {
    if (this.pagination.page > 0) {
      this.loadJobs(this.pagination.page - 1);
    }
  }

  nextPage(): void {
    if (this.pagination.page < this.pagination.totalPages - 1) {
      this.loadJobs(this.pagination.page + 1);
    }
  }

  get pageNumbers(): (number | '...')[] {
    const total = this.pagination.totalPages;
    const current = this.pagination.page;
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages: (number | '...')[] = [1];
    if (current > 3) pages.push('...');
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (current < total - 3) pages.push('...');
    if (total > 1) pages.push(total);
    return pages;
  }

  ngOnInit(): void {}
}
