import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-view-key',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './view-key.component.html',
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  `]
})
export class ViewKeyComponent implements OnInit {
  activeTab = 'overview';

  constructor() {}

  ngOnInit(): void {}

  switchTab(tabId: string): void {
    this.activeTab = tabId;
  }

  get isOverviewActive(): boolean {
    return this.activeTab === 'overview';
  }
  get isMovementsActive(): boolean {
    return this.activeTab === 'movements';
  }
  get isAuditActive(): boolean {
    return this.activeTab === 'audit';
  }
  get isJobsActive(): boolean {
    return this.activeTab === 'jobs';
  }
  get isAttachmentsActive(): boolean {
    return this.activeTab === 'attachments';
  }
  get isNotesActive(): boolean {
    return this.activeTab === 'notes';
  }

  toggleDropdown(): void {
    const el = document.getElementById('moreDropdown');
    if (el) {
      el.classList.toggle('hidden');
    }
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text);
  }
}
