import { Component, Input, Output, EventEmitter, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService, Product } from '../../../../core/services';

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
  private productService = inject(ProductService);

  @Input() products: ProductItem[] = [];
  @Input() exploreAllHref: string = '#';
  @Output() productSelected = new EventEmitter<ProductItem>();

  showSwitcher = false;

  getProducts(): ProductItem[] {
    const serviceProducts = this.productService.getProducts().map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
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
  }

  selectProduct(product: ProductItem): void {
    this.productSelected.emit(product);
    this.showSwitcher = false;
  }

  switchToProduct(product: ProductItem): void {
    this.productService.setCurrentProduct(product.id);
    const products = this.getProducts().map(p => ({
      ...p,
      status: p.id === product.id ? 'current' : p.status
    }));
    this.products = products;
  }

  @HostListener('document:click')
  closeSwitcher(): void {
    this.showSwitcher = false;
  }
}
