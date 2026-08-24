import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { KeyVaultService } from '../../core/services/keyvault.service';

interface Key {
  id: string;
  code: string;
  name: string;
  cabinet: string;
  hook: string;
  site: string;
  room: string;
  status: 'Available' | 'Issued';
  selected: boolean;
}

interface ChecklistItem {
  id: string;
  text: string;
}

@Component({
  selector: 'app-create-job',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './create-job.component.html',
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  `]
})
export class CreateJobComponent implements OnInit {
  job = {
    type: 'Lock Service',
    client: 'Alpha Security Ltd.',
    site: 'Head Office',
    title: 'Evening Lock Service',
    reference: '',
    description: 'Perform evening locking and security checks as per site locking procedure. Ensure all areas are secure, alarm is set and keys are returned.',
    date: '15 May 2024',
    startTime: '18:30',
    endTime: '20:00',
    duration: '02:00',
    officer: 'James Walker',
    priority: 'Medium',
    notifyCompletion: 'Selected Contacts (2)',
    notifyNotCompleted: 'Selected Contacts (2)',
    notes: ''
  };

  showAddKeysModal = false;
  showAddChecklistModal = false;
  keys: Key[] = [];
  keysLoading = true;
  currentPage = 0;
  pageSize = 6;
  totalPages = 0;
  totalElements = 0;
  checklistItems: ChecklistItem[] = [
    { id: '1', text: 'Arrived on site' },
    { id: '2', text: 'Staff/visitors cleared' },
    { id: '3', text: 'Internal walkthrough completed' },
    { id: '4', text: 'Windows checked' },
    { id: '5', text: 'Internal doors checked' },
    { id: '6', text: 'External doors checked' },
    { id: '7', text: 'Fire exits checked' },
    { id: '8', text: 'Lights/equipment checked as instructed' },
    { id: '9', text: 'Alarm set' },
    { id: '10', text: 'Premises secured' },
    { id: '11', text: 'Keys returned/secured' },
    { id: '12', text: 'Officer departed site' },
  ];
  newChecklistItem = '';

  constructor(private router: Router, private keyVault: KeyVaultService) {}

  ngOnInit(): void {
    this.loadKeys();
  }

  get selectedKeys(): Key[] {
    return this.keys.filter(k => k.selected);
  }

  get checklistLeft(): ChecklistItem[] {
    return this.checklistItems.filter((_, i) => i % 2 === 0);
  }

  get checklistRight(): ChecklistItem[] {
    return this.checklistItems.filter((_, i) => i % 2 === 1);
  }

  get startIndex(): number {
    return this.currentPage * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
  }

  private getOrgId(): string | null {
    return localStorage.getItem('organizationId') || localStorage.getItem('org_id');
  }

  loadKeys(page = 0): void {
    const orgId = this.getOrgId();
    if (!orgId) {
      this.keysLoading = false;
      return;
    }

    this.keyVault.listKeys(orgId, { page, size: this.pageSize }).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res ?? {};
        const items = data.content ?? data.items ?? data.data ?? data ?? [];
        this.keys = items.map((k: any) => {
          const status = k.status ?? 'IN_STORAGE';
          const mappedStatus = status === 'IN_STORAGE' ? 'Available' : 'Issued';
          return {
            code: k.keyCode ?? '',
            id: k.id ?? '',
            name: k.name ?? '',
            cabinet: k.storageLocation ?? '',
            hook: '',
            site: k.siteName ?? '',
            room: k.description ?? '',
            status: mappedStatus,
            selected: false
          };
        });
        this.totalElements = res?.meta?.totalElements ?? items.length;
        this.totalPages = res?.meta?.totalPages ?? Math.max(1, Math.ceil(items.length / this.pageSize));
        this.currentPage = page;
        this.keysLoading = false;
      },
      error: () => {
        this.keysLoading = false;
      }
    });
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.loadKeys(page);
    }
  }

  prevPage(): void {
    if (this.currentPage > 0) {
      this.loadKeys(this.currentPage - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.loadKeys(this.currentPage + 1);
    }
  }

  get pageNumbers(): (number | '...')[] {
    if (this.totalPages <= 7) {
      return Array.from({ length: this.totalPages }, (_, i) => i + 1);
    }
    const pages: (number | '...')[] = [1];
    if (this.currentPage > 3) pages.push('...');
    const start = Math.max(2, this.currentPage - 1);
    const end = Math.min(this.totalPages - 1, this.currentPage + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (this.currentPage < this.totalPages - 3) pages.push('...');
    if (this.totalPages > 1) pages.push(this.totalPages);
    return pages;
  }

  openAddKeysModal(): void {
    this.showAddKeysModal = true;
  }

  closeAddKeysModal(): void {
    this.showAddKeysModal = false;
  }

  toggleKeySelection(key: Key): void {
    key.selected = !key.selected;
  }

  clearAllKeys(): void {
    this.keys.forEach(k => k.selected = false);
  }

  removeKey(key: Key): void {
    key.selected = false;
  }

  openAddChecklistModal(): void {
    this.showAddChecklistModal = true;
    this.newChecklistItem = '';
  }

  closeAddChecklistModal(): void {
    this.showAddChecklistModal = false;
    this.newChecklistItem = '';
  }

  addChecklistItem(): void {
    const text = this.newChecklistItem.trim();
    if (!text) return;
    this.checklistItems.push({
      id: Date.now().toString(),
      text
    });
    this.newChecklistItem = '';
    this.closeAddChecklistModal();
  }

  removeChecklistItem(id: string): void {
    this.checklistItems = this.checklistItems.filter(item => item.id !== id);
  }

  createJob(): void {
    console.log('Creating job:', this.job);
  }

  goBack(): void {
    this.router.navigate(['/jobs']);
  }
}