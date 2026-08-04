import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface Hook {
  no: string;
  status: string;
  keyId?: string;
  type?: string;
}

interface StatusMeta {
  border: string;
  badge: string;
  hook: string;
}

@Component({
  selector: 'app-hook-grid',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './hook-grid.component.html',
  styles: [`
    .scrollbar-thin::-webkit-scrollbar { height: 6px; width: 6px; }
    .scrollbar-thin::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 9999px; }
  `],
})
export class HookGridComponent {
  readonly statusMeta: Record<string, StatusMeta> = {
    'Key Hooked':        { border: 'border-t-blue-500',    badge: 'bg-blue-100 text-blue-700',       hook: 'text-blue-500' },
    'Key In Use':        { border: 'border-t-orange-500',  badge: 'bg-orange-100 text-orange-700',   hook: 'text-orange-500' },
    'Available for Key': { border: 'border-t-emerald-500', badge: 'bg-emerald-100 text-emerald-700', hook: 'text-slate-300' },
    'Hook Damaged':      { border: 'border-t-red-500',     badge: 'bg-red-100 text-red-700',         hook: 'text-red-400' },
  };

  readonly hooks: Hook[] = [
    { no: '01', status: 'Key Hooked', keyId: 'K-0001', type: 'Yale' },
    { no: '02', status: 'Key Hooked', keyId: 'K-0002', type: 'Yale' },
    { no: '03', status: 'Available for Key' },
    { no: '04', status: 'Key In Use', keyId: 'K-0003', type: 'Mortice' },
    { no: '05', status: 'Key Hooked', keyId: 'K-0004', type: 'Yale' },
    { no: '06', status: 'Available for Key' },
    { no: '07', status: 'Available for Key' },
    { no: '08', status: 'Key In Use', keyId: 'K-0005', type: 'Yale' },
    { no: '09', status: 'Key Hooked', keyId: 'K-0006', type: 'Yale' },
    { no: '10', status: 'Hook Damaged' },
    { no: '11', status: 'Key Hooked', keyId: 'K-0007', type: 'Mortice' },
    { no: '12', status: 'Available for Key' },
    { no: '13', status: 'Key In Use', keyId: 'K-0009', type: 'Yale' },
    { no: '14', status: 'Key Hooked', keyId: 'K-0010', type: 'Yale' },
    { no: '15', status: 'Available for Key' },
    { no: '16', status: 'Key In Use', keyId: 'K-0011', type: 'Yale' },
    { no: '17', status: 'Key Hooked', keyId: 'K-0011', type: 'Yale' },
    { no: '18', status: 'Available for Key' },
    { no: '19', status: 'Hook Damaged' },
    { no: '20', status: 'Available for Key' },
  ];

  getMeta(hook: Hook): StatusMeta {
    return this.statusMeta[hook.status] || this.statusMeta['Available for Key'];
  }

  hasKey(hook: Hook): boolean {
    return hook.status === 'Key Hooked' || hook.status === 'Key In Use';
  }

  isDamaged(hook: Hook): boolean {
    return hook.status === 'Hook Damaged';
  }

  isMoreMenuOpen = false;

  closeMoreMenu(): void {
    this.isMoreMenuOpen = false;
  }
}