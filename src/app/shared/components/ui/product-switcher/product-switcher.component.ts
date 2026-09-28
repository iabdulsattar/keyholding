import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ProductItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  iconBg: string;
  status: 'current' | 'available' | 'coming-soon';
  actionLabel?: string;
  actionHref?: string;
  descriptionText?: string;
}

@Component({
  selector: 'app-product-switcher',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-switcher.component.html',
})
export class ProductSwitcherComponent {
  @Input() products: ProductItem[] = [
    {
      id: 'edob',
      name: 'eDOB',
      description: 'Digital Occurrence Management',
      icon: '<path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.500 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
      iconBg: 'bg-blue-600',
      status: 'current',
    },
    {
      id: 'keyvault',
      name: 'KeyVault Pro',
      description: 'Enterprise Key Management',
      icon: '<path d="M12 3 5 6v5c0 4.500 3 8 7 10 4-2 7-5.500 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
      iconBg: 'bg-violet-700',
      status: 'available',
      actionLabel: 'Explore KeyVault Pro',
      actionHref: '#',
      descriptionText: 'Securely register, issue, track and audit every key across your organisation.',
    },
    {
      id: 'misentinel',
      name: 'MiSentinelSOS',
      description: 'Lone Worker Safety',
      icon: '<path d="M12 3 5 6v5c0 4.500 3 8 7 10 4-2 7-5.500 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
      iconBg: 'bg-emerald-600',
      status: 'coming-soon',
    },
  ];

  @Input() exploreAllHref: string = '#';

  @Output() productSelected = new EventEmitter<ProductItem>();

  showSwitcher = false;

  toggleSwitcher(event: MouseEvent): void {
    event.stopPropagation();
    this.showSwitcher = !this.showSwitcher;
  }

  selectProduct(product: ProductItem): void {
    this.productSelected.emit(product);
  }

  @HostListener('document:click')
  closeSwitcher(): void {
    this.showSwitcher = false;
  }
}
