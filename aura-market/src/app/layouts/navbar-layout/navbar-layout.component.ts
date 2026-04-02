import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, signal } from '@angular/core';
import { Navbar, CartDrawer } from '@aura-store-front/shared-ui';
import { CartItemView, CartService, CategoryService, ProductService, AUTH_CONTRACT } from '@aura-store-front/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'aura-navbar-layout',
  imports: [CommonModule, RouterModule, Navbar, CartDrawer],
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
  private authContract = inject(AUTH_CONTRACT);

  // Estado
  public isCartOpen = signal<boolean>(false);
  public cartItems = signal<CartItemView[]>([]);
  public isUserMenuOpen = signal<boolean>(false);

  // Auth signals (delegados al contrato)
  public isLoggedIn = this.authContract.isLoggedIn;
  public currentUser = this.authContract.currentUser;

  /** Iniciales del usuario para el avatar (nombre o email) */
  public get userInitial(): string {
    const user = this.currentUser();
    if (!user) return '';
    if (user.firstname) return user.firstname.charAt(0).toUpperCase();
    if (user.email) return user.email.charAt(0).toUpperCase();
    return '?';
  }

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

  goToMyAccount(): void {
    this.isUserMenuOpen.set(false);
    this.router.navigate(['/my-account']);
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen.update(v => !v);
  }

  closeUserMenu(): void {
    this.isUserMenuOpen.set(false);
  }

  logout(): void {
    this.authContract.logout();
    this.isUserMenuOpen.set(false);
    this.router.navigate(['/']);
  }

  goToCheckout() {
    this.cartService.closeCart();
    this.router.navigate(['/checkout']);
  }
}
