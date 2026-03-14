import { Component, computed, input, output, signal } from '@angular/core';
import { CartItemView } from 'core';

@Component({
  selector: 'aura-cart-drawer',
  imports: [],
  templateUrl: './cart-drawer.html',
  styleUrl: './cart-drawer.scss',
})
export class CartDrawer {
  // Data
  items = input<CartItemView[]>([]);
  isOpen = input<boolean>(false);

  //Textos configurables por tienda
  title = input<string>('Shopping cart');
  checkoutLabel = input<string>('Pagar');
  continueLabel = input<string>('Continuar Comprando');
  currencySymbol = input<string>('$');

  //Control de cierre

  public isClosing = signal<boolean>(false);

  //Acciones
  closeCart = output<void>();
  remove = output<number>();
  checkout = output<void>();
  continueShopping = output<void>();

  public subtotal = computed(() => 
    this.items().reduce((acc, item) => acc + item.price * item.quantity, 0)
  );

  handleClose() {
    this.isClosing.set(true);
    setTimeout(() => {
      this.isClosing.set(false);
      this.closeCart.emit();
    }, 280);
  }
}
