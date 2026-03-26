import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { CartService, Product, ProductService } from 'core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'aura-women.component',
  imports: [RouterLink],
  standalone: true,
  templateUrl: './woman.component.html',
  styleUrl: './woman.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WomanComponent implements OnInit, OnDestroy {
  //Inyecciones
  private productService = inject(ProductService);
  private platformId = inject(PLATFORM_ID);
  private cartService = inject(CartService);

  public products = signal<Product[]>([]);

  public hours = signal<string>('23');
  public minutes = signal<string>('59');
  public seconds = signal<string>('59');
  private timer: ReturnType<typeof setInterval> | null = null;

  public productTabs = [
    'Todos',
    'Blusas & Camisas',
    'Vestidos',
    'Tejidos',
    'Lino',
    'Loungewear',
    'Pantalones',
    'Tops',
  ];
  public activeProductTab = signal<string>('Todos');

  public designerTabs = ['Todos', 'Solenne', 'Maison', 'Valenne', 'Noctra', 'Cavren'];
  public activeDesignerTab = signal<string>('Todos');

  async ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.startCountdown();
      try {
        const data = await this.productService.getProducts();
        this.products.set(
          data.filter(
            (p) => p.category.toLowerCase() === 'women' || p.category.toLowerCase() === 'mujer',
          ),
        );
      } catch (error) {
        console.error('Error cargando productos de mujer:', error);
      }
    }
  }

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

  addToCartFeatured(product: any) {
    this.cartService.addItem({
      productId: Math.random(),
      productAttributeId: 0,
      quantity: 1,
      name: product.name,
      price: parseFloat(product.price),
      imageUrl: product.image,
    });
  }

  public categories = [
    {
      name: 'Tops',
      count: 7,
      image:
        'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?q=80&w=400&auto=format&fit=crop',
    },
    {
      name: 'Blusas y Camisas',
      count: 5,
      image:
        'https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
      name: 'Vestidos',
      count: 4,
      image:
        'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?q=80&w=1164&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
      name: 'Tejidos',
      count: 4,
      image:
        'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=400&auto=format&fit=crop',
    },
    {
      name: 'Loungewear',
      count: 3,
      image:
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400&auto=format&fit=crop',
    },
  ];

  public featuredProducts = [
    {
      name: 'Pantalón Wide-Leg Escarlata',
      price: '159.00',
      originalPrice: '199.00',
      discount: 20,
      rating: 4,
      reviews: 4,
      brand: 'Vireon',
      image:
        'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=400&auto=format&fit=crop',
    },
    {
      name: 'Pantalón Wide-Leg Leopardo',
      price: '89.00',
      originalPrice: '119.00',
      discount: 25,
      rating: 4,
      reviews: 4,
      brand: 'Cavren',
      image:
        'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=400&auto=format&fit=crop',
    },
    {
      name: 'Vestido Camisero Botánico',
      price: '149.00',
      originalPrice: '189.00',
      discount: 21,
      rating: 4,
      reviews: 4,
      brand: 'Maison',
      image:
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400&auto=format&fit=crop',
    },
    {
      name: 'Vestido Midi Smockeado',
      price: '89.00',
      originalPrice: '119.00',
      discount: 25,
      rating: 4,
      reviews: 4,
      brand: 'Maison',
      image:
        'https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=400&auto=format&fit=crop',
    },
    {
      name: 'Blusa Floral Bordada',
      price: '79.00',
      originalPrice: '99.00',
      discount: 20,
      rating: 4,
      reviews: 6,
      brand: 'Solenne',
      image:
        'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?q=80&w=400&auto=format&fit=crop',
    },

    {
      name: 'Pantalón Wide-Leg Escarlata',
      price: '159.00',
      originalPrice: '199.00',
      discount: 20,
      rating: 4,
      reviews: 4,
      brand: 'Vireon',
      image:
        'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=400&auto=format&fit=crop',
    },
    {
      name: 'Pantalón Wide-Leg Leopardo',
      price: '89.00',
      originalPrice: '119.00',
      discount: 25,
      rating: 4,
      reviews: 4,
      brand: 'Cavren',
      image:
        'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=400&auto=format&fit=crop',
    },
    {
      name: 'Vestido Camisero Botánico',
      price: '149.00',
      originalPrice: '189.00',
      discount: 21,
      rating: 4,
      reviews: 4,
      brand: 'Maison',
      image:
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400&auto=format&fit=crop',
    },
    {
      name: 'Vestido Midi Smockeado',
      price: '89.00',
      originalPrice: '119.00',
      discount: 25,
      rating: 4,
      reviews: 4,
      brand: 'Maison',
      image:
        'https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=400&auto=format&fit=crop',
    },
    {
      name: 'Blusa Floral Bordada',
      price: '79.00',
      originalPrice: '99.00',
      discount: 20,
      rating: 4,
      reviews: 6,
      brand: 'Solenne',
      image:
        'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?q=80&w=400&auto=format&fit=crop',
    },
  ];
  public designerProducts = [
    {
      name: 'Vestido Midi Camisero Botánico',
      price: '139.00',
      originalPrice: '179.00',
      discount: 22,
      rating: 4,
      reviews: 4,
      brand: 'Noctra',
      image:
        'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=400&auto=format&fit=crop',
    },
    {
      name: 'Cardigan de Punto Fino Abotonado',
      price: '109.90',
      originalPrice: '149.90',
      discount: 27,
      rating: 4,
      reviews: 4,
      brand: 'Solenne',
      image:
        'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=400&auto=format&fit=crop',
    },
    {
      name: 'Top de Punto Texturizado Sin Mangas',
      price: '59.00',
      originalPrice: '79.00',
      discount: 25,
      rating: 4,
      reviews: 4,
      brand: 'Valenne',
      image:
        'https://images.unsplash.com/photo-1485462537746-965f33f80883?q=80&w=400&auto=format&fit=crop',
    },
    {
      name: 'Sudadera Paris Atelier Relaxed',
      price: '99.90',
      originalPrice: '129.90',
      discount: 23,
      rating: 4,
      reviews: 4,
      brand: 'Valenne',
      image:
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400&auto=format&fit=crop',
    },
    {
      name: 'Sudadera Paris Atelier Relaxed',
      price: '99.90',
      originalPrice: '129.90',
      discount: 23,
      rating: 4,
      reviews: 4,
      brand: 'Valenne',
      image:
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400&auto=format&fit=crop',
    },
  ];

  public benefits = [
    {
      label: 'Atención al cliente',
      description: 'Soporte 24/7 por teléfono y email',
      icon: 'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z',
    },
    {
      label: 'Envío gratis',
      description: 'En compras mayores a $999 MXN',
      icon: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12',
    },
    {
      label: 'Devoluciones fáciles',
      description: '30 días sin complicaciones',
      icon: 'M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75',
    },
    {
      label: 'Pago seguro',
      description: 'Visa, Mastercard y PayPal',
      icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
    },
  ];

  startCountdown() {
    // Fecha fin — 24 horas desde ahora
    const end = new Date();
    end.setHours(end.getHours() + 24);

    this.timer = setInterval(() => {
      const now = new Date();
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        if (this.timer) clearInterval(this.timer);
        return;
      }

      this.hours.set(String(Math.floor(diff / 3600000)).padStart(2, '0'));
      this.minutes.set(String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0'));
      this.seconds.set(String(Math.floor((diff % 60000) / 1000)).padStart(2, '0'));
    }, 1000);
  }

  public filteredDesignerProducts = computed(() => {
    const tab = this.activeDesignerTab();
    if (tab === 'Todos') return this.designerProducts;
    return this.designerProducts.filter((p) => p.brand === tab);
  });

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
}
