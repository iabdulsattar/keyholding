import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { InvoiceDetailResponse } from '../../../core/models/subscription.models';

@Component({
  selector: 'app-invoice-detail-two',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './invoice-detail-two.component.html',
  styles: ''
})
export class InvoiceDetailTwoComponent implements OnInit {
  invoice: any = null;
  loading = false;
  error = '';
  invoiceId: string | null = null;

  statusStyles: Record<string, string> = {
    Paid: 'bg-emerald-50 text-emerald-600',
    Pending: 'bg-amber-50 text-amber-600',
    Overdue: 'bg-red-50 text-red-600',
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
        this.invoice = this.mapInvoice(res.data);
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Failed to load invoice detail', err);
        this.error = 'Failed to load invoice detail. Please try again.';
        this.loading = false;
      }
    });
  }

  private mapInvoice(inv: any): any {
    const status = inv.paymentStatus || inv.status || 'Pending';
    const billingPeriod = inv.billingPeriod === 'ANNUAL' ? 'Annual' : 'Monthly';
    const desc = inv.planName ? `${inv.planName} (${billingPeriod})` : (inv.description || `${billingPeriod} subscription`);

    const subtotal = inv.subtotalCents ?? inv.amountCents ?? 0;
    const vat = inv.vatCents ?? 0;
    const total = inv.totalCents ?? subtotal + vat;

    const billing = inv.billing || {};
    const features = inv.planFeatures || {};
    const formatFeature = (val: any) => val === true ? 'Unlimited' : val === false ? '—' : (val ?? '—');

    return {
      number: inv.number || inv.invoiceNumber || '—',
      status: status,
      description: desc,
      date: this.formatDate(inv.invoiceDate || inv.createdAt),
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
      nextBillingDate: this.formatDate(inv.periodEnd || inv.endDate),
      paymentMethod: inv.paymentMethod || '—',
      planDetails: {
        name: inv.planName || '—',
        price: this.formatCurrency(inv.amountCents, inv.currency),
        period: `/${billingPeriod.toLowerCase()}`,
        description: desc,
        sites: formatFeature(features.max_sites === -1 ? 'Unlimited' : features.max_sites),
        keys: formatFeature(features.unlimited_keys ? 'Unlimited' : features.max_keys),
        users: formatFeature(features.max_users),
        jobs: formatFeature(features.max_jobs === -1 ? 'Unlimited' : features.max_jobs),
        features: Object.entries(features).some(([, val]) => val === -1)
          ? 'All Enterprise Features'
          : Object.entries(features)
              .filter(([key]) => !key.startsWith('extra_') && key !== 'unlimited_keys')
              .map(([, val]) => formatFeature(val))
              .join(', ') || '—',
      }
    };
  }
}
