import { Component, input, output } from '@angular/core';
import { FallbackImagePipe } from '../../pipes/fallback-image-pipe';
import { FormatPricePipe } from '../../pipes/format-price-pipe';
import { Button } from '../ui/button/button';
import { Product } from '@aura-store-front/core';

@Component({
  selector: 'aura-product-card',
  standalone: true,
  imports: [
    FormatPricePipe,
    FallbackImagePipe,
    Button
  ],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
})
export class ProductCard {
 // Contrato de entrada estricto: la tarjeta no se renderiza si no le pasas un producto
  product = input.required<Product>();

  // Emitimos el producto hacia arriba cuando le dan click al botón de comprar
  AddToCart = output<Product>();

  // Emitimos el producto hacia arriba cuando le dan click al ícono del corazón
  ToggleLike = output<Product>();
}
