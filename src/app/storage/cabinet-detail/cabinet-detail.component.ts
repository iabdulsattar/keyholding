import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { KeyVaultService } from '../../core/services/keyvault.service';

interface Hook {
  num: number;
  used: boolean;
  status?: string;
  damaged?: boolean;
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
  imports: [CommonModule, RouterModule],
  templateUrl: './cabinet-detail.component.html',
  styles: [`
    .donut {
      width: 88px; height: 88px; border-radius: 50%;
      background: conic-gradient(#2563eb 0% 71.4%, #16a34a 71.4% 92.8%, #f59e0b 92.8% 100%);
      display: flex; align-items: center; justify-content: center; position: relative; flex-shrink: 0;
    }
    .donut::after { content: ""; position: absolute; inset: 12px; background: #fff; border-radius: 50%; }
    .donut-label { position: relative; z-index: 1; text-align: center; }
    @keyframes fadeIn { from { opacity: 0; transform: scale(.97); } to { opacity: 1; transform: scale(1); } }
    .animate-fade-in { animation: fadeIn .15s ease-out; }
  `],
})
export class CabinetDetailComponent implements OnInit, AfterViewInit {
  cabinetId = '';
  cabinet: Cabinet | null = null;
  loading = true;
  error = '';

  isDeactivateModalOpen = false;
  isReactivateModalOpen = false;
  isMoreMenuOpen = false;

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
        const totalHooks = item.numberOfHooks || item.totalHooks || item.hookCount || item.hooks || 0;
        const usedHooks = item.usedHooks || item.keysHooked || 0;
        const availHooks = item.availableHooks !== undefined ? item.availableHooks : (totalHooks - usedHooks);
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
          lastUpdatedBy: item.updatedBy || item.lastUpdatedBy || '',
          responsiblePerson: item.responsiblePerson || '',
          cctvMonitored: item.cctvMonitored ?? false,
          alarmSystem: item.alarmSystem ?? false,
          active: active,
        };
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
    const usedSet = new Set<number>();
    for (let i = 1; i <= this.cabinet.usedHooks; i++) {
      usedSet.add(i);
    }
    return Array.from({ length: this.cabinet.totalHooks }, (_, i) => ({
      num: i + 1,
      used: usedSet.has(i + 1),
    }));
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

  toggleMoreMenu(): void {
    this.isMoreMenuOpen = !this.isMoreMenuOpen;
  }

  closeMoreMenu(): void {
    this.isMoreMenuOpen = false;
  }

  confirmDeactivate(): void {
    if (!this.cabinet) return;
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id') || '';
    if (!orgId) return;
    this.keyVault.deactivateCabinet(orgId, this.cabinet.id).subscribe({
      next: () => {
        this.cabinet!.status = 'Inactive';
        this.cabinet!.active = false;
        this.isDeactivateModalOpen = false;
        this.createIcons();
      },
      error: () => {
        this.isDeactivateModalOpen = false;
        this.createIcons();
      }
    });
  }

  confirmReactivate(): void {
    if (!this.cabinet) return;
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id') || '';
    if (!orgId) return;
    this.keyVault.reactivateCabinet(orgId, this.cabinet.id).subscribe({
      next: () => {
        this.cabinet!.status = 'Active';
        this.cabinet!.active = true;
        this.isReactivateModalOpen = false;
        this.createIcons();
      },
      error: () => {
        this.isReactivateModalOpen = false;
        this.createIcons();
      }
    });
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
