import { isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { FilterConfig, Product, ProductService, useCatalogFilter } from 'core';
import { Filter } from 'shared-ui';

@Component({
  selector: 'aura-catalog.component',
  standalone: true,
  imports: [Filter],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.scss',
})
export class CatalogComponent implements OnInit {
  private productService = inject(ProductService);
  private platformId = inject(PLATFORM_ID);

  public products = signal<Product[]>([]);

  // Reglas de filtrado específicas de aura-market
  public catalog = useCatalogFilter(this.products, (product, state) => {
    const categories = (state['category'] as string[]) ?? [];
    const maxPrice = (state['price'] as number) ?? 0;

    if (categories.length > 0 && !categories.includes(product.category)) return false;
    if (maxPrice > 0 && product.price > maxPrice) return false;
    return true;
  });

  // Estos computed son específicos de esta tienda
  public availableCategories = computed(() => {
    const all = this.products().map((p) => p.category);
    return [...new Set(all)].filter(Boolean);
  });

  public highestPrice = computed(() => {
    const prods = this.products();
    return prods.length > 0 ? Math.max(...prods.map((p) => p.price)) : 1000;
  });

  public filterConfigs = computed<FilterConfig[]>(() => [
    {
      key: 'category',
      label: 'Categorías',
      type: 'checkbox',
      options: this.availableCategories().map((c) => ({ label: c, value: c })),
    },
    {
      key: 'price',
      label: 'Precio Máximo',
      type: 'range',
      min: 0,
      max: this.highestPrice(),
    },
  ]);

  async ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const data = await this.productService.getProducts();
        this.products.set(data);

        if (data.length > 0) {
          this.catalog.filterState.set({
            price: Math.max(...data.map((p) => p.price)),
          });
        }
      } catch (error) {
        console.error('Error cargando catálogo:', error);
      }
    }
  }
}
