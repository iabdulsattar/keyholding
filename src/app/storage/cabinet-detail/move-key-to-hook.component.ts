import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { KeyVaultService } from '../../core/services/keyvault.service';

interface HookDetail {
  id: string;
  hookNo: number;
  status: string;
  assignedKeyId?: string;
  assignedKeyName?: string;
  keyType?: string;
  assignedAt?: string;
  assignedBy?: string;
}

interface AvailableHook {
  no: string;
  status: string;
  hookId: string;
}

@Component({
  selector: 'app-move-key-to-hook',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './move-key-to-hook.component.html',
  styles: [`
    .scrollbar-thin::-webkit-scrollbar { height: 6px; width: 6px; }
    .scrollbar-thin::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 9999px; }
    @keyframes fadeIn { from { opacity: 0; transform: scale(.97); } to { opacity: 1; transform: scale(1); } }
    .animate-fade-in { animation: fadeIn .15s ease-out; }
  `],
})
export class MoveKeyToHookComponent implements OnInit, AfterViewInit {
  cabinetId = '';
  hookId = '';
  loading = true;
  submitting = false;

  cabinet: any = null;
  currentHook: HookDetail | null = null;
  availableHooks: AvailableHook[] = [];
  stats = { totalHooks: 0, keyHooked: 0, keyInUse: 0, available: 0, damaged: 0 };

  selectedNewHookId = '';
  moveNote = '';
  noteCount = 0;
  submitted = false;
  isHookDropdownOpen = false;

  constructor(private route: ActivatedRoute, private router: Router, private keyVault: KeyVaultService) {}

