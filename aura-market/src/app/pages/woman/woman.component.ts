import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { CartService, Category, CategoryService, Product, ProductService } from 'core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'aura-women',
  imports: [RouterLink],
  standalone: true,
  templateUrl: './woman.component.html',
  styleUrl: './woman.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WomanComponent implements OnInit, OnDestroy {
  // ─── Inyecciones ─────────────────────────────────────────────────────────────
  private productService = inject(ProductService);
  private platformId = inject(PLATFORM_ID);
  private cartService = inject(CartService);
  private categoryService = inject(CategoryService);

  // ─── Estado ──────────────────────────────────────────────────────────────────
  public products = signal<Product[]>([]);
  public isLoading = signal<boolean>(true);
  public categories = signal<Category[]>([]);

  // ─── Countdown ───────────────────────────────────────────────────────────────
  public hours = signal<string>('23');
  public minutes = signal<string>('59');
  public seconds = signal<string>('59');
  private timer: ReturnType<typeof setInterval> | null = null;

  // ─── Tabs de productos ────────────────────────────────────────────────────────
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

  // ─── Tabs de diseñadores ──────────────────────────────────────────────────────
  public designerTabs = ['Todos', 'Solenne', 'Maison', 'Valenne', 'Noctra', 'Cavren'];
  public activeDesignerTab = signal<string>('Todos');

  // ─── Productos computados ─────────────────────────────────────────────────────
  // Primeros 8 productos — sección "Redefine Tu Guardarropa"
  public featuredProducts = computed(() => this.products().filter((p) => p.category.toLowerCase() === 'mujer').slice(0, 10));

  // Últimos productos — sección "Colecciones de Diseñador"
  public designerProducts = computed(() => this.products().slice(8, 16));

  // Filtrado por tab de diseñador
  public filteredDesignerProducts = computed(() => {
    const tab = this.activeDesignerTab();
    const products = this.designerProducts();
    if (tab === 'Todos') return products;
    return products.filter((p) => p.category === tab);
  });

  // ─── Skeletons para loading ───────────────────────────────────────────────────
  public skeletons = [1, 2, 3, 4, 5];

  // ─── Beneficios ───────────────────────────────────────────────────────────────
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

  // ─── Lifecycle ────────────────────────────────────────────────────────────────
  async ngOnInit() {
    const targetCategories = ['tops y blusas', 'vestidos', 'artesanal', 'loungewear', 'disenador'];

    if (isPlatformBrowser(this.platformId)) {
      this.startCountdown();
      try {
        const [products, categories] = await Promise.all([
          this.productService.getProducts(),
          this.categoryService.getCategories(),
        ]);

        this.products.set(products);

        // Conteo real por categoría
       this.categories.set(
         categories
           .filter((cat) => targetCategories.includes(cat.name.toLowerCase()))
           .map((cat) => ({
             ...cat,
             count: products.filter((p) => p.category.toLowerCase() === cat.name.toLowerCase())
               .length,
           })),
       );
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        this.isLoading.set(false);
      }
    }
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  // ─── Carrito ──────────────────────────────────────────────────────────────────
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

  // ─── Countdown ────────────────────────────────────────────────────────────────
  startCountdown() {
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
}
