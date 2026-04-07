import { Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductDetail } from '@aura-store-front/shared-ui';
import { Product, ProductService, CartService, StockService, OutOfStockBehavior } from '@aura-store-front/core';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'aura-detailproduct',
  imports: [CommonModule, ProductDetail],
  standalone: true,
  templateUrl: './detailproduct.component.html',
  styleUrl: './detailproduct.component.scss',
})
export class Detailproduct implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private stockService = inject(StockService);
  private platformId = inject(PLATFORM_ID);

  public product = signal<Product | null>(null);
  public relatedProducts = signal<Product[]>([]);
  public isLoading = signal<boolean>(true);

  ngOnInit(): void {
    // Escuchar cambios en la ruta para actualizar si navegan desde "relacionados"
    this.route.paramMap.subscribe(params => {
      const idStr = params.get('id');
      if (idStr) {
        this.loadProductData(Number(idStr));
      }
    });
  }

  async loadProductData(id: number) {
    if (!isPlatformBrowser(this.platformId)) return;
    
    this.isLoading.set(true);
    
    try {
      const allProducts = await this.productService.getProducts();
      
      const foundProduct = allProducts.find(p => p.id === id) || null;
      
      if (foundProduct) {
        try {
          const stockInfo = await firstValueFrom(this.stockService.getByProductId(foundProduct.id));
          if (stockInfo) {
            // Si el comportamiento de agotado (outOfStock) es 1 (Permitir pedidos),
            // o si dependsOnStock está desactivado, fingimos que hay stock ilimitado
            // para que no bloquee los botones de 'Agregar al carrito'.
            if (stockInfo.outOfStock === OutOfStockBehavior.Allow || !stockInfo.dependsOnStock) {
              foundProduct.stock = 9999;
            } else {
              foundProduct.stock = stockInfo.quantity;
            }
          }
        } catch (stockError) {
          console.warn('No se pudo obtener el stock para el producto', id, stockError);
        }
      }

      this.product.set(foundProduct);

      if (foundProduct) {
        // Encontrar relacionados de la misma categoria, excluyendo el actual, maximo 4
        const related = allProducts
          .filter(p => p.category === foundProduct.category && p.id !== foundProduct.id)
          .slice(0, 4);
        this.relatedProducts.set(related);
      } else {
        this.relatedProducts.set([]);
      }
      
    } catch (error) {
      console.error('Error cargando producto:', error);
    } finally {
      this.isLoading.set(false);
      // Opcional: scrollear al tope suavemente
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  onAddToCart(event: {product: Product, quantity: number}) {
    this.cartService.addItem({
      productId: event.product.id,
      productAttributeId: 0,
      quantity: event.quantity,
      name: event.product.name,
      price: event.product.price,
      imageUrl: event.product.imageUrl,
    });
  }

  onViewProduct(product: Product) {
    this.router.navigate(['/product', product.id]);
  }
}
