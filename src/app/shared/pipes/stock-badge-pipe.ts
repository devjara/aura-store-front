import { Pipe, PipeTransform } from '@angular/core';

export interface StockBadgeConfig {
  text: string;
  cssClass: string;
}

@Pipe({
  name: 'stockBadge',
  standalone: true
})
export class StockBadgePipe implements PipeTransform {
  transform(stock: number): StockBadgeConfig {
    // Escenario 1: Agotado (Rojo)
    if (stock <= 0) {
      return { 
        text: 'Agotado', 
        cssClass: 'bg-red-100 text-red-800 border border-red-200' 
      };
    } 
    
    // Escenario 2: Sentido de urgencia (Amarillo/Naranja)
    if (stock > 0 && stock <= 5) {
      return { 
        text: `Últimas ${stock} piezas`, 
        cssClass: 'bg-orange-100 text-orange-800 border border-orange-200' 
      };
    } 
    
    // Escenario 3: Stock sano (Verde)
    return { 
      text: 'Disponible', 
      cssClass: 'bg-green-100 text-green-800 border border-green-200' 
    };
  }
}
