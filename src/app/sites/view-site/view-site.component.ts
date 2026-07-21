import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-view-site',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './view-site.component.html',
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  `]
})
export class ViewSiteComponent implements OnInit {
  activeTab = 'overview';

  constructor() {}

  ngOnInit(): void {}

  switchTab(tabId: string): void {
    this.activeTab = tabId;
  }

  get isOverviewActive(): boolean {
    return this.activeTab === 'overview';
  }
  get isLocationActive(): boolean {
    return this.activeTab === 'location';
  }
  get isDetailsActive(): boolean {
    return this.activeTab === 'details';
  }
  get isContactsActive(): boolean {
    return this.activeTab === 'contacts';
  }
  get isAttachmentsActive(): boolean {
    return this.activeTab === 'attachments';
  }
  get isActivityActive(): boolean {
    return this.activeTab === 'activity';
  }

  toggleDropdown(): void {
    const el = document.getElementById('actionsDropdown');
    if (el) {
      el.classList.toggle('hidden');
    }
  }

  handleFileUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      alert(`Success! File "${input.files[0].name}" attached successfully to this site workspace data.`);
    }
  }
}
