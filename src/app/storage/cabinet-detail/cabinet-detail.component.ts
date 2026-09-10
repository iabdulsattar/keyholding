import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { KeyVaultService } from '../../core/services/keyvault.service';
import { DeactivateCabinetModalComponent } from './deactivate-cabinet-modal/deactivate-cabinet-modal.component';
import { ReactivateCabinetModalComponent } from './reactivate-cabinet-modal/reactivate-cabinet-modal.component';
import { AppChart } from '../../shared/components/charts/donut/chart.component';

interface Hook {
  num: number;
  used: boolean;
  status?: string;
  damaged?: boolean;
  keyName?: string;
  keyTypeName?: string;
  keyCode?: string;
  id?: string;
}

interface HookStats {
  totalHooks: number;
  keyHooked: number;
  keyInUse: number;
  available: number;
  damaged: number;
}

interface Cabinet {
  id: string;
  code: string;
  name: string;
  type: string;
  status: string;
  totalHooks: number;
  usedHooks: number;
  availHooks: number;
  storageLocation: string;
  floor: string;
  description: string;
  installedOn: string;
  installedBy: string;
  lastUpdated: string;
  lastUpdatedBy: string;
  responsiblePerson: string;
  cctvMonitored: boolean;
  alarmSystem: boolean;
  active: boolean;
}

@Component({
  selector: 'app-cabinet-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, DeactivateCabinetModalComponent, ReactivateCabinetModalComponent, AppChart],
  templateUrl: './cabinet-detail.component.html',
  styles: [`
    @keyframes fadeIn { from { opacity: 0; transform: scale(.97); } to { opacity: 1; transform: scale(1); } }
    .animate-fade-in { animation: fadeIn .15s ease-out; }
  `],
})
export class CabinetDetailComponent implements OnInit, AfterViewInit {
  cabinetId = '';
  cabinet: Cabinet | null = null;
  loading = true;
  error = '';
  activeTab = 'overview';

