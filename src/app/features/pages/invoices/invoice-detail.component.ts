import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { InvoiceDetailResponse } from '../../../core/models/subscription.models';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './invoice-detail.component.html',
  styles: ''
})
export class InvoiceDetailComponent implements OnInit {
  invoice: any = null;
  loading = false;
  error = '';
  invoiceId: string | null = null;

  statusStyles: Record<string, string> = {
    Paid: 'bg-emerald-50 text-emerald-600',
    Pending: 'bg-amber-50 text-amber-600',
    Overdue: 'bg-red-50 text-red-600',
    Open: 'bg-blue-50 text-blue-600',
    Void: 'bg-slate-100 text-slate-600',
  };

  constructor(
    private route: ActivatedRoute,
    private subscriptionService: SubscriptionService
  ) {}

  ngOnInit(): void {
    this.invoiceId = this.route.snapshot.paramMap.get('invoiceId');
    if (this.invoiceId) {
      this.loadInvoiceDetail();
    } else {
      this.error = 'Invoice ID not provided.';
    }
  }

  private getOrgId(): string | null {
    return localStorage.getItem('organizationId') || localStorage.getItem('org_id');
  }

  loadInvoiceDetail(): void {
    this.loading = true;
    this.error = '';
    const orgId = this.getOrgId();
    if (!orgId || !this.invoiceId) {
      this.loading = false;
      this.error = 'Missing organization or invoice ID.';
      return;
    }

    this.subscriptionService.getInvoiceDetail(orgId, this.invoiceId).subscribe({
      next: (res: InvoiceDetailResponse) => {
        this.invoice = this.mapInvoice(res.invoice, res);
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Failed to load invoice detail', err);
        this.error = 'Failed to load invoice detail. Please try again.';
        this.loading = false;
      }
    });
  }

  private formatCurrency(cents: number | undefined, currency: string): string {
    if (cents == null) return '—';
    const amount = (cents / 100).toFixed(2);
    const symbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : `${currency} `;
    return `${symbol}${amount}`;
  }

  private formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  private mapInvoice(inv: any, res: InvoiceDetailResponse): any {
    const status = inv.status || 'Pending';
    const billingPeriod = inv.billingPeriod === 'ANNUAL' ? 'Annual' : 'Monthly';
    const desc = inv.planName ? `${inv.planName} (${billingPeriod})` : (inv.description || `${billingPeriod} subscription`);

    const subtotal = inv.subtotalCents ?? inv.amountCents ?? 0;
    const vat = inv.vatCents ?? 0;
    const total = inv.totalCents ?? subtotal + vat;
    const vatRate = inv.vatRateBps ?? (vat && subtotal ? Math.round((vat / subtotal) * 10000) : 0);
    const vatPercent = (vatRate / 100).toFixed(2);

    const billing = res.billingInfo || {};

    return {
      number: inv.invoiceNumber || '—',
      status: status,
      description: desc,
      date: this.formatDate(inv.createdAt),
      dueDate: this.formatDate(inv.dueDate),
      paymentDate: this.formatDate(inv.paidAt),
      plan: inv.planName || '—',
      unitPrice: this.formatCurrency(inv.amountCents, inv.currency),
      amount: this.formatCurrency(inv.amountCents, inv.currency),
      subtotal: this.formatCurrency(subtotal, inv.currency),
      vat: this.formatCurrency(vat, inv.currency),
      total: this.formatCurrency(total, inv.currency),
      companyName: billing.companyName || '—',
      billingEmail: billing.billingEmail || '—',
      billingAddress: [billing.billingAddress, billing.city, billing.postcode, billing.country].filter(Boolean).join(', ') || '—',
      billingCycle: billingPeriod,
      nextBillingDate: this.formatDate(inv.currentPeriodEnd || inv.endDate),
      paymentMethod: inv.paymentMethod || '—',
      planDetails: {
        name: inv.planName || '—',
        price: this.formatCurrency(inv.amountCents, inv.currency),
        period: `/${billingPeriod.toLowerCase()}`,
        description: desc,
        sites: (res.plan?.features as any)?.['max_sites'] ?? (res.plan?.features as any)?.['sites'] ?? '—',
        keys: (res.plan?.features as any)?.['max_keys'] ?? (res.plan?.features as any)?.['keys'] ?? '—',
        users: (res.plan?.features as any)?.['max_users'] ?? (res.plan?.features as any)?.['users'] ?? '—',
        jobs: (res.plan?.features as any)?.['max_jobs'] ?? (res.plan?.features as any)?.['jobs'] ?? '—',
        features: res.plan?.features ? Object.values(res.plan.features).join(', ') : '—',
      }
    };
  }
}
