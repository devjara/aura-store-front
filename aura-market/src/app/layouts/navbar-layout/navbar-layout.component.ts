import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Navbar, CartDrawer } from '@aura-store-front/shared-ui';
import { CartItemView, CartService } from '@aura-store-front/core';

@Component({
  selector: 'aura-navbar-layout',
  imports: [CommonModule, Navbar, CartDrawer],
  standalone: true,
  templateUrl: './navbar-layout.component.html',
  styleUrl: './navbar-layout.component.scss',
})
export class NavbarLayoutComponent {
  public cartService = inject(CartService)

  //Estado del drawer
  public isCartOpen = signal<boolean>(false);

  // Items del carrito - se llenara desde CartService
  public cartItems = signal<CartItemView[]>([]);

  public storeConfig = {
    name: 'AURA',
    announcement: 'Accede a ofertas exclusivas, lanzamientos y más. No te lo pierdas.',
    announcementLink: 'Ingresa para tus ofertas',
    menu: [
      { label: 'Mujeres', url: '/woman' },
      { label: 'Hombres', url: '/men' },
      { label: 'Catálogo', url: '/catalogo' },
      { label: 'Acerca de', url: '/about' }
    ]
  };



  goToCheckout() {
    //TODO: Logica para ir al checkout
  }
}
