import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { Navbar, CartDrawer } from '@aura-store-front/shared-ui';
import { CartItemView } from '@aura-store-front/core';

@Component({
  selector: 'aura-navbar-layout',
  imports: [CommonModule, Navbar, CartDrawer],
  standalone: true,
  templateUrl: './navbar-layout.component.html',
  styleUrl: './navbar-layout.component.scss',
})
export class NavbarLayoutComponent {

  //Estado del drawer
  public isCartOpen = signal<boolean>(false);

  // Items del carrito - se llenara desde CartService
  public cartItems = signal<CartItemView[]>([]);

  public storeConfig = {
    name: 'AURA',
    announcement: 'Accede a ofertas exclusivas, lanzamientos y más. No te lo pierdas.',
    announcementLink: 'Ingresa para tus ofertas',
    menu: [
      { label: 'Women', url: '/women' },
      { label: 'Men', url: '/men' },
      { label: 'Catálogo', url: '/catalogo' },
      { label: 'About', url: '/about' }
    ]
  };

  openCart() {
    this.isCartOpen.set(true);
  }

  closeCart() {
    this.isCartOpen.set(false);
  }

  removeItem(productId: number){
    this.cartItems.update(items => items.filter( i => i.productId !== productId));
  }

  goToCheckout() {
    //TODO: Logica para ir al checkout
  }
}
