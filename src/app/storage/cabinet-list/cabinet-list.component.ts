import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { KeyVaultService } from '../../core/services/keyvault.service';
import { RichSelectComponent, RichSelectOption } from '../../shared/components/form/rich-select/rich-select.component';

interface CabinetRow {
  id: string;
  code: string;
  name: string;
  type: string;
  totalHooks: number;
  usedHooks: number;
  availHooks: number;
  status: string;
  updatedDate: string;
  updatedBy: string;
}

@Component({
  selector: 'app-cabinet-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, RichSelectComponent],
  templateUrl: './cabinet-list.component.html',
})
export class CabinetListComponent implements OnInit, AfterViewInit {
  cabinets: CabinetRow[] = [];
  loading = false;
  error = '';

  searchTerm = '';
  activeFilter = 'All Statuses';
  activeTypeFilter = 'All Types';

  statusFilterOptions: RichSelectOption[] = [
    { value: 'All Statuses', label: 'All Statuses' },
    { value: 'Active', label: 'Active' },
    { value: 'Full', label: 'Full' },
    { value: 'Inactive', label: 'Inactive' },
  ];

  get activeTypeFilterOptions(): RichSelectOption[] {
    return [{ value: 'All Types', label: 'All Types' }, ...this.uniqueTypes.map(t => ({ value: t, label: t }))];
  }

  constructor(private keyVault: KeyVaultService, private router: Router) {}

  ngOnInit(): void {
    this.loadCabinets();
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

  private loadCabinets(): void {
    this.loading = true;
    this.error = '';
    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id') || '';
    if (!orgId) {
      this.cabinets = [];
      this.loading = false;
      this.createIcons();
      return;
    }
    this.keyVault.listCabinets(orgId, { page: 0, size: 50 }).subscribe({
      next: (items: any[]) => {
        const normalized = items.map(c => this.normalizeCabinet(c));
        this.cabinets = normalized;
        this.loading = false;
        this.createIcons();
      },
      error: () => {
        this.cabinets = [];
        this.loading = false;
        this.createIcons();
      }
    });
  }

  private normalizeCabinet(c: any): CabinetRow {
    const totalHooks = c.numberOfHooks || c.totalHooks || c.hookCount || c.hooks || 0;
    const usedHooks = c.usedHooks || c.keysHooked || c.keysOnHooks || 0;
    const availHooks = c.availableHooks !== undefined ? c.availableHooks : (totalHooks - usedHooks);
    let status = c.status || 'ACTIVE';
    if (status === 'ACTIVE' || status === 'Active') {
      status = usedHooks >= totalHooks && totalHooks > 0 ? 'Full' : 'Active';
    } else if (status === 'INACTIVE' || status === 'Inactive') {
      status = 'Inactive';
    } else if (status === 'MAINTENANCE' || status === 'Under Maintenance') {
      status = 'Under Maintenance';
    }
    return {
      id: c.id || c.code || '',
      code: c.code || c.cabinetCode || '',
      name: c.name || c.cabinetName || '',
      type: c.cabinetType || c.type || '',
      totalHooks: totalHooks,
      usedHooks: usedHooks,
      availHooks: availHooks,
      status: status,
      updatedDate: c.updatedDate || c.updatedAt || c.lastUpdated || '',
      updatedBy: c.updatedBy || c.lastUpdatedBy || '',
    };
  }

  get filteredCabinets(): CabinetRow[] {
    const q = this.searchTerm.toLowerCase().trim();
    const statusFilter = this.activeFilter;
    const typeFilter = this.activeTypeFilter;
    return this.cabinets.filter(c => {
      const matchesSearch =
        (c.name || '').toLowerCase().includes(q) ||
        (c.code || '').toLowerCase().includes(q) ||
        (c.type || '').toLowerCase().includes(q) ||
        (c.updatedBy || '').toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === 'All Statuses' || c.status === statusFilter;
      const matchesType =
        typeFilter === 'All Types' || c.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }

  onSearch(): void {}

  onStatusFilterChange(): void {}

  onTypeFilterChange(): void {}

  get totalCabinets(): number {
    return this.cabinets.length;
  }

  get totalHooks(): number {
    return this.cabinets.reduce((sum, c) => sum + c.totalHooks, 0);
  }

  get usedHooks(): number {
    return this.cabinets.reduce((sum, c) => sum + c.usedHooks, 0);
  }

  get availHooks(): number {
    return this.cabinets.reduce((sum, c) => sum + c.availHooks, 0);
  }

  get uniqueTypes(): string[] {
    return [...new Set(this.cabinets.map(c => c.type).filter(t => !!t))];
  }

  get utilization(): number {
    if (this.totalHooks === 0) return 0;
    return Math.round((this.usedHooks / this.totalHooks) * 100);
  }

  get utilizationDashoffset(): number {
    const circumference = 2 * Math.PI * 15.5;
    return circumference - (this.utilization / 100) * circumference;
  }

  get circumference(): number {
    return 2 * Math.PI * 15.5;
  }

  cabinetStatusClass(status: string): string {
    if (status === 'Active') return 'bg-emerald-50 text-emerald-600';
    if (status === 'Full') return 'bg-rose-50 text-rose-500';
    if (status === 'Inactive') return 'bg-rose-50 text-rose-600';
    return 'bg-slate-100 text-slate-500';
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '—';
    const date = new Date(value);
    if (isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  viewCabinet(cabinet: CabinetRow): void {
    this.router.navigate(['/storage/locations/cabinets/view', cabinet.id]);
  }
}
