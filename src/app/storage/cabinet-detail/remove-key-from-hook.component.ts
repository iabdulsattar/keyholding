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

@Component({
  selector: 'app-remove-key-from-hook',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './remove-key-from-hook.component.html',
  styles: [`
    .scrollbar-thin::-webkit-scrollbar { height: 6px; width: 6px; }
    .scrollbar-thin::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 9999px; }
    @keyframes fadeIn { from { opacity: 0; transform: scale(.97); } to { opacity: 1; transform: scale(1); } }
    .animate-fade-in { animation: fadeIn .15s ease-out; }
  `],
})
export class RemoveKeyFromHookComponent implements OnInit, AfterViewInit {
  cabinetId = '';
  hookId = '';
  loading = true;
  submitting = false;

  cabinet: any = null;
  hook: HookDetail | null = null;
  stats = { totalHooks: 0, keyHooked: 0, keyInUse: 0, available: 0, damaged: 0 };

  removalReason = '';
  removalNote = '';
  noteCount = 0;
  submitted = false;

  constructor(private route: ActivatedRoute, private router: Router, private keyVault: KeyVaultService) {}

  ngOnInit(): void {
    this.cabinetId = this.route.snapshot.paramMap.get('id') || '';
    this.hookId = this.route.snapshot.paramMap.get('hookId') || '';
    if (this.cabinetId && this.hookId) {
      this.loadCabinetDetails();
      this.loadHookDetails();
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
      this.cabinet = this.getFallbackCabinet();
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
          totalHooks: item.numberOfHooks || item.totalHooks || 20,
          usedHooks: item.usedHooks || 0,
          availableHooks: item.availableHooks || 0,
          storageLocation: item.storageLocationName || item.locationName || '',
          floor: item.floorArea || item.floor || '',
        };
        this.createIcons();
      },
      error: () => {
        this.cabinet = this.getFallbackCabinet();
        this.createIcons();
      }
    });
  }

  private loadHookDetails(): void {
    const orgId = this.getOrgId();
    if (!orgId || !this.cabinetId || !this.hookId) {
      this.hook = this.getFallbackHook();
      this.loading = false;
      this.createIcons();
      return;
    }
    this.keyVault.getHook(orgId, this.cabinetId, this.hookId).subscribe({
      next: (res: any) => {
        const item = res?.data ?? res ?? {};
        const hookNo = item.hookNo || item.number || item.hookNumber || 0;
        this.hook = {
          id: item.id || this.hookId,
          hookNo: hookNo,
          status: item.status || 'KEY_HOOKED',
          assignedKeyId: item.assignedKeyId || item.keyId || '',
          assignedKeyName: item.assignedKeyName || item.keyName || 'KEY-0004',
          keyType: item.keyType || item.type || 'Yale',
          assignedAt: item.assignedAt || item.updatedAt || '2024-05-15T11:10:00',
          assignedBy: item.assignedBy || item.updatedBy || 'Faiza Ahmed',
        };
        this.loading = false;
        this.createIcons();
      },
      error: () => {
        this.hook = this.getFallbackHook();
        this.loading = false;
        this.createIcons();
      }
    });
  }

  private loadHookStats(): void {
    const orgId = this.getOrgId();
    if (!orgId || !this.cabinetId) {
      this.setFallbackStats();
      return;
    }
    this.keyVault.getHookStats(orgId, this.cabinetId).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res ?? {};
        this.stats = {
          totalHooks: data.totalHooks || data.hooks || 20,
          keyHooked: data.keyHooked || data.keysOnHooks || 10,
          keyInUse: data.keyInUse || data.inUse || 4,
          available: data.available || data.availableHooks || 5,
          damaged: data.damaged || data.hookDamaged || 1,
        };
        this.createIcons();
      },
      error: () => {
        this.setFallbackStats();
        this.createIcons();
      }
    });
  }

  private setFallbackStats(): void {
    this.stats = { totalHooks: 20, keyHooked: 10, keyInUse: 4, available: 5, damaged: 1 };
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

  private getFallbackHook(): HookDetail {
    return {
      id: this.hookId,
      hookNo: 8,
      status: 'KEY_HOOKED',
      assignedKeyId: '',
      assignedKeyName: 'KEY-0004',
      keyType: 'Yale',
      assignedAt: '2024-05-15T11:10:00',
      assignedBy: 'Faiza Ahmed',
    };
  }

  get hookNoDisplay(): string {
    if (!this.hook) return '--';
    return String(this.hook.hookNo).padStart(2, '0');
  }

  get hookStatusDisplay(): string {
    if (!this.hook) return '--';
    const s = this.hook.status.toUpperCase();
    if (s === 'KEY_HOOKED' || s === 'KEYHOOKED') return 'Key Hooked';
    if (s === 'KEY_IN_USE' || s === 'KEYINUSE') return 'Key In Use';
    if (s === 'AVAILABLE_FOR_KEY' || s === 'AVAILABLEFORKEY') return 'Available for Key';
    if (s === 'HOOK_DAMAGED' || s === 'HOOKDAMAGED') return 'Hook Damaged';
    return 'Key Hooked';
  }

  get reasonInvalid(): boolean {
    return this.submitted && !this.removalReason;
  }

  get formInvalid(): boolean {
    return !this.removalReason;
  }

  updateNoteCount(): void {
    this.noteCount = this.removalNote.length;
  }

  onCancel(): void {
    this.router.navigate(['/storage/locations/cabinets/view', this.cabinetId, 'hooks']);
  }

  onRemoveKey(): void {
    this.submitted = true;
    if (this.formInvalid) return;
    if (!this.hook) return;

    const orgId = this.getOrgId();
    if (!orgId || !this.cabinetId || !this.hookId) return;

    this.submitting = true;
    this.keyVault.removeKeyFromHook(orgId, this.cabinetId, this.hookId, {
      reason: this.removalReason,
      note: this.removalNote || undefined,
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
