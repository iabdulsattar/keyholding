import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { KeyVaultService } from '../../core/services/keyvault.service';

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

  job: any = null;

  tabs = [
    { id: 'summary', label: 'Job Summary', icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>' },
    { id: 'keys', label: 'Required Keys', icon: '<circle cx="8" cy="15" r="4"/><path d="M10.5 12.5 19 4"/>' },
    { id: 'checklist', label: 'Checklist', icon: '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>' },
    { id: 'escalation', label: 'Escalation', icon: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>' }
  ];

  requiredKeys: any[] = [];
  checklistItems: any[] = [];

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
        this.job = data;
        this.requiredKeys = (data.keys ?? data.requiredKeys ?? []).map((k: any) => ({
          id: k.keyCode ?? k.id ?? '',
          name: k.name ?? '',
          storageLocation: k.storageLocationName ?? '',
          cabinet: k.cabinetName ?? '',
          hook: k.hookLabel ?? '',
          site: k.siteName ?? '',
          status: k.status ?? '',
          used: k.used ?? false,
          returned: k.returned ?? false
        }));
        this.checklistItems = (data.checklistItems ?? []).map((ci: any) => ({
          id: ci.id ?? '',
          text: ci.title ?? ci.text ?? '',
          response: ci.response ?? 'Completed',
          notes: ci.notes ?? '-',
          images: ci.images ?? '0'
        }));
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load job', err);
        this.loading = false;
      }
    });
  }

  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
  }
}
