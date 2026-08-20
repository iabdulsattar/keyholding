import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './invoices.component.html',
  styles: ''
})
export class InvoicesComponent {
  invoices = [
    { no: 'INV-2026-00045', date: '01 Jul 2026', desc: 'Monthly subscription (Enterprise)', amount: '£119.88', status: 'Paid' },
    { no: 'INV-2026-00032', date: '01 Jun 2026', desc: 'Monthly subscription (Enterprise)', amount: '£119.88', status: 'Paid' },
    { no: 'INV-2026-00019', date: '01 May 2026', desc: 'Monthly subscription (Enterprise)', amount: '£119.88', status: 'Paid' },
    { no: 'INV-2026-00006', date: '01 Apr 2026', desc: 'Monthly subscription (Enterprise)', amount: '£119.88', status: 'Paid' },
    { no: 'INV-2026-00001', date: '01 Mar 2026', desc: 'Monthly subscription (Enterprise)', amount: '£119.88', status: 'Pending' },
    { no: 'INV-2026-00000', date: '01 Feb 2026', desc: 'Monthly subscription (Enterprise)', amount: '£119.88', status: 'Pending' },
    { no: 'INV-2026-00099', date: '01 Jan 2026', desc: 'Monthly subscription (Enterprise)', amount: '£119.88', status: 'Overdue' },
    { no: 'INV-2026-00045', date: '01 Jul 2026', desc: 'Monthly subscription (Enterprise)', amount: '£119.88', status: 'Paid' },
    { no: 'INV-2026-00045', date: '01 Jul 2026', desc: 'Monthly subscription (Enterprise)', amount: '£119.88', status: 'Paid' },
    { no: 'INV-2026-00045', date: '01 Jul 2026', desc: 'Monthly subscription (Enterprise)', amount: '£119.88', status: 'Paid' },
  ];

  statusStyles: Record<string, string> = {
    Paid: 'bg-emerald-50 text-emerald-600',
    Pending: 'bg-amber-50 text-amber-600',
    Overdue: 'bg-red-50 text-red-600',
  };

  get totalInvoices() { return this.invoices.length; }
  get paidInvoices() { return this.invoices.filter(i => i.status === 'Paid').length; }
  get pendingInvoices() { return this.invoices.filter(i => i.status === 'Pending').length; }
  get overdueInvoices() { return this.invoices.filter(i => i.status === 'Overdue').length; }
}
