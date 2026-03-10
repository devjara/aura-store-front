import { Component, input, output } from '@angular/core';
import { FallbackImagePipe } from '@shared/pipes/fallback-image-pipe';
import { FormatPricePipe } from '@shared/pipes/format-price-pipe';
import { StockBadgePipe } from '@shared/pipes/stock-badge-pipe';
import { Button } from '../ui/button/button';
import { Product } from '@core/models/product.model';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [
    FormatPricePipe,
    FallbackImagePipe,
    StockBadgePipe,
    Button
  ],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
})
export class ProductCard {
 // Contrato de entrada estricto: la tarjeta no se renderiza si no le pasas un producto
  product = input.required<Product>();

  // Emitimos el producto hacia arriba cuando le dan click al botón de comprar
  onAddToCart = output<Product>();

  // Emitimos el producto hacia arriba cuando le dan click al ícono del corazón
  onToggleLike = output<Product>();
}
