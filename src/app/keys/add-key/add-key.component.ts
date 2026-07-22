import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { KeyVaultService } from '../../core/services/keyvault.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-add-key',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './add-key.component.html',
  styles: `
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
    select { appearance: none; background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 1rem center; background-size: 1rem; }
  `
})
export class AddKeyComponent implements OnInit {
  keyName = '';
  keyId = '';
  keyType = '';
  keyCategory = '';
  keyNotes = '';
  assignClient = 'Metro Security Services';
  assignSite = '';
  storageLocation = '';
  keyBrand = '';
  keyModel = '';
  keyColour = '';
  keyTag = '';
  keyStatus = 'In Storage';
  fileName = '';

  private clientId = '';

  constructor(private route: ActivatedRoute, private router: Router, private keyVault: KeyVaultService, private toast: ToastService) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.clientId = params['clientId'] || '';
    });
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.fileName = input.files[0].name;
    }
  }

  resetForm(): void {
    if (confirm('Are you sure you want to clear your changes?')) {
      this.keyName = '';
      this.keyId = '';
      this.keyType = '';
      this.keyCategory = '';
      this.keyNotes = '';
      this.assignClient = 'Metro Security Services';
      this.assignSite = '';
      this.storageLocation = '';
      this.keyBrand = '';
      this.keyModel = '';
      this.keyColour = '';
      this.keyTag = '';
      this.keyStatus = 'In Storage';
      this.fileName = '';
    }
  }

  submitKeyForm(): void {
    const statusMap: Record<string, string> = {
      'In Storage': 'IN_STORAGE',
      'Issued': 'ISSUED',
      'In Use': 'IN_USE',
      'Overdue': 'OVERDUE',
      'Lost / Damaged': 'LOST',
    };

    const key: any = {
      name: this.keyName,
      code: this.keyId,
      type: this.keyType,
      category: this.keyCategory,
      clientId: this.assignClient,
      siteId: this.assignSite,
      storageLocation: this.storageLocation,
      brand: this.keyBrand,
      model: this.keyModel,
      colour: this.keyColour,
      tag: this.keyTag,
      status: statusMap[this.keyStatus] || 'IN_STORAGE',
      notes: this.keyNotes,
    };

    if (!this.clientId) {
      alert('Missing client context. Please add this key from a client page.');
      return;
    }

    const orgId = localStorage.getItem('organizationId') || localStorage.getItem('org_id');
    if (!orgId) {
      alert('Missing organization context. Please sign in again.');
      return;
    }

    this.keyVault.createKey(orgId, key).subscribe({
      next: () => {
        this.toast.success('Key saved successfully!');
        setTimeout(() => this.router.navigate(['/clients', this.clientId]), 800);
      },
      error: () => {
        this.toast.error('Failed to save key. Please try again.');
      }
    });
  }

  get showPreview(): boolean {
    return !!(this.keyName || this.keyId || this.keyType || this.keyCategory || this.assignSite || this.storageLocation);
  }

  get statusClass(): string {
    const map: Record<string, string> = {
      'In Storage': 'bg-emerald-50 text-emerald-600',
      'Issued': 'bg-amber-50 text-amber-600',
      'In Use': 'bg-blue-50 text-blue-600',
      'Overdue': 'bg-purple-50 text-purple-600',
      'Lost / Damaged': 'bg-rose-50 text-rose-600'
    };
    return map[this.keyStatus] || 'bg-slate-100 text-slate-600';
  }
}
