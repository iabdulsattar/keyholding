import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { KeyVaultService } from '../../core/services/keyvault.service';

interface AvailableHook {
  no: string;
  status: string;
  hookId: string;
}

interface AvailableKey {
  id: string;
  code: string;
  name: string;
  type: string;
}

@Component({
  selector: 'app-assign-key-to-hook',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './assign-key-to-hook.component.html',
  styles: [`
    .scrollbar-thin::-webkit-scrollbar { height: 6px; width: 6px; }
    .scrollbar-thin::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 9999px; }
    @keyframes fadeIn { from { opacity: 0; transform: scale(.97); } to { opacity: 1; transform: scale(1); } }
    .animate-fade-in { animation: fadeIn .15s ease-out; }
  `],
})
export class AssignKeyToHookComponent implements OnInit, AfterViewInit {
  cabinetId = '';
  loading = true;

  cabinet: any = null;
  availableHooks: AvailableHook[] = [];
  availableKeys: AvailableKey[] = [];
  stats = { totalHooks: 0, keyHooked: 0, keyInUse: 0, available: 0, damaged: 0 };

  selectedHook: AvailableHook | null = null;
  selectedKey: AvailableKey | null = null;
  assignmentNote = '';
  noteCount = 0;
  isHookDropdownOpen = false;
  isKeyDropdownOpen = false;
  submitted = false;

  constructor(private route: ActivatedRoute, private router: Router, private keyVault: KeyVaultService) {}

  ngOnInit(): void {
    this.cabinetId = this.route.snapshot.paramMap.get('id') || '';
    this.loadCabinetDetails();
    this.loadAvailableHooks();
    this.loadAvailableKeys();
    this.loadHookStats();
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
        };
        this.createIcons();
      },
      error: () => {
        this.cabinet = null;
        this.createIcons();
      }
    });
  }

  private loadAvailableHooks(): void {
    const orgId = this.getOrgId();
    if (!orgId || !this.cabinetId) {
      this.availableHooks = [];
      this.loading = false;
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
        this.loading = false;
        this.createIcons();
      },
      error: () => {
        this.availableHooks = [];
        this.loading = false;
        this.createIcons();
      }
    });
  }

  private loadAvailableKeys(): void {
    const orgId = this.getOrgId();
    if (!orgId) {
      this.availableKeys = [];
      this.createIcons();
      return;
    }
    this.keyVault.listKeys(orgId, { status: 'IN_STORAGE', page: 0, size: 100 }).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res ?? {};
        const items = data.content ?? data.items ?? data.data ?? data ?? [];
        this.availableKeys = items.map((k: any) => ({
          id: k.id || '',
          code: k.code || k.keyCode || '',
          name: k.name || k.keyName || '',
          type: k.type || k.keyType || '',
        }));
        this.createIcons();
      },
      error: () => {
        this.availableKeys = [];
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
      },
      error: () => {
        this.stats = { totalHooks: 0, keyHooked: 0, keyInUse: 0, available: 0, damaged: 0 };
      }
    });
  }

  toggleHookDropdown(): void {
    this.isHookDropdownOpen = !this.isHookDropdownOpen;
  }

  selectHook(hook: AvailableHook): void {
    this.selectedHook = hook;
    this.isHookDropdownOpen = false;
  }

  toggleKeyDropdown(): void {
    this.isKeyDropdownOpen = !this.isKeyDropdownOpen;
  }

  selectKey(key: AvailableKey): void {
    this.selectedKey = key;
    this.isKeyDropdownOpen = false;
  }

  updateNoteCount(): void {
    this.noteCount = this.assignmentNote.length;
  }

  closeHookDropdown(): void {
    this.isHookDropdownOpen = false;
  }

  closeKeyDropdown(): void {
    this.isKeyDropdownOpen = false;
  }

  get hookInvalid(): boolean {
    return this.submitted && !this.selectedHook;
  }

  get keyInvalid(): boolean {
    return this.submitted && !this.selectedKey;
  }

  get formInvalid(): boolean {
    return !this.selectedHook || !this.selectedKey;
  }

  onCancel(): void {
    this.router.navigate(['/storage/locations/cabinets/view', this.cabinetId, 'hooks']);
  }

  onAssignKey(): void {
    this.submitted = true;
    if (this.formInvalid) return;
    if (!this.selectedHook || !this.selectedKey) return;
    const orgId = this.getOrgId();
    if (!orgId || !this.cabinetId) return;
    this.keyVault.assignKeyToHook(orgId, this.cabinetId, this.selectedHook.hookId, {
      keyId: this.selectedKey.id,
      note: this.assignmentNote || undefined,
    }).subscribe({
      next: () => {
        this.router.navigate(['/storage/locations/cabinets/view', this.cabinetId, 'hooks']);
      },
      error: () => {
        this.router.navigate(['/storage/locations/cabinets/view', this.cabinetId, 'hooks']);
      }
    });
  }
}
