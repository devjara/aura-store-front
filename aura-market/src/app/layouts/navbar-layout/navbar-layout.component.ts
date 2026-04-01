import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, signal } from '@angular/core';
import { Navbar, CartDrawer } from '@aura-store-front/shared-ui';
import { CartItemView, CartService, CategoryService, ProductService } from '@aura-store-front/core';
import { Router } from '@angular/router';

@Component({
  selector: 'aura-navbar-layout',
  imports: [CommonModule, Navbar, CartDrawer],
  standalone: true,
  templateUrl: './navbar-layout.component.html',
  styleUrl: './navbar-layout.component.scss',
})
export class NavbarLayoutComponent {
  //  Inyecciones
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private router = inject(Router);
  public cartService = inject(CartService);

  // Estado
  public isCartOpen = signal<boolean>(false);
  public cartItems = signal<CartItemView[]>([]);

  // ─── Shortcut Ctrl+Shift+R — invalida caché y recarga ────────────────────────
  // Solo para desarrollo — fuerza recarga del catálogo sin esperar TTL
  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    if (event.ctrlKey && event.shiftKey && event.key === 'R') {
      this.productService.invalidateCache();
      this.categoryService.invalidateCache();
      this.router.navigate([this.router.url]); // ← recarga la ruta actual
    }
  }
  public storeConfig = {
    name: 'AURA',
    announcement: 'Accede a ofertas exclusivas, lanzamientos y más. No te lo pierdas.',
    announcementLink: 'Ingresa para tus ofertas',
    menu: [
      { label: 'Mujeres', url: '/woman' },
      { label: 'Hombres', url: '/men' },
      { label: 'Catálogo', url: '/catalogo' },
      { label: 'Acerca de', url: '/about' },
    ],
  };

  goToAuth(): void {
    this.router.navigate(['/auth']);
  }

  goToCheckout() {
    //TODO: Logica para ir al checkout
  }
}
