import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ClientService, Client } from '../core/services/client.service';

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
  filteredClients: Client[] = [];
  loading = false;
  searchQuery = '';
  activeFilter: 'all' | 'Active' | 'Inactive' | 'Pending' = 'all';

  constructor(private router: Router, private clientService: ClientService) {}

  ngOnInit(): void {
    this.loadClients();
  }

  private loadClients(): void {
    this.loading = true;
    this.clientService.listClients().subscribe(data => {
      this.clients = data;
      this.applyFilter();
      this.loading = false;
    });
  }

  onSearch(): void {
    this.applyFilter();
  }

  setFilter(filter: 'all' | 'Active' | 'Inactive' | 'Pending'): void {
    this.activeFilter = filter;
    this.applyFilter();
  }

  private applyFilter(): void {
    const q = this.searchQuery.toLowerCase().trim();
    this.filteredClients = this.clients.filter(item => {
      const matchesStatus = this.activeFilter === 'all' || item.status === this.activeFilter;
      const matchesSearch = !q || item.name.toLowerCase().includes(q) || item.code.toLowerCase().includes(q) || item.email.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }

  get totalClients(): number { return this.clients.length; }
  get activeClients(): number { return this.clients.filter(c => c.status === 'Active').length; }
  get inactiveClients(): number { return this.clients.filter(c => c.status === 'Inactive').length; }
  get pendingClients(): number { return this.clients.filter(c => c.status === 'Pending').length; }

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

  viewClient(code: string): void {
    this.router.navigate(['/clients', code]);
  }
}
