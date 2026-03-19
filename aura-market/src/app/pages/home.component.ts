import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, computed, ElementRef, inject, OnInit, PLATFORM_ID, signal, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ProductService, Product, CartItemView, CartService } from '@aura-store-front/core';

@Component({
  selector: 'aura-home-component',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private productService = inject(ProductService);
  private platformId = inject(PLATFORM_ID);
  private cartService = inject(CartService);

  @ViewChild('carousel') carouselRef!: ElementRef<HTMLDivElement>;

  public newArrivals = signal<Product[]>([]);
  public tabs = ['ALL', 'Men', 'Women', 'Kid'];
  public activeTab = signal<string>('ALL');

  async ngOnInit() {
    //SSR: Solo pedimos datos si estamos en el navegador real
    if (isPlatformBrowser(this.platformId)) {
      try {
        const data = await this.productService.getProducts();
        this.newArrivals.set(data.slice(0, 8));
      } catch (error) {
        console.error('🚨 Error cargando el catálogo en el Home:', error);
      }
    }
  }

  public filteredByTab = computed(() => {
    const tab = this.activeTab();
    const products = this.newArrivals();
    if (tab === 'ALL') return products;
    return products.filter((p) => p.category.toLocaleLowerCase() === tab.toLocaleLowerCase());
  });

  addToCart(product: Product) {
    this.cartService.addItem({
      productId: product.id,
      productAttributeId: 0,
      quantity: 1,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
    });
  }

  scrollLeft() {
    this.carouselRef.nativeElement.scrollBy({ left: -400, behavior: 'smooth' });
  }

  scrollRight() {
    this.carouselRef.nativeElement.scrollBy({ left: 400, behavior: 'smooth' });
  }

  scrollLeftDrop() {
    document.getElementById('carouselDrop')?.scrollBy({ left: -400, behavior: 'smooth' });
  }

  scrollRightDrop() {
    document.getElementById('carouselDrop')?.scrollBy({ left: 400, behavior: 'smooth' });
  }

  scrollLeftPopular() {
    document.getElementById('carouselPopular')?.scrollBy({ left: -400, behavior: 'smooth' });
  }

  scrollRightPopular() {
    document.getElementById('carouselPopular')?.scrollBy({ left: 400, behavior: 'smooth' });
  }
}
