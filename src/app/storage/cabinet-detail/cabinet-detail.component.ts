import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface Hook {
  num: number;
  used: boolean;
}

@Component({
  selector: 'app-cabinet-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cabinet-detail.component.html',
  styles: [`
    .donut {
      width: 88px; height: 88px; border-radius: 50%;
      background: conic-gradient(#2563eb 0% 71.4%, #16a34a 71.4% 92.8%, #f59e0b 92.8% 100%);
      display: flex; align-items: center; justify-content: center; position: relative; flex-shrink: 0;
    }
    .donut::after { content: ""; position: absolute; inset: 12px; background: #fff; border-radius: 50%; }
    .donut-label { position: relative; z-index: 1; text-align: center; }
    @keyframes fadeIn { from { opacity: 0; transform: scale(.97); } to { opacity: 1; transform: scale(1); } }
    .animate-fade-in { animation: fadeIn .15s ease-out; }
  `],
})
export class CabinetDetailComponent {
  readonly usedHookSet = new Set([1, 2, 3, 4, 5, 7, 9, 11, 13, 14, 17, 18, 19, 20]);

  readonly hooks: Hook[] = Array.from({ length: 20 }, (_, i) => ({
    num: i + 1,
    used: this.usedHookSet.has(i + 1),
  }));

  isDeactivateModalOpen = false;
  isReactivateModalOpen = false;
  isMoreMenuOpen = false;

  openDeactivateModal(): void {
    this.isDeactivateModalOpen = true;
    this.isMoreMenuOpen = false;
  }

  closeDeactivateModal(): void {
    this.isDeactivateModalOpen = false;
  }

  openReactivateModal(): void {
    this.isReactivateModalOpen = true;
    this.isMoreMenuOpen = false;
  }

  closeReactivateModal(): void {
    this.isReactivateModalOpen = false;
  }

  toggleMoreMenu(): void {
    this.isMoreMenuOpen = !this.isMoreMenuOpen;
  }

  closeMoreMenu(): void {
    this.isMoreMenuOpen = false;
  }
}
