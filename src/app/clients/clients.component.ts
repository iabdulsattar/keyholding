import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ClientService, Client, PaginatedResult } from '../core/services/client.service';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './clients.component.html',
  styles: `.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }`
})
export class ClientsComponent implements OnInit {
  clients: Client[] = [];
  loading = false;
  searchQuery = '';
  activeFilter: 'all' | 'Active' | 'Inactive' | 'Pending' = 'all';
  page = 0;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;

  constructor(private router: Router, private clientService: ClientService) {}

  ngOnInit(): void {
    this.loadClients();
  }

  private loadClients(): void {
    this.loading = true;
    const status = this.activeFilter === 'all' ? undefined : this.activeFilter;
    this.clientService.listClients({
      q: this.searchQuery || undefined,
      status,
      region: undefined,
      page: this.page,
      size: this.pageSize,
    }).subscribe((result: PaginatedResult<Client>) => {
      this.clients = result.items;
      this.totalItems = result.totalItems;
      this.totalPages = result.totalPages;
      this.page = result.page;
      this.loading = false;
    });
  }

  onSearch(): void {
    this.page = 0;
    this.loadClients();
  }

  setFilter(filter: 'all' | 'Active' | 'Inactive' | 'Pending'): void {
    this.activeFilter = filter;
    this.page = 0;
    this.loadClients();
  }

  get totalClients(): number { return this.totalItems; }
  get activeClients(): number { return this.clients.filter(c => c.status === 'Active').length; }
  get inactiveClients(): number { return this.clients.filter(c => c.status === 'Inactive').length; }
  get pendingClients(): number { return this.clients.filter(c => c.status === 'Pending').length; }

  get showingStart(): number {
    return this.totalItems === 0 ? 0 : this.page * this.pageSize + 1;
  }

  get showingEnd(): number {
    return Math.min((this.page + 1) * this.pageSize, this.totalItems);
  }

  statusBadge(status: string): string {
    switch (status) {
      case 'Active':
        return `<span class="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span><span>Active</span></span>`;
      case 'Inactive':
        return `<span class="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-100"><span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span><span>Inactive</span></span>`;
      case 'Pending':
        return `<span class="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-100"><span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span><span>Pending</span></span>`;
      default:
        return status;
    }
  }

  viewClient(id: string): void {
    this.router.navigate(['/clients', id]);
  }

  goToPage(p: number | string): void {
    if (typeof p !== 'number') return;
    if (p < 0 || p >= this.totalPages) return;
    this.page = p;
    this.loadClients();
  }

  prevPage(): void {
    this.goToPage(this.page - 1);
  }

  nextPage(): void {
    this.goToPage(this.page + 1);
  }

  onPageSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.pageSize = parseInt(select.value, 10) || 10;
    this.page = 0;
    this.loadClients();
  }

  getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const total = this.totalPages;
    const current = this.page;
    if (total <= 7) {
      for (let i = 0; i < total; i++) pages.push(i);
    } else {
      pages.push(0);
      if (current > 2) pages.push('...');
      const start = Math.max(1, current - 1);
      const end = Math.min(total - 2, current + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (current < total - 3) pages.push('...');
      pages.push(total - 1);
    }
    return pages;
  }

  pageLabel(p: number | string): string {
    return typeof p === 'number' ? String(p + 1) : String(p);
  }
}
