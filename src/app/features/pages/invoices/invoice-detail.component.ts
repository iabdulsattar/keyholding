import { Component, OnInit } from '@angular/core';
import { getTimezoneOptions } from '../../../core/utils/date.utils';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { InvoiceDetailResponse } from '../../../core/models/subscription.models';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
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
    private subscriptionService: SubscriptionService,
    private toast: ToastService
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
    const remember = localStorage.getItem('remember_device');
    if (remember === 'true') {
      return localStorage.getItem('org_id') || localStorage.getItem('organizationId') || null;
    }
    return sessionStorage.getItem('org_id') || sessionStorage.getItem('organizationId')
      || localStorage.getItem('org_id') || localStorage.getItem('organizationId') || null;
  }

  loadInvoiceDetail(): void {
    this.loading = true;
    this.error = '';
    this.invoice = null;
    const orgId = this.getOrgId();
    if (!orgId || !this.invoiceId) {
      this.loading = false;
      this.error = 'Missing organization or invoice ID.';
      return;
    }

    this.subscriptionService.getInvoiceDetail(orgId, this.invoiceId).subscribe({
      next: (res: InvoiceDetailResponse) => {
        const raw = res?.data ?? (res as any);
        if (!raw) {
          this.loading = false;
          this.error = 'Invoice not found.';
          return;
        }
        this.invoice = this.mapInvoice(raw);
        this.loading = false;
        // The invoice payload carries no billing snapshot (`billing` is null), so
        // the organisation's billing profile fills those fields.
        if (!this.invoice.hasBilling) this.loadBillingFallback(orgId);
      },
      error: (err: any) => {
        console.error('Failed to load invoice detail', err);
        this.error = 'Failed to load invoice detail. Please try again.';
        this.loading = false;
      }
    });
  }

  /** Fills the billing card from the billing profile when the invoice has none. */
  private loadBillingFallback(orgId: string): void {
    this.subscriptionService.getBillingInfo(orgId).subscribe({
      next: (res: any) => {
        const profile = res?.data ?? res ?? {};
        if (!this.invoice) return;
        const address = [profile.billingAddress, profile.city, profile.postcode, profile.country]
          .filter(Boolean)
          .join(', ');
        this.invoice = {
          ...this.invoice,
          companyName: this.invoice.companyName === '—' ? (profile.companyName || '—') : this.invoice.companyName,
          billingEmail: this.invoice.billingEmail === '—' ? (profile.billingEmail || '—') : this.invoice.billingEmail,
          billingAddress: this.invoice.billingAddress === '—' ? (address || '—') : this.invoice.billingAddress,
        };
      },
      error: () => { }
    });
  }

  /** Billing form state, opened from the Billing Information card. */
  showBillingEdit = false;
  billingLoading = false;
  billingSaving = false;
  billingError = '';
  billingForm = {
    companyName: '',
    billingEmail: '',
    billingAddress: '',
    city: '',
    postcode: '',
    country: '',
    vatNumber: '',
  };

  openBillingEdit(): void {
    const orgId = this.getOrgId();
    if (!orgId) {
      this.toast.error('Organization not found.');
      return;
    }

    this.showBillingEdit = true;
    this.billingError = '';
    this.billingLoading = true;

    this.subscriptionService.getBillingInfo(orgId).subscribe({
      next: (res: any) => {
        this.billingLoading = false;
        const profile = res?.profile ?? res?.data ?? res ?? {};
        this.billingForm = {
          companyName: profile.companyName || '',
          billingEmail: profile.billingEmail || profile.email || '',
          billingAddress: profile.billingAddress || profile.address || '',
          city: profile.city || '',
          postcode: profile.postcode || '',
          country: profile.country || '',
          vatNumber: profile.vatNumber || profile.vatTaxNumber || '',
        };
      },
      error: () => {
        this.billingLoading = false;
        this.billingError = 'Failed to load billing information.';
      }
    });
  }

  closeBillingEdit(): void {
    if (this.billingSaving) return;
    this.showBillingEdit = false;
    this.billingError = '';
  }

  /** Saves through PUT /billing-info, then refreshes the card on the page. */
  saveBillingInfo(): void {
    if (this.billingSaving) return;
    const orgId = this.getOrgId();
    if (!orgId) {
      this.billingError = 'Organization not found.';
      return;
    }

    if (!this.billingForm.companyName.trim()) {
      this.billingError = 'Company name is required.';
      return;
    }
    if (this.billingForm.billingEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.billingForm.billingEmail.trim())) {
      this.billingError = 'Enter a valid billing email address.';
      return;
    }

    this.billingSaving = true;
    this.billingError = '';

    this.subscriptionService.saveBillingInfo(orgId, {
      companyName: this.billingForm.companyName.trim(),
      billingEmail: this.billingForm.billingEmail.trim() || undefined,
      billingAddress: this.billingForm.billingAddress.trim() || undefined,
      city: this.billingForm.city.trim() || undefined,
      postcode: this.billingForm.postcode.trim() || undefined,
      country: this.billingForm.country.trim() || undefined,
      vatNumber: this.billingForm.vatNumber.trim() || undefined,
    }).subscribe({
      next: () => {
        this.billingSaving = false;
        this.showBillingEdit = false;
        this.toast.success('Billing information updated.');
        this.applyBillingToInvoice();
      },
      error: (err: any) => {
        this.billingSaving = false;
        this.billingError = err?.error?.message || 'Failed to update billing information.';
      }
    });
  }

  /** Reflects the saved values on the card without another invoice fetch. */
  private applyBillingToInvoice(): void {
    if (!this.invoice) return;
    const address = [this.billingForm.billingAddress, this.billingForm.city, this.billingForm.postcode, this.billingForm.country]
      .filter(Boolean)
      .join(', ');
    this.invoice = {
      ...this.invoice,
      companyName: this.billingForm.companyName.trim() || '—',
      billingEmail: this.billingForm.billingEmail.trim() || '—',
      billingAddress: address || '—',
    };
  }

  private formatCurrency(cents: number | undefined | null, currency: string): string {
    if (cents == null) return '—';
    const amount = (cents / 100).toFixed(2);
    const symbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : `${currency} `;
    return `${symbol}${amount}`;
  }

  private formatDate(dateStr: string | undefined | null): string {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-GB', getTimezoneOptions({ day: 'numeric', month: 'short', year: 'numeric' }));
  }

  /** `PAID` / `PENDING` / `OVERDUE` / `VOID` become display labels. */
  private toDisplayStatus(status: any): string {
    const value = String(status ?? '').trim().toUpperCase();
    if (value === 'PAID' || value === 'SETTLED') return 'Paid';
    if (value === 'PENDING') return 'Pending';
    if (value === 'OVERDUE') return 'Overdue';
    if (value === 'OPEN' || value === 'UNPAID') return 'Open';
    if (value === 'VOID' || value === 'CANCELLED' || value === 'CANCELED') return 'Void';
    return value ? value.charAt(0) + value.slice(1).toLowerCase() : 'Pending';
  }

  private mapInvoice(inv: any): any {
    const billing = inv.billing ?? {};
    const currency = inv.currency || 'GBP';
    const billingPeriod = inv.billingPeriod === 'ANNUAL' ? 'Annual' : 'Monthly';
    const planName = inv.planName || '-';
    const desc = inv.description || (planName !== '—' ? `${planName} (${billingPeriod})` : `${billingPeriod} subscription`);

    const subtotal = inv.subtotalCents ?? inv.amountCents ?? 0;
    const vat = inv.vatCents ?? 0;
    const total = inv.totalCents ?? subtotal + vat;
    const vatRate = inv.vatRateBps ?? (vat && subtotal ? Math.round((vat / subtotal) * 10000) : 0);
    const vatPercent = vatRate ? (vatRate / 100).toFixed(vatRate % 100 === 0 ? 0 : 2) : '0';

    const features = inv.planFeatures ?? {};
    const formatFeature = (val: any) => val === true ? 'Unlimited' : val === false ? '—' : (val ?? '—');
    const serviceLabel = inv.serviceCode ? String(inv.serviceCode).replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) : 'Subscription';

    const displayStatus = this.toDisplayStatus(inv.paymentStatus || inv.status);
    const rawStatus = String(inv.paymentStatus || inv.status || '').trim().toUpperCase();
    // Anything not settled can still be paid, whatever the API calls the
    // intermediate states (PENDING, OPEN, UNPAID, DUE).
    const isSettled = rawStatus === 'PAID' || rawStatus === 'SETTLED' || rawStatus === 'VOID'
      || rawStatus === 'CANCELLED' || rawStatus === 'CANCELED';

    return {
      number: inv.number || inv.invoiceNumber || '—',
      status: displayStatus,
      // Only an unsettled invoice offers the Pay Now action.
      isPending: !isSettled,
      description: desc,
      date: this.formatDate(inv.invoiceDate || inv.createdAt),
      dueDate: this.formatDate(inv.dueDate),
      paymentDate: this.formatDate(inv.paidAt),
      plan: planName,
      // The line item mirrors the plan that was billed, not a fixed label.
      itemTitle: serviceLabel,
      itemSubtitle: `${billingPeriod} access to ${planName}`,
      itemUnitPrice: this.formatCurrency(subtotal, currency),
      unitPrice: this.formatCurrency(subtotal, currency),
      amount: this.formatCurrency(subtotal, currency),
      subtotal: this.formatCurrency(subtotal, currency),
      vat: this.formatCurrency(vat, currency),
      vatLabel: vatRate ? `VAT (${vatPercent}%)` : 'VAT',
      total: this.formatCurrency(total, currency),
      currency,
      companyName: billing.companyName || '—',
      billingEmail: billing.billingEmail || billing.email || '—',
      billingAddress: [billing.billingAddress, billing.city, billing.postcode, billing.country].filter(Boolean).join(', ') || '—',
      billingCycle: billingPeriod,
      billingPeriodLabel: billingPeriod,
      periodStart: this.formatDate(inv.periodStart),
      nextBillingDate: this.formatDate(inv.currentPeriodEnd || inv.periodEnd || inv.endDate),
      paymentMethod: inv.paymentMethod || 'Card',
      pdfUrl: inv.pdfUrl || '',
      hostedUrl: inv.hostedInvoiceUrl || '',
      planCode: inv.planCode || '—',
      serviceCode: inv.serviceCode || '—',
      hasBilling: !!(billing.companyName || billing.billingEmail || billing.billingAddress),
      planDetails: {
        name: planName,
        price: this.formatCurrency(total, currency),
        period: `/${billingPeriod.toLowerCase()}`,
        description: desc,
        sites: features.max_sites === -1 ? 'Unlimited' : formatFeature(features.max_sites),
        keys: features.unlimited_keys || features.max_keys === -1 ? 'Unlimited' : (features.max_key_sets !== undefined ? formatFeature(features.max_key_sets) : formatFeature(features.max_keys)),
        users: formatFeature(features.max_users),
        jobs: features.max_jobs === -1 ? 'Unlimited' : formatFeature(features.max_jobs),
        features: this.formatFeatures(features, formatFeature),
      }
    };
  }

  /** Renders `planFeatures` as readable `Label: value` pairs, skipping extras. */
  private formatFeatures(features: Record<string, any>, formatFeature: (val: any) => string): string {
    const entries = Object.entries(features)
      .filter(([key]) => !key.startsWith('extra_') && key !== 'unlimited_keys')
      .map(([key, val]) => {
        const label = key.replace(/^max_/, '').replace(/_/g, ' ');
        const shown = val === -1 ? 'Unlimited' : formatFeature(val);
        return `${label.charAt(0).toUpperCase()}${label.slice(1)}: ${shown}`;
      });
    return entries.join(', ') || '—';
  }
}