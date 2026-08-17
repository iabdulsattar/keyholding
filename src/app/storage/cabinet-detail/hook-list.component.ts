import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
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
  imports: [CommonModule, RouterModule, FormsModule],
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
  showAllHooks = false;

  activeTab = 'hooks';
  rows: HookRow[] = [];
  hooks: HookGridItem[] = [];
  stats: HookStats = { totalHooks: 0, keyHooked: 0, keyInUse: 0, available: 0, damaged: 0 };

  currentPage = 0;
  pageSize: number | 'All' = 10;
  pageSizeOptions: (number | 'All')[] = [10, 20, 50, 100, 'All'];
  totalPages = 0;
  totalItems = 0;

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
    this.showAllHooks = this.route.snapshot.queryParamMap.get('all') === 'true';
    this.loadCabinetDetails();
    this.loadHooks();
    if (this.showAllHooks) {
      this.loadAllHooksStats();
    }
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
    if (this.showAllHooks) {
      this.cabinet = null;
      return;
    }
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
    if (!orgId) {
      this.rows = [];
      this.hooks = [];
      this.stats = { totalHooks: 0, keyHooked: 0, keyInUse: 0, available: 0, damaged: 0 };
      this.loading = false;
      this.createIcons();
      return;
    }

    if (this.showAllHooks) {
      const effectivePageSize = this.pageSize === 'All' ? (this.totalItems || 200) : this.pageSize;
      this.keyVault.listAllCabinetHooks(orgId, { assigned: 'ALL', page: this.currentPage, size: effectivePageSize }).subscribe({
        next: (res: any) => {
          const payload = res?.data ?? res ?? {};
          const meta = res?.meta ?? {};
          this.allHooksRaw = payload.content ?? payload.items ?? payload.data ?? payload ?? [];
          this.rows = this.allHooksRaw.map(h => this.normalizeHookRow(h));
          this.hooks = this.allHooksRaw.map(h => this.normalizeGridHook(h));
          this.currentPage = Number(meta.page ?? meta.number ?? payload.page ?? payload.number ?? this.currentPage ?? 0);
          this.totalItems = Number(meta.totalElements ?? meta.total ?? payload.totalElements ?? payload.total ?? this.allHooksRaw.length);
          this.totalPages = Number(meta.totalPages ?? payload.totalPages ?? Math.max(1, Math.ceil(this.totalItems / effectivePageSize)));
          if (this.pageSize !== 'All') {
            this.pageSize = Number(meta.size ?? payload.size ?? this.pageSize);
          }
          this.loading = false;
          this.createIcons();
        },
        error: () => {
          this.rows = [];
          this.hooks = [];
          this.stats = { totalHooks: 0, keyHooked: 0, keyInUse: 0, available: 0, damaged: 0 };
          this.loading = false;
          this.createIcons();
        }
      });
      return;
    }

    if (!this.cabinetId) {
      this.rows = [];
      this.hooks = [];
      this.stats = { totalHooks: 0, keyHooked: 0, keyInUse: 0, available: 0, damaged: 0 };
      this.loading = false;
      this.createIcons();
      return;
    }

    const effectivePageSize = this.pageSize === 'All' ? (this.totalItems || 200) : this.pageSize;
    this.keyVault.listHooks(orgId, this.cabinetId, { page: this.currentPage, size: effectivePageSize }).subscribe({
      next: (res: any) => {
        const payload = res?.data ?? res ?? {};
        const meta = res?.meta ?? {};
        this.allHooksRaw = payload.content ?? payload.items ?? payload.data ?? payload ?? [];
        this.rows = this.allHooksRaw.map(h => this.normalizeHookRow(h));
        this.hooks = this.allHooksRaw.map(h => this.normalizeGridHook(h));
        this.currentPage = Number(meta.page ?? meta.number ?? payload.page ?? payload.number ?? this.currentPage ?? 0);
        this.totalItems = Number(meta.totalElements ?? meta.total ?? payload.totalElements ?? payload.total ?? this.allHooksRaw.length);
        this.totalPages = Number(meta.totalPages ?? payload.totalPages ?? Math.max(1, Math.ceil(this.totalItems / effectivePageSize)));
        if (this.pageSize !== 'All') {
          this.pageSize = Number(meta.size ?? payload.size ?? this.pageSize);
        }
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
    if (this.showAllHooks) {
      this.loading = false;
      this.createIcons();
      return;
    }
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id') || '';
    if (!orgId || !this.cabinetId) {
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
        this.loading = false;
        this.createIcons();
      }
    });
  }

  private loadAllHooksStats(): void {
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id') || '';
    if (!orgId) {
      this.stats = { totalHooks: 0, keyHooked: 0, keyInUse: 0, available: 0, damaged: 0 };
      this.loading = false;
      this.createIcons();
      return;
    }
    this.keyVault.getCabinetHooksStats(orgId).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res ?? {};
        this.stats = {
          totalHooks: data.totalHooks || data.hooks || 0,
          keyHooked: data.keyHooked || data.keysOnHooks || 0,
          keyInUse: data.keyInUse || data.inUse || 0,
          available: data.available || data.availableHooks || 0,
          damaged: data.damaged || data.hookDamaged || 0,
        };
        this.loading = false;
        this.createIcons();
      },
      error: () => {
        this.stats = { totalHooks: 0, keyHooked: 0, keyInUse: 0, available: 0, damaged: 0 };
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

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.loadHooks();
  }

  onPageSizeChange(): void {
    this.currentPage = 0;
    this.loadHooks();
  }

  get startIndex(): number {
    if (this.totalItems === 0) return 0;
    const size = this.pageSize === 'All' ? this.totalItems : this.pageSize;
    return this.currentPage * size + 1;
  }

  get endIndex(): number {
    if (this.totalItems === 0) return 0;
    const size = this.pageSize === 'All' ? this.totalItems : this.pageSize;
    return Math.min((this.currentPage + 1) * size, this.totalItems);
  }

  get visiblePages(): (number | '...')[] {
    const pages: (number | '...')[] = [];
    const total = this.totalPages;
    const current = this.currentPage;
    if (total <= 7) {
      for (let i = 0; i < total; i++) pages.push(i);
    } else {
      pages.push(0);
      if (current > 3) pages.push('...');
      const start = Math.max(1, current - 1);
      const end = Math.min(total - 2, current + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (current < total - 4) pages.push('...');
      pages.push(total - 1);
    }
    return pages;
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
