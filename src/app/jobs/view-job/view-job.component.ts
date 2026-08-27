import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { KeyVaultService } from '../../core/services/keyvault.service';

interface JobDetail {
  id: string;
  code: string;
  type: string;
  title: string;
  status: string;
  priority: string;
  client: string;
  site: string;
  address: string;
  reference: string;
  description: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  repeat: string;
  officer: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedOn: string | null;
  additionalNotes: string | null;
  tiles: {
    durationMinutes: number;
    officerAssigned: number;
    keysUsed: number;
    checklistItems: number;
  };
  requiredKeys: {
    keys: any[];
    summary: {
      issued: number;
      used: number;
      returned: number;
      notReturned: number;
    };
  };
  checklist: {
    total: number;
    completed: number;
    items: any[];
  };
  escalation: {
    notifyOnCompletion: any[];
    notifyOnNotCompleted: any[];
  };
}

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
  loading = false;

  job: JobDetail | null = null;

  tabs = [
    { id: 'summary', label: 'Job Summary', icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>' },
    { id: 'keys', label: 'Required Keys', icon: '<circle cx="8" cy="15" r="4"/><path d="M10.5 12.5 19 4"/>' },
    { id: 'checklist', label: 'Checklist', icon: '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>' },
    { id: 'escalation', label: 'Escalation', icon: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>' }
  ];

  constructor(private route: ActivatedRoute, private keyVault: KeyVaultService) {}

  ngOnInit(): void {
    this.jobId = this.route.snapshot.paramMap.get('id');
    if (this.jobId) {
      this.loadJob(this.jobId);
    }
  }

  private getOrgId(): string | null {
    return localStorage.getItem('organizationId') || localStorage.getItem('org_id');
  }

  loadJob(jobId: string): void {
    const orgId = this.getOrgId();
    if (!orgId) return;
    this.loading = true;
    this.keyVault.getJob(orgId, jobId).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res ?? {};
        this.job = this.mapJob(data);
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load job', err);
        this.loading = false;
      }
    });
  }

  private mapJob(data: any): JobDetail {
    const tiles = data.tiles || {};
    const requiredKeys = data.requiredKeys || {};
    const checklist = data.checklist || {};
    const escalation = data.escalation || {};

    return {
      id: data.id || '',
      code: data.jobCode || '',
      type: data.jobTypeName || '—',
      title: data.title || '—',
      status: data.status || 'SCHEDULED',
      priority: data.priority || 'MEDIUM',
      client: data.clientName || '—',
      site: data.siteName || '—',
      address: data.siteAddress || '—',
      reference: data.reference || '—',
      description: data.description || '—',
      scheduledDate: this.formatDate(data.scheduledDate),
      startTime: this.formatTime(data.startTime),
      endTime: this.formatTime(data.endTime),
      durationMinutes: data.durationMinutes ?? tiles.durationMinutes ?? 0,
      repeat: data.repeat || 'One Time',
      officer: data.officerName || '—',
      createdBy: data.createdByName || '—',
      createdAt: this.formatDateTime(data.createdAt),
      updatedAt: this.formatDateTime(data.updatedAt),
      completedOn: data.completedOn ? this.formatDateTime(data.completedOn) : null,
      additionalNotes: data.additionalNotes || null,
      tiles: {
        durationMinutes: tiles.durationMinutes ?? 0,
        officerAssigned: tiles.officerAssigned ?? 1,
        keysUsed: tiles.keysUsed ?? 0,
        checklistItems: tiles.checklistItems ?? 0
      },
      requiredKeys: {
        keys: (requiredKeys.keys || []).map((k: any) => ({
          id: k.keyCode || k.keyId || '',
          name: k.keyName || '—',
          storageLocation: k.storageLocation || '—',
          cabinet: k.cabinet || '—',
          hook: k.hook || '—',
          site: k.site || '—',
          status: k.status || '—',
          used: k.used || false,
          returned: k.returned || false
        })),
        summary: requiredKeys.summary || { issued: 0, used: 0, returned: 0, notReturned: 0 }
      },
      checklist: {
        total: checklist.total ?? 0,
        completed: checklist.completed ?? 0,
        items: (checklist.items || []).map((ci: any) => ({
          id: ci.id || '',
          text: ci.title || ci.text || '—',
          response: ci.response || 'Pending',
          notes: ci.notes || '-',
          images: ci.imageCount ?? ci.images ?? '0'
        }))
      },
      escalation: {
        notifyOnCompletion: escalation.notifyOnCompletion || [],
        notifyOnNotCompleted: escalation.notifyOnNotCompleted || []
      }
    };
  }

  private formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '—';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr || '—';
    }
  }

  private formatTime(timeStr: string | undefined): string {
    if (!timeStr) return '—';
    const match = timeStr.match(/(\d+):(\d+)/);
    if (!match) return timeStr;
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  }

  private formatDateTime(dateStr: string | undefined): string {
    if (!dateStr) return '—';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + this.formatTime(date.toTimeString().slice(0, 5));
    } catch {
      return dateStr || '—';
    }
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      'SCHEDULED': 'bg-indigo-50 text-indigo-600',
      'IN_PROGRESS': 'bg-amber-50 text-amber-600',
      'COMPLETED': 'bg-emerald-50 text-emerald-600',
      'OVERDUE': 'bg-red-50 text-red-600',
      'CANCELLED': 'bg-slate-100 text-slate-500',
      'Pending': 'bg-amber-50 text-amber-600'
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

  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
  }

  get requiredKeys(): any[] {
    return this.job?.requiredKeys?.keys || [];
  }

  get checklistItems(): any[] {
    return this.job?.checklist?.items || [];
  }

  get escalationContacts(): { completion: any[]; notCompleted: any[] } {
    return {
      completion: this.job?.escalation?.notifyOnCompletion || [],
      notCompleted: this.job?.escalation?.notifyOnNotCompleted || []
    };
  }

  get escalationCompletionEnabled(): boolean {
    return (this.job?.escalation?.notifyOnCompletion?.length || 0) > 0;
  }

  get escalationNotCompletedEnabled(): boolean {
    return (this.job?.escalation?.notifyOnNotCompleted?.length || 0) > 0;
  }
}
