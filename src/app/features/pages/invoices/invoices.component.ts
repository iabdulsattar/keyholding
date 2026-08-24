import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { Subscription, SubscriptionHistoryResponse } from '../../../core/models/subscription.models';

interface InvoiceRow {
  no: string;
  date: string;
  desc: string;
  amount: string;
  status: string;
}

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './invoices.component.html',
  styles: ''
})
export class InvoicesComponent implements OnInit {
  invoices: InvoiceRow[] = [];
  loading = false;
  error = '';
  searchQuery = '';
  statusFilter = 'All Status';

  statusStyles: Record<string, string> = {
    Paid: 'bg-emerald-50 text-emerald-600',
    Pending: 'bg-amber-50 text-amber-600',
    Overdue: 'bg-red-50 text-red-600',
  };

  constructor(private subscriptionService: SubscriptionService) {}

  ngOnInit(): void {
    this.loadInvoices();
  }

  get totalInvoices() { return this.invoices.length; }
  get paidInvoices() { return this.invoices.filter(i => i.status === 'Paid').length; }
  get pendingInvoices() { return this.invoices.filter(i => i.status === 'Pending').length; }
  get overdueInvoices() { return this.invoices.filter(i => i.status === 'Overdue').length; }

  get filteredInvoices(): InvoiceRow[] {
    let result = [...this.invoices];
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(inv =>
        inv.no.toLowerCase().includes(q) ||
        inv.desc.toLowerCase().includes(q)
      );
    }
    if (this.statusFilter && this.statusFilter !== 'All Status') {
      result = result.filter(inv => inv.status === this.statusFilter);
    }
    return result;
  }

  private getOrgId(): string | null {
    return localStorage.getItem('organizationId') || localStorage.getItem('org_id');
  }

  private getServiceCode(): string {
    return 'key-vault';
  }

  loadInvoices(): void {
    this.loading = true;
    this.error = '';
    const orgId = this.getOrgId();
    if (!orgId) {
      this.loading = false;
      this.error = 'No organization found.';
      return;
    }

    this.subscriptionService.getSubscriptionHistory(orgId, this.getServiceCode()).subscribe({
      next: (res: SubscriptionHistoryResponse) => {
        const subs = res?.subscriptions ?? [];
        this.invoices = subs.map((sub: Subscription) => this.mapSubscription(sub));
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Failed to load invoices', err);
        this.error = 'Failed to load invoices. Please try again.';
        this.loading = false;
      }
    });
  }

  private mapSubscription(sub: Subscription): InvoiceRow {
    const date = sub.startDate ? new Date(sub.startDate) : sub.createdAt ? new Date(sub.createdAt) : null;
    const dateStr = date ? date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

    const statusMap: Record<string, string> = {
      'ACTIVE': 'Paid',
      'TRIALING': 'Pending',
      'PENDING': 'Pending',
      'PAST_DUE': 'Overdue',
      'CANCELLED': 'Overdue',
      'INACTIVE': 'Overdue',
    };

    const invoiceStatus = statusMap[sub.status] || 'Pending';
    const billingPeriod = sub.billingPeriod === 'ANNUAL' ? 'Annual' : 'Monthly';
    const desc = sub.planName ? `${sub.planName} (${billingPeriod})` : `${billingPeriod} subscription`;

    const year = date ? date.getFullYear().toString() : '0000';
    const idPart = (sub.id || '').slice(0, 5).toUpperCase();

    return {
      no: `INV-${year}-${idPart}`,
      date: dateStr,
      desc: desc,
      amount: '—',
      status: invoiceStatus,
    };
  }
}
