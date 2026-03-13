import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { TenantService, ProductService, Product } from '@aura-store-front/core';

@Component({
  selector: 'aura-home-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  public tenantService = inject(TenantService);
  private productService = inject(ProductService);
  private platformId = inject(PLATFORM_ID); // 👈 Inyectamos el detector de plataforma

  // 1. Convertimos los arrays falsos en Signals fuertemente tipados
  public featuredProducts = signal<Product[]>([]);
  public popularProducts = signal<Product[]>([]); 
  
  public categories = ['All Products', 'New Arrivals', 'Best Sellers', 'Summer Essentials', 'Accessories'];

  async ngOnInit() {
    // 🛡️ ESCUDO SSR: Solo pedimos datos si estamos en el navegador real
    if (isPlatformBrowser(this.platformId)) {
      try {
        const allProducts = await this.productService.getProducts();

        if (allProducts && allProducts.length > 0) {
          this.featuredProducts.set(allProducts.slice(0, 10));
          this.popularProducts.set(allProducts.slice(0, 8)); 
        }
      } catch (error) {
        console.error('🚨 Error cargando el catálogo en el Home:', error);
      }
    }
  }
}
