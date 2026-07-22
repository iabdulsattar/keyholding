import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientService } from '../../core/services/client.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-view-site',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './view-site.component.html',
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  `]
})
export class ViewSiteComponent implements OnInit {
  activeTab = 'overview';
  siteId = '';
  site: any = null;
  loading = false;

  constructor(private route: ActivatedRoute, private router: Router, private clientService: ClientService, private toast: ToastService) {}

  ngOnInit(): void {
    this.siteId = this.route.snapshot.paramMap.get('id') || '';
    if (this.siteId) {
      this.loadSite();
    }
  }

  private loadSite(): void {
    this.loading = true;
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
    if (!orgId) {
      this.loading = false;
      return;
    }
    this.clientService.getSiteById(orgId, this.siteId).subscribe((res: any) => {
      const item = res?.data ?? res;
      this.site = item || null;
      this.loading = false;
    });
  }

  switchTab(tabId: string): void {
    this.activeTab = tabId;
  }

  get isOverviewActive(): boolean { return this.activeTab === 'overview'; }
  get isLocationActive(): boolean { return this.activeTab === 'location'; }
  get isDetailsActive(): boolean { return this.activeTab === 'details'; }
  get isContactsActive(): boolean { return this.activeTab === 'contacts'; }
  get isAttachmentsActive(): boolean { return this.activeTab === 'attachments'; }
  get isActivityActive(): boolean { return this.activeTab === 'activity'; }

  get isSiteActive(): boolean {
    return this.site?.status === 'ACTIVE' || this.site?.status === 'Active';
  }

  toggleDropdown(): void {
    const el = document.getElementById('actionsDropdown');
    if (el) {
      el.classList.toggle('hidden');
    }
  }

  onEditSite(): void {
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
    const clientId = this.site?.clientId || this.site?.client?.id || '';
    this.router.navigate(['/sites/add-site'], { queryParams: { clientId: clientId, editId: this.siteId } });
  }

  onDeactivateSite(): void {
    if (!confirm('Are you sure you want to deactivate this site?')) return;
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
    if (!orgId) return;
    this.clientService.deactivateSite(orgId, this.siteId).subscribe({
      next: () => {
        this.toast.success('Site deactivated successfully');
        this.loadSite();
      },
      error: () => this.toast.error('Failed to deactivate site')
    });
  }

  onReactivateSite(): void {
    if (!confirm('Are you sure you want to activate this site?')) return;
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
    if (!orgId) return;
    this.clientService.reactivateSite(orgId, this.siteId).subscribe({
      next: () => {
        this.toast.success('Site activated successfully');
        this.loadSite();
      },
      error: () => this.toast.error('Failed to activate site')
    });
  }

  onDeleteSite(): void {
    if (!confirm('Are you sure you want to delete this site? This action cannot be undone.')) return;
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
    if (!orgId) return;
    this.clientService.deleteSite(orgId, this.siteId).subscribe({
      next: () => {
        this.toast.success('Site deleted successfully');
        const clientId = this.site?.clientId || this.site?.client?.id || '';
        this.router.navigate(['/clients', clientId]);
      },
      error: () => this.toast.error('Failed to delete site')
    });
  }

  handleFileUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.toast.success(`File "${input.files[0].name}" attached successfully`);
    }
  }
}