  isDeactivateModalOpen = false;
  isReactivateModalOpen = false;
  isMoreMenuOpen = false;
  rawHooks: any[] = [];
  keyStatisticsChart = { series: [0, 0, 0, 0], labels: ['In Storage', 'Issued', 'Overdue', 'Lost / Damaged'], colors: ['#2563eb', '#10b981', '#f59e0b', '#EF4444'] };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private keyVault: KeyVaultService
  ) {}

  ngOnInit(): void {
    this.cabinetId = this.route.snapshot.paramMap.get('id') || '';
    if (this.cabinetId) {
      this.loadCabinet();
    } else {
      this.loading = false;
      this.error = 'No cabinet ID provided.';
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

  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
  }

  private loadCabinet(): void {
    this.loading = true;
    this.error = '';
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id') || '';
    if (!orgId) {
      this.cabinet = null;
      this.loading = false;
      this.createIcons();
      return;
    }
    this.keyVault.getCabinet(orgId, this.cabinetId).subscribe({
      next: (res: any) => {
        const item = res?.data ?? res ?? {};
        this.rawHooks = item.hooks || [];
        const totalHooks = item.numberOfHooks || item.totalHooks || item.hookCount || this.rawHooks.length || 0;
        const usedHooks = this.rawHooks.length > 0
          ? this.rawHooks.filter((h: any) => h.status === 'KEY_HOOKED').length
          : (item.usedHooks || item.keysHooked || 0);
        const availHooks = totalHooks - usedHooks;
        let status = item.status || 'ACTIVE';
        const active = item.active !== undefined ? item.active : (status === 'Active' || status === 'ACTIVE');
        if (status === 'ACTIVE' || status === 'Active') status = 'Active';
        else if (status === 'INACTIVE' || status === 'Inactive') status = 'Inactive';
        else if (status === 'MAINTENANCE' || status === 'Under Maintenance') status = 'Under Maintenance';

        this.cabinet = {
          id: item.id || '',
          code: item.code || item.cabinetCode || '',
          name: item.name || item.cabinetName || '',
          type: item.cabinetType || item.type || '',
          status: status,
          totalHooks: totalHooks,
          usedHooks: usedHooks,
          availHooks: availHooks,
          storageLocation: item.storageLocationName || item.locationName || '',
          floor: item.floorArea || item.floor || '',
          description: item.description || '',
          installedOn: item.installedOn || item.installedDate || '',
          installedBy: item.installedBy || '',
          lastUpdated: item.updatedDate || item.updatedAt || '',
          lastUpdatedBy: item.updatedByUserName || item.updatedBy || item.lastUpdatedBy || '',
          responsiblePerson: item.responsiblePerson || '',
          cctvMonitored: item.cctvMonitored ?? false,
          alarmSystem: item.alarmSystem ?? false,
          active: active,
        };
        this.updateKeyStatisticsChart();
        this.loading = false;
        this.createIcons();
      },
      error: () => {
        this.cabinet = null;
        this.loading = false;
        this.createIcons();
      }
    });
  }

  private getFallbackCabinet(): Cabinet {
    return {
      id: '1',
      code: 'CAB-0001',
      name: 'Cabinet A - Main Floor',
      type: 'Standard',
      status: 'Active',
      totalHooks: 20,
      usedHooks: 14,
      availHooks: 6,
      storageLocation: 'Head Office Vault (LOC-0001)',
      floor: 'Main Floor',
      description: 'Primary key storage cabinet for main floor operations.',
      installedOn: '10 May 2024',
      installedBy: '',
      lastUpdated: '2024-05-15T11:20:00',
      lastUpdatedBy: 'Faiza Ahmed',
      responsiblePerson: '',
      cctvMonitored: true,
      alarmSystem: true,
      active: true,
    };
  }

  get hooks(): Hook[] {
    if (!this.cabinet) return [];
    if (this.rawHooks.length > 0) {
      return this.rawHooks.map((h: any) => ({
        num: h.hookNo || h.num || 0,
        used: h.status === 'KEY_HOOKED',
        status: h.status,
        keyName: h.keyName || '',
        keyTypeName: h.keyTypeName || '',
        keyCode: h.keyCode || '',
        id: h.id || '',
      }));
    }
    const usedSet = new Set<number>();
    for (let i = 1; i <= this.cabinet.usedHooks; i++) {
      usedSet.add(i);
    }
    return Array.from({ length: this.cabinet.totalHooks }, (_, i) => ({
      num: i + 1,
      used: usedSet.has(i + 1),
    }));
  }

  get donutSegments(): { label: string; value: number; color: string; dasharray: string; dashoffset: string; percentage: string }[] {
    if (!this.cabinet) return [];
    const total = this.cabinet.totalHooks || 0;
    if (total === 0) return [];

    const circumference = 2 * Math.PI * 40;
    const statusCounts: Record<string, number> = {};
    this.rawHooks.forEach((h: any) => {
      const status = h.status || 'UNKNOWN';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const inStorage = statusCounts['AVAILABLE_FOR_KEY'] ?? this.cabinet.availHooks ?? 0;
    const issued = statusCounts['KEY_HOOKED'] ?? this.cabinet.usedHooks ?? 0;
    const overdue = statusCounts['KEY_IN_USE'] ?? 0;
    const damaged = statusCounts['HOOK_DAMAGED'] ?? 0;

    const segments = [
      { label: 'In Storage', value: inStorage, color: '#2563eb' },
      { label: 'Issued', value: issued, color: '#10b981' },
      { label: 'Overdue', value: overdue, color: '#f59e0b' },
      { label: 'Lost / Damaged', value: damaged, color: '#EF4444' },
    ];

    let cumulative = 0;
    return segments.map(seg => {
      const fraction = seg.value / total;
      const dashLength = fraction * circumference;
      const offset = -cumulative;
      cumulative += dashLength;
      return {
        ...seg,
        dasharray: `${dashLength.toFixed(2)} ${circumference.toFixed(2)}`,
        dashoffset: offset.toFixed(2),
        percentage: (fraction * 100).toFixed(1),
      };
    });
   }

  updateKeyStatisticsChart(): void {
    if (!this.cabinet) return;
    const statusCounts: Record<string, number> = {};
    this.rawHooks.forEach((h: any) => {
      const status = h.status || 'UNKNOWN';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const inStorage = statusCounts['AVAILABLE_FOR_KEY'] ?? this.cabinet.availHooks ?? 0;
    const issued = statusCounts['KEY_HOOKED'] ?? this.cabinet.usedHooks ?? 0;
    const overdue = statusCounts['KEY_IN_USE'] ?? 0;
    const damaged = statusCounts['HOOK_DAMAGED'] ?? 0;

    this.keyStatisticsChart = {
      series: [inStorage, issued, overdue, damaged],
      labels: ['In Storage', 'Issued', 'Overdue', 'Lost / Damaged'],
      colors: ['#2563eb', '#10b981', '#f59e0b', '#EF4444'],
    };
  }

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

  onCabinetDeactivated(): void {
    if (this.cabinet) {
      this.cabinet.status = 'Inactive';
      this.cabinet.active = false;
    }
    this.isDeactivateModalOpen = false;
    this.createIcons();
  }

  onCabinetReactivated(): void {
    if (this.cabinet) {
      this.cabinet.status = 'Active';
      this.cabinet.active = true;
    }
    this.isReactivateModalOpen = false;
    this.createIcons();
  }

  toggleMoreMenu(): void {
    this.isMoreMenuOpen = !this.isMoreMenuOpen;
  }

  closeMoreMenu(): void {
    this.isMoreMenuOpen = false;
  }

  getOrgId(): string {
    return localStorage.getItem('organizationId') || localStorage.getItem('org_id') || '';
  }

  onBack(): void {
    this.router.navigate(['/storage/locations/cabinets']);
  }

  getStatusClass(status: string): string {
    if (status === 'Active') return 'bg-emerald-50 text-emerald-600';
    if (status === 'Inactive') return 'bg-rose-50 text-rose-600';
    if (status === 'Under Maintenance') return 'bg-amber-50 text-amber-600';
    return 'bg-slate-100 text-slate-600';
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
