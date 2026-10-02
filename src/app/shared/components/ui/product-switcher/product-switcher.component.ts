import { Component, Input, Output, EventEmitter, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService, Product } from '../../../../core/services';

export interface ProductItem {
  id: string;
  name: string;
  description: string;
  serviceCode: string;
  // icon: string;
  // iconBg: string;
  status: 'current' | 'subscribed' | 'available' | 'coming-soon';
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
export class ProductSwitcherComponent implements OnInit {
  @Input() products: ProductItem[] = [
    {
      id: 'keyvault',
      name: 'KeyVault',
      description: 'Enterprise Key Management',
      serviceCode: 'key-vault',
      // icon: '<path d="M12 3 5 6v5c0 4.500 3 8 7 10 4-2 7-5.500 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
      // iconBg: 'bg-blue-600',
      status: 'current',
    },
    {
      id: 'edob',
      name: 'eDOB',
      description: 'Digital Occurrence Management',
      serviceCode: 'edob',
      // icon: '<path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.500 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
      // iconBg: 'bg-blue-600',
      status: 'available',
    },
    {
      id: 'misentinel',
      name: 'MiSentinelSOS',
      description: 'Lone Worker Safety',
      serviceCode: 'misentinel',
      // icon: '<path d="M12 3 5 6v5c0 4.500 3 8 7 10 4-2 7-5.500 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
      // iconBg: 'bg-emerald-600',
      status: 'coming-soon',
    },
  ];
  private productService = inject(ProductService);
  @Input() exploreAllHref: string = '#';
  @Output() productSelected = new EventEmitter<ProductItem>();

  showSwitcher = false;
  visibleProducts: ProductItem[] = [];
  isSwitching = false;

  ngOnInit(): void {
    this.refreshProducts();
  }

  /** Recompute the list so statuses reflect the current subscription state. */
  private refreshProducts(): void {
    this.visibleProducts = this.getProducts();
  }

  getProducts(): ProductItem[] {
    this.productService.syncStatusesFromSubscriptions();

    const serviceProducts = this.productService.getProducts().map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      serviceCode: p.serviceCode,
      icon: p.icon,
      iconBg: p.iconBg,
      status: p.status,
      actionLabel: p.actionLabel,
      actionHref: p.actionHref,
      descriptionText: p.descriptionText,
    }));
    return serviceProducts.length > 0 ? serviceProducts : this.products;
  }

  getCurrentProduct(): ProductItem | undefined {
    return this.getProducts().find(p => p.status === 'current');
  }

  toggleSwitcher(event: MouseEvent): void {
    event.stopPropagation();
    this.showSwitcher = !this.showSwitcher;
    if (this.showSwitcher) {
      this.refreshProducts();
    }
  }

  selectProduct(product: ProductItem): void {
    if (product.status === 'current' || product.status === 'coming-soon' || this.isSwitching) {
      return;
    }

    this.isSwitching = true;
    this.showSwitcher = false;

    this.productSelected.emit(product);

    try {
      this.productService.redirectToProduct(product.id);
    } catch (error: any) {
      this.isSwitching = false;
      this.showSwitcher = true;
      const message = error?.message || error?.error?.detail || error?.error?.message || 'Unknown error';
      alert(`Failed to switch to ${product.name}: ${message}. Please try again.`);
    }
  }

  switchToProduct(product: ProductItem): void {
    this.productService.setCurrentProduct(product.id);
    this.refreshProducts();
  }

  @HostListener('document:click')
  closeSwitcher(): void {
    this.showSwitcher = false;
  }
}
