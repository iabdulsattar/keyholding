import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { KeyVaultService } from '../../core/services/keyvault.service';

interface HookRow {
  no: string;
  status: string;
  key: string;
  keyId: string;
  type: string;
  updated: string;
  by: string;
  hookId: string;
}

interface HookGridItem {
  num: number;
  used: boolean;
  damaged: boolean;
  id: string;
}

interface HookStats {
  totalHooks: number;
  keyHooked: number;
  keyInUse: number;
  available: number;
  damaged: number;
}

@Component({
  selector: 'app-hook-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './hook-list.component.html',
  styles: [`
    .scrollbar-thin::-webkit-scrollbar { height: 6px; width: 6px; }
    .scrollbar-thin::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 9999px; }
  `],
})
export class HookListComponent implements OnInit, AfterViewInit {
  cabinetId = '';
  cabinet: any = null;
  loading = true;
  error = '';

  activeTab = 'hooks';
  rows: HookRow[] = [];
  hooks: HookGridItem[] = [];
  stats: HookStats = { totalHooks: 0, keyHooked: 0, keyInUse: 0, available: 0, damaged: 0 };

  private allHooksRaw: any[] = [];

  readonly statusStyles: Record<string, string> = {
    'Key Hooked': 'bg-blue-100 text-blue-700',
    'Available for Key': 'bg-emerald-100 text-emerald-700',
    'Key In Use': 'bg-orange-100 text-orange-700',
    'Hook Damaged': 'bg-red-100 text-red-700',
  };

  constructor(
    private route: ActivatedRoute,
    private keyVault: KeyVaultService
  ) {}

  ngOnInit(): void {
    this.cabinetId = this.route.snapshot.paramMap.get('id') || '';
    this.loadCabinetDetails();
    this.loadHooks();
  }

  ngAfterViewInit(): void {
    this.createIcons();
  }

  private createIcons(): void {
    setTimeout(() => {
      const icons = (window as any).lucide;
      if (icons && icons.createIcons) {
        icons.createIcons();
      }
    }, 0);
  }

  private loadCabinetDetails(): void {
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id') || '';
    if (!orgId || !this.cabinetId) return;
    this.keyVault.getCabinet(orgId, this.cabinetId).subscribe({
      next: (res: any) => {
        const item = res?.data ?? res ?? {};
        this.cabinet = {
          id: item.id || '',
          code: item.code || item.cabinetCode || '',
          name: item.name || item.cabinetName || '',
          type: item.cabinetType || item.type || '',
          status: item.status || 'Active',
          totalHooks: item.numberOfHooks || item.totalHooks || 20,
          usedHooks: item.usedHooks || 0,
          availableHooks: item.availableHooks || 0,
          storageLocation: item.storageLocationName || item.locationName || '',
          floor: item.floorArea || item.floor || '',
        };
      },
      error: () => {
        this.cabinet = this.getFallbackCabinet();
      }
    });
  }

  private getFallbackCabinet(): any {
    return {
      id: this.cabinetId,
      code: 'CAB-0001',
      name: 'Cabinet A - Main Floor',
      type: 'Standard',
      status: 'Active',
      totalHooks: 20,
      usedHooks: 14,
      availableHooks: 6,
      storageLocation: 'Head Office Vault (LOC-0001)',
      floor: 'Main Floor',
    };
  }

  private loadHooks(): void {
    this.loading = true;
    this.error = '';
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id') || '';
    if (!orgId || !this.cabinetId) {
      this.rows = [];
      this.hooks = [];
      this.stats = { totalHooks: 0, keyHooked: 0, keyInUse: 0, available: 0, damaged: 0 };
      this.loading = false;
      this.createIcons();
      return;
    }

    this.keyVault.listHooks(orgId, this.cabinetId, { page: 0, size: 100 }).subscribe({
      next: (hooks: any[]) => {
        this.allHooksRaw = hooks || [];
        this.rows = this.allHooksRaw.map(h => this.normalizeHookRow(h));
        this.hooks = this.allHooksRaw.map(h => this.normalizeGridHook(h));
        this.loadHookStats();
      },
      error: () => {
        this.rows = [];
        this.hooks = [];
        this.stats = { totalHooks: 0, keyHooked: 0, keyInUse: 0, available: 0, damaged: 0 };
        this.loading = false;
        this.createIcons();
      }
    });
  }

