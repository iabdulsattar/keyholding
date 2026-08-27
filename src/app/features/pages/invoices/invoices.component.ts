import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { Invoice, InvoiceListResponse } from '../../../core/models/subscription.models';

interface InvoiceRow {
  id: string;
  no: string;
  date: string;
  desc: string;
  amount: string;
  status: string;
  paymentStatus?: string;
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
  dateFrom = '';
  dateTo = '';

  statusStyles: Record<string, string> = {
    Paid: 'bg-emerald-50 text-emerald-600',
    Pending: 'bg-amber-50 text-amber-600',
    Overdue: 'bg-red-50 text-red-600',
    Open: 'bg-blue-50 text-blue-600',
    Void: 'bg-slate-100 text-slate-600',
  };

  constructor(private subscriptionService: SubscriptionService) {}

  ngOnInit(): void {
    this.loadInvoices();
  }

  get totalInvoices() { return this.invoices.length; }
  get paidInvoices() { return this.invoices.filter(i => i.status === 'Paid').length; }
  get pendingInvoices() { return this.invoices.filter(i => i.status === 'Pending' || i.status === 'Open').length; }
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

  private mapStatusToApi(status: string): { status?: string; paymentStatus?: string } {
    switch (status) {
      case 'Paid':
        return { paymentStatus: 'PAID' };
      case 'Pending':
        return { paymentStatus: 'PENDING' };
      case 'Overdue':
        return { paymentStatus: 'OVERDUE' };
      case 'Void':
        return { status: 'VOID' };
      default:
        return {};
    }
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

    const apiStatus = this.mapStatusToApi(this.statusFilter);
    this.subscriptionService.listInvoices(orgId, this.getServiceCode(), {
      from: this.dateFrom ? `${this.dateFrom}T00:00:00Z` : undefined,
      to: this.dateTo ? `${this.dateTo}T23:59:59Z` : undefined,
      status: apiStatus.status,
      paymentStatus: apiStatus.paymentStatus,
      q: this.searchQuery || undefined,
      page: 0,
      size: 20,
    }).subscribe({
      next: (res: InvoiceListResponse) => {
        this.invoices = (res?.data ?? []).map((inv: Invoice) => this.mapInvoice(inv));
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Failed to load invoices', err);
        this.error = 'Failed to load invoices. Please try again.';
        this.loading = false;
      }
    });
  }

  private mapInvoice(inv: Invoice): InvoiceRow {
    const date = inv.createdAt ? new Date(inv.createdAt) : null;
    const dateStr = date ? date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

    const amount = inv.amountCents != null
      ? `${(inv.amountCents / 100).toFixed(2)} ${inv.currency || 'GBP'}`
      : '—';

    const invoiceStatus = inv.paymentStatus === 'PAID' ? 'Paid' : inv.paymentStatus === 'PENDING' ? 'Pending' : inv.paymentStatus === 'OVERDUE' ? 'Overdue' : (inv.status || 'Pending');

    return {
      id: inv.id,
      no: inv.number || `INV-${date ? date.getFullYear() : '0000'}-${(inv.id || '').slice(0, 5).toUpperCase()}`,
      date: dateStr,
      desc: inv.subscriptionId ? `Subscription ${inv.subscriptionId.slice(0, 8)}` : 'Subscription invoice',
      amount: amount,
      status: invoiceStatus,
      paymentStatus: inv.paymentStatus,
    };
  }

  viewInvoice(invoiceId: string): void {
    // router navigation handled in template via [routerLink]
  }
}
