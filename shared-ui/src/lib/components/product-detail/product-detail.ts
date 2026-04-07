import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '@aura-store-front/core'; 

@Component({
  selector: 'aura-product-detail',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss',
})
export class ProductDetail {
  @Input() product: Product | null = null;
  @Input() relatedProducts: Product[] = [];
  
  quantity = 1;

  @Output() add = new EventEmitter<{product: Product, quantity: number}>();
  @Output() viewProduct = new EventEmitter<Product>();

  get cleanDescription(): string {
    if (!this.product?.description) {
      return 'Una pieza meticulosamente diseñada, construida con la precisión característica de Aura.';
    }
    // Strip HTML tags and replace common entities
    let text = this.product.description.replace(/<[^>]*>?/gm, '');
    text = text.replace(/&nbsp;/g, ' ').trim();
    return text;
  }

  addToCart() {
    if (this.product) {
      this.add.emit({ product: this.product, quantity: this.quantity });
      this.quantity = 1; // Reset after adding
    }
  }

  increaseQuantity() {
    if (this.product) {
      const limit = (this.product.stock !== undefined && this.product.stock !== null) ? this.product.stock : 99;
      if (this.quantity < limit) {
        this.quantity++;
      }
    }
  }

  decreaseQuantity() {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  onViewRelated(product: Product) {
    this.viewProduct.emit(product);
  }
}