  ngOnInit(): void {
    this.cabinetId = this.route.parent?.snapshot.paramMap.get('id') || '';
    this.hookId = this.route.snapshot.paramMap.get('hookId') || '';
    if (this.cabinetId && this.hookId) {
      this.loadCabinetDetails();
      this.loadCurrentHook();
      this.loadAvailableHooks();
      this.loadHookStats();
    } else {
      this.loading = false;
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

  private getOrgId(): string {
    return localStorage.getItem('organizationId') || localStorage.getItem('org_id') || '';
  }

  private loadCabinetDetails(): void {
    const orgId = this.getOrgId();
    if (!orgId || !this.cabinetId) {
      this.loading = false;
      this.createIcons();
      return;
    }
    this.keyVault.getCabinet(orgId, this.cabinetId).subscribe({
      next: (res: any) => {
        const item = res?.data ?? res ?? {};
        this.cabinet = {
          id: item.id || '',
          code: item.code || item.cabinetCode || '',
          name: item.name || item.cabinetName || '',
          type: item.cabinetType || item.type || '',
          status: item.status || 'Active',
          totalHooks: item.numberOfHooks || item.totalHooks || 0,
          usedHooks: item.usedHooks || 0,
          availableHooks: item.availableHooks || 0,
          storageLocation: item.storageLocationName || item.locationName || '',
          floor: item.floorArea || item.floor || '',
        };
        this.createIcons();
      },
      error: () => {
        this.cabinet = null;
        this.createIcons();
      }
    });
  }

  private loadCurrentHook(): void {
    const orgId = this.getOrgId();
    if (!orgId || !this.cabinetId || !this.hookId) {
      this.currentHook = null;
      this.loading = false;
      this.createIcons();
      return;
    }
    this.keyVault.getHook(orgId, this.cabinetId, this.hookId).subscribe({
      next: (res: any) => {
        const item = res?.data ?? res ?? {};
        const hookNo = item.hookNo || item.number || item.hookNumber || 0;
        this.currentHook = {
          id: item.id || this.hookId,
          hookNo: hookNo,
          status: item.status || 'KEY_HOOKED',
          assignedKeyId: item.assignedKeyId || item.keyId || '',
          assignedKeyName: item.assignedKeyName || item.keyName || '',
          keyType: item.keyType || item.type || '',
          assignedAt: item.assignedAt || item.updatedAt || '',
          assignedBy: item.assignedBy || item.updatedBy || '',
        };
        this.loading = false;
        this.createIcons();
      },
      error: () => {
        this.currentHook = null;
        this.loading = false;
        this.createIcons();
      }
    });
  }

  private loadAvailableHooks(): void {
    const orgId = this.getOrgId();
    if (!orgId || !this.cabinetId) {
      this.availableHooks = [];
      this.createIcons();
      return;
    }
    this.keyVault.listHooks(orgId, this.cabinetId, { assigned: 'UNASSIGNED', page: 0, size: 100 }).subscribe({
      next: (hooks: any[]) => {
        this.availableHooks = (hooks || []).map(h => {
          const hookNo = h.hookNo || h.number || 0;
          return {
            no: String(hookNo).padStart(2, '0'),
            status: 'Available for Key',
            hookId: h.id || String(hookNo),
          };
        });
        this.createIcons();
      },
      error: () => {
        this.availableHooks = [];
        this.createIcons();
      }
    });
  }

  private loadHookStats(): void {
    const orgId = this.getOrgId();
    if (!orgId || !this.cabinetId) {
      this.stats = { totalHooks: 0, keyHooked: 0, keyInUse: 0, available: 0, damaged: 0 };
      return;
    }
    this.keyVault.getHookStats(orgId, this.cabinetId).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res ?? {};
        this.stats = {
          totalHooks: data.totalHooks || data.hooks || 0,
          keyHooked: data.keyHooked || data.keysOnHooks || 0,
          keyInUse: data.keyInUse || data.inUse || 0,
          available: data.available || data.availableHooks || 0,
          damaged: data.damaged || data.hookDamaged || 0,
        };
        this.createIcons();
      },
      error: () => {
        this.stats = { totalHooks: 0, keyHooked: 0, keyInUse: 0, available: 0, damaged: 0 };
        this.createIcons();
      }
    });
  }

  get currentHookNoDisplay(): string {
    if (!this.currentHook) return '--';
    return String(this.currentHook.hookNo).padStart(2, '0');
  }

  get currentHookStatusDisplay(): string {
    if (!this.currentHook) return '--';
    const s = this.currentHook.status.toUpperCase();
    if (s === 'KEY_HOOKED' || s === 'KEYHOOKED') return 'Key Hooked';
    if (s === 'KEY_IN_USE' || s === 'KEYINUSE') return 'Key In Use';
    if (s === 'AVAILABLE_FOR_KEY' || s === 'AVAILABLEFORKEY') return 'Available for Key';
    if (s === 'HOOK_DAMAGED' || s === 'HOOKDAMAGED') return 'Hook Damaged';
    return 'Key Hooked';
  }

  get newHookInvalid(): boolean {
    return this.submitted && !this.selectedNewHookId;
  }

  get formInvalid(): boolean {
    return !this.selectedNewHookId;
  }

  updateNoteCount(): void {
    this.noteCount = this.moveNote.length;
  }

  toggleHookDropdown(): void {
    this.isHookDropdownOpen = !this.isHookDropdownOpen;
  }

  selectHook(hook: AvailableHook): void {
    this.selectedNewHookId = hook.hookId;
    this.isHookDropdownOpen = false;
  }

  onCancel(): void {
    this.router.navigate(['/storage/locations/cabinets/view', this.cabinetId, 'hooks']);
  }

  onMoveKey(): void {
    this.submitted = true;
    if (this.formInvalid) return;
    if (!this.currentHook) return;

    const orgId = this.getOrgId();
    if (!orgId || !this.cabinetId || !this.hookId) return;

    this.submitting = true;
    this.keyVault.moveKeyToHook(orgId, this.cabinetId, this.hookId, {
      targetHookId: this.selectedNewHookId,
      note: this.moveNote || undefined,
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.createIcons();
        this.router.navigate(['/storage/locations/cabinets/view', this.cabinetId, 'hooks']);
      },
      error: () => {
        this.submitting = false;
        this.createIcons();
      }
    });
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '—';
    const date = new Date(value);
    if (isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
