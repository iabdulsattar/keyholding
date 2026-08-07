import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ActivityItem {
  id: string;
  time: string;
  by: string;
  role: string;
  initials: string;
  avatarColor: string;
  action: string;
  eventType?: string;
  entity: string;
  name: string;
  detail1?: string;
  ip: string;
  details: string;
  reference?: string;
}

@Component({
  selector: 'app-activity-timeline',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './activity-timeline.component.html',
  styles: ``
})
export class ActivityTimelineComponent {
  readonly activities = input<ActivityItem[]>([]);
  readonly title = input<string>('Activity Log');
  readonly description = input<string>('');
  readonly loading = input<boolean>(false);
  readonly showSearch = input<boolean>(true);
  readonly showExport = input<boolean>(false);
  readonly pageSize = input<number>(10);

  readonly searchQuery = signal('');
  readonly currentPage = signal(1);

  readonly filteredActivities = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const all = this.activities();
    if (!q) return all;
    return all.filter((a: ActivityItem) =>
      (a.by + ' ' + a.action + ' ' + a.entity + ' ' + a.name + ' ' + a.details).toLowerCase().includes(q)
    );
  });

  readonly totalPages = computed(() => {
    const total = this.filteredActivities().length;
    return Math.max(1, Math.ceil(total / this.pageSize()));
  });

  readonly paginatedActivities = computed(() => {
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return this.filteredActivities().slice(start, start + size);
  });

  readonly showingStart = computed(() => {
    const filtered = this.filteredActivities().length;
    if (!filtered) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  readonly showingEnd = computed(() => {
    const filtered = this.filteredActivities().length;
    const end = this.currentPage() * this.pageSize();
    return Math.min(end, filtered);
  });

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
  }

  previousPage(): void {
    const page = this.currentPage();
    if (page > 1) this.currentPage.set(page - 1);
  }

  nextPage(): void {
    const page = this.currentPage();
    const total = this.totalPages();
    if (page < total) this.currentPage.set(page + 1);
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
  }

  getPageNumbers(): (number | '...')[] {
    const total = this.totalPages();
    const current = this.currentPage();
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
    if (current < total - 2) pages.push('...');
    pages.push(total);
    return pages;
  }

  getActivityIcon(entity: string): { bg: string; color: string; path: string } {
    const map: Record<string, { bg: string; color: string; path: string }> = {
      Site: { bg: 'bg-violet-50', color: 'text-violet-600', path: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 6v-3a1 1 0 011-1h2a1 1 0 011 1v3"/>' },
      Key: { bg: 'bg-amber-50', color: 'text-amber-600', path: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 11-12 0 6 6 0 0112 0zM3 21l7-7"/>' },
      Job: { bg: 'bg-emerald-50', color: 'text-emerald-600', path: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7h-3V5a2 2 0 00-2-2H9a2 2 0 00-2 2v2H4a1 1 0 00-1 1v11a2 2 0 002 2h14a2 2 0 002-2V8a1 1 0 00-1-1zM9 5h6v2H9V5z"/>' },
      Document: { bg: 'bg-sky-50', color: 'text-sky-600', path: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>' },
      Contact: { bg: 'bg-slate-100', color: 'text-slate-600', path: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>' },
      EmergencyContact: { bg: 'bg-rose-50', color: 'text-rose-600', path: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15v-1.5" />' },
    };
    return map[entity] || { bg: 'bg-slate-100', color: 'text-slate-600', path: '' };
  }

  getActionColor(action: string): string {
    const map: Record<string, string> = {
      Added: 'bg-emerald-50 text-emerald-600',
      Edited: 'bg-slate-100 text-slate-500',
      Deleted: 'bg-rose-50 text-rose-500',
      Deactivated: 'bg-slate-100 text-slate-500',
      Created: 'bg-amber-50 text-amber-600',
      Uploaded: 'bg-sky-50 text-sky-600',
      Activated: 'bg-emerald-50 text-emerald-600',
    };
    return map[action] || 'bg-slate-100 text-slate-600';
  }
}
