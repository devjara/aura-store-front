import { computed, effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { CartItemView } from '../../models/cart.model';
import { isPlatformBrowser } from '@angular/common';
import { StoredCard } from '../../models/storedcard.model';

const CART_KEY = 'aura_cart';
const ONE_DAY = 24 * 60 * 60 * 1000;
const THREE_DAYS = 3 * ONE_DAY;

@Injectable({
  providedIn: 'root'
})

export class CartService {

//propiedades privadas
private platformId = inject(PLATFORM_ID);

//Propiedades publicas
public isAuthenticated = signal<boolean>(false);
public items = signal<CartItemView[]>(this.loadFromStorage());
public isOpen = signal<boolean>(false);

public itemCount = computed(() =>
  this.items().reduce((acc, item) => acc + item.quantity, 0)

);

public subtotal = computed(() =>
  this.items().reduce((acc, item) => acc + item.price * item.quantity, 0)
);

constructor() {
  effect(() => {
    if(isPlatformBrowser(this.platformId)) {
      const payload: StoredCard = {
        items: this.items(),
        expiresAt: Date.now() + (this.isAuthenticated() ? THREE_DAYS : ONE_DAY),
        authenticated: this.isAuthenticated()
      };
      localStorage.setItem(CART_KEY, JSON.stringify(payload));
    }
  });
}

/**
 * Funcion privada que carga del localstorage los productos agregados del carrito
 * a partir de las reglas de negocio
 * @returns
 */
private loadFromStorage(): CartItemView[] {
  try{
    if(typeof window === 'undefined') return [];
    const stored = localStorage.getItem(CART_KEY);
    if(!stored) return [];
    const parsed: StoredCard = JSON.parse(stored);

    if(Date.now() > parsed.expiresAt) {
      localStorage.removeItem(CART_KEY);
      return[];
    }
    return parsed.items
  }catch {
    return [];
  }
}


addItem(item: CartItemView) {
  const exists = this.items().find(i => i.productId === item.productId);
  if(exists) {
    this.items.update(items => items.map(i => i.productId === item.productId
      ? {...i, quantity: i.quantity + 1}
      : i
    )
  );
  } else {
    this.items.update(items => [...items, item]);
  }
  this.isOpen.set(true);
}

removeItem(productId: number) {
  this.items.update(items => items.filter(i => i.productId !== productId));
}

openCart() {this.isOpen.set(true);}
closeCart() {this.isOpen.set(false);}

}
