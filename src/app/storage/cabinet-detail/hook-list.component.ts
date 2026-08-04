import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface HookRow {
  no: string;
  status: string;
  key: string;
  keyId: string;
  type: string;
  updated: string;
  by: string;
}

@Component({
  selector: 'app-hook-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './hook-list.component.html',
  styles: [`
    .scrollbar-thin::-webkit-scrollbar { height: 6px; width: 6px; }
    .scrollbar-thin::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 9999px; }
    @keyframes fadeIn { from { opacity: 0; transform: scale(.97); } to { opacity: 1; transform: scale(1); } }
    .animate-fade-in { animation: fadeIn .15s ease-out; }
  `],
})
export class HookListComponent {
  readonly statusStyles: Record<string, string> = {
    'Key Hooked': 'bg-blue-100 text-blue-700',
    'Available for Key': 'bg-emerald-100 text-emerald-700',
    'Key In Use': 'bg-orange-100 text-orange-700',
    'Hook Damaged': 'bg-red-100 text-red-700',
  };

  readonly rows: HookRow[] = [
    { no: '01', status: 'Key Hooked', key: 'Yale Key', keyId: 'KEY-0001', type: 'Yale', updated: '15 May 2024, 11:20 AM', by: 'Faiza Ahmed' },
    { no: '02', status: 'Key Hooked', key: 'Yale Key', keyId: 'KEY-0002', type: 'Yale', updated: '15 May 2024, 10:58 AM', by: 'James Walker' },
    { no: '03', status: 'Available for Key', key: '-', keyId: '-', type: '-', updated: '15 May 2024, 09:45 AM', by: 'System' },
    { no: '04', status: 'Key In Use', key: 'Mortice Key', keyId: 'KEY-0003', type: 'Mortice', updated: '15 May 2024, 10:30 AM', by: 'Sarah Johnson' },
    { no: '05', status: 'Key Hooked', key: 'Yale Key', keyId: 'KEY-0004', type: 'Yale', updated: '15 May 2024, 11:10 AM', by: 'Faiza Ahmed' },
    { no: '06', status: 'Available for Key', key: '-', keyId: '-', type: '-', updated: '15 May 2024, 09:12 AM', by: 'System' },
    { no: '07', status: 'Key In Use', key: 'Yale Key', keyId: 'KEY-0005', type: 'Yale', updated: '15 May 2024, 10:05 AM', by: 'James Walker' },
    { no: '08', status: 'Key Hooked', key: 'Padlock Key', keyId: 'KEY-0006', type: 'Padlock', updated: '15 May 2024, 11:00 AM', by: 'Faiza Ahmed' },
    { no: '09', status: 'Available for Key', key: '-', keyId: '-', type: '-', updated: '15 May 2024, 09:00 AM', by: 'System' },
    { no: '10', status: 'Hook Damaged', key: '-', keyId: '-', type: '-', updated: '15 May 2024, 08:45 AM', by: 'Maintenance' },
  ];

  isDeactivateModalOpen = false;
  isReactivateModalOpen = false;
  isMoreMenuOpen = false;

  openDeactivateModal(): void {
    this.isDeactivateModalOpen = true;
    this.isMoreMenuOpen = false;
  }

  closeDeactivateModal(): void {
    this.isDeactivateModalOpen = false;
  }

  openReactivateModal(): void {
    this.isReactivateModalOpen = true;
    this.isMoreMenuOpen = false;
  }

  closeReactivateModal(): void {
    this.isReactivateModalOpen = false;
  }

  toggleMoreMenu(): void {
    this.isMoreMenuOpen = !this.isMoreMenuOpen;
  }

  closeMoreMenu(): void {
    this.isMoreMenuOpen = false;
  }
}