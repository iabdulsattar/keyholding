import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './invoice-detail.component.html',
  styles: ''
})
export class InvoiceDetailComponent {
  invoice = {
    number: 'INV-2026-00045',
    status: 'Paid',
    description: 'Monthly Subscription (Enterprise)',
    date: '01 Jul 2026',
    dueDate: '03 Jul 2026',
    paymentDate: '05 Jul 2026',
    plan: 'Enterprise',
    unitPrice: '£30.00',
    amount: '£30.00',
    subtotal: '£30.00',
    vat: '£6.00',
    total: '£30.00',
    companyName: 'Sentinel Technologies Ltd',
    billingEmail: 'accounts@sentineltech.co.uk',
    billingAddress: '10 Sentinel House, Enterprise Park, Manchester, M15 6SE, United Kingdom',
    billingCycle: 'Monthly',
    nextBillingDate: '03 Aug 2026',
    paymentMethod: 'VISA •••• 4242',
    planDetails: {
      name: 'Enterprise',
      price: '£30.00',
      period: '/month',
      description: 'Advance features for scaling operations.',
      sites: '150',
      keys: '1000',
      users: 'Unlimited',
      jobs: 'Unlimited',
      features: 'All Enterprise Features'
    }
  };

  statusStyles: Record<string, string> = {
    Paid: 'bg-emerald-50 text-emerald-600',
    Pending: 'bg-amber-50 text-amber-600',
    Overdue: 'bg-red-50 text-red-600',
  };
}