  private loadHookStats(): void {
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id') || '';
    if (!orgId || !this.cabinetId) {
      this.computeStatsFromHooks();
      this.loading = false;
      this.createIcons();
      return;
    }
    this.keyVault.getHookStats(orgId, this.cabinetId).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res ?? {};
        this.stats = {
          totalHooks: data.totalHooks || data.hooks || this.hooks.length,
          keyHooked: data.keyHooked || data.keysOnHooks || 0,
          keyInUse: data.keyInUse || data.inUse || 0,
          available: data.available || data.availableHooks || 0,
          damaged: data.damaged || data.hookDamaged || 0,
        };
        this.loading = false;
        this.createIcons();
      },
      error: () => {
        this.computeStatsFromHooks();
        this.loading = false;
        this.createIcons();
      }
    });
  }

  private computeStatsFromHooks(): void {
    const keyHooked = this.allHooksRaw.filter(h => this.translateStatus(h).includes('Key Hooked')).length;
    const keyInUse = this.allHooksRaw.filter(h => this.translateStatus(h).includes('In Use')).length;
    const available = this.allHooksRaw.filter(h => this.translateStatus(h).includes('Available')).length;
    const damaged = this.allHooksRaw.filter(h => this.translateStatus(h).includes('Damaged')).length;
    this.stats = {
      totalHooks: this.allHooksRaw.length,
      keyHooked,
      keyInUse,
      available,
      damaged,
    };
  }

  private normalizeHookRow(h: any): HookRow {
    const hookNo = h.hookNo || h.number || h.hookNumber || 0;
    const status = this.translateStatus(h);
    const assignedKeyId = h.assignedKeyId || null;
    const assignedKeyName = h.assignedKeyName || h.keyName || '';
    return {
      no: String(hookNo).padStart(2, '0'),
      status: status,
      key: assignedKeyName || '-',
      keyId: assignedKeyId || '-',
      type: h.keyType || h.type || '-',
      updated: h.updatedAt || h.lastUpdated || '',
      by: h.updatedBy || h.lastUpdatedBy || 'System',
      hookId: h.id || String(hookNo),
    };
  }

  private normalizeGridHook(h: any): HookGridItem {
    const hookNo = h.hookNo || h.number || h.hookNumber || 0;
    const status = this.translateStatus(h);
    return {
      num: hookNo,
      used: status === 'Key Hooked' || status === 'Key In Use',
      damaged: status === 'Hook Damaged',
      id: h.id || String(hookNo),
    };
  }

  private translateStatus(h: any): string {
    const s = (h.status || '').toUpperCase();
    if (s === 'KEY_HOOKED' || s === 'KEYHOOKED') return 'Key Hooked';
    if (s === 'KEY_IN_USE' || s === 'KEYINUSE') return 'Key In Use';
    if (s === 'HOOK_DAMAGED' || s === 'HOOKDAMAGED') return 'Hook Damaged';
    if (s === 'AVAILABLE_FOR_KEY' || s === 'AVAILABLEFORKEY') return 'Available for Key';
    if (s === 'IN_USE') return 'Key In Use';
    if (s === 'DAMAGED') return 'Hook Damaged';
    if (s === 'AVAILABLE') return 'Available for Key';
    return 'Available for Key';
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
  }

  getHookBorder(hook: HookGridItem): string {
    if (hook.damaged) return 'border-t-red-500';
    if (hook.used) return 'border-t-blue-500';
    return 'border-t-emerald-500';
  }

  getHookBadge(hook: HookGridItem): string {
    if (hook.damaged) return 'bg-red-100 text-red-700';
    if (hook.used) return 'bg-blue-100 text-blue-700';
    return 'bg-emerald-100 text-emerald-700';
  }

  isHookDamaged(hook: HookGridItem): boolean {
    return hook.damaged;
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '—';
    const date = new Date(value);
    if (isNaN(date.getTime())) return String(value);
    const datePart = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const timePart = date.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' });
    return `${datePart}, ${timePart}`;
  }
}
