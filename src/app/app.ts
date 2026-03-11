import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Category } from 'core/src/lib/models/category.model';
import { Product } from '@aura-store-front/core';
import { Filter, Footer, Navbar, Pagination, ProductCard } from '@aura-store-front/shared-ui';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    Filter, 
    Footer, 
    Navbar, 
    Pagination,
    ProductCard 
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  standalone: true
})
export class App {
  // 1. Mock de Categorías (Para el Navbar y el Filtro)
  mockCategories: Category[] = [
    { id: 1, parentId: 0, name: 'Electrónica', slug: 'electronica', description: '', active: true },
    { id: 2, parentId: 0, name: 'Ropa', slug: 'ropa', description: '', active: true },
    { id: 3, parentId: 0, name: 'Hogar', slug: 'hogar', description: '', active: true },
  ];


  mockProducts: Product[] = [
    {
      id: 1,
      name: 'Laptop Pro 15" M2',
      description: 'Potente laptop para desarrolladores.',
      price: 35000.50,
      imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80', // Foto real de Unsplash
      
      category: 'Electrónica',
      stock: 10,
      active: true
    },
    {
      id: 2,
      name: 'Silla Ergonómica Aura',
      description: 'Silla de oficina para largas jornadas.',
      price: 4500.00,
      imageUrl: '', // Forzamos URL vacía para probar tu FallbackImagePipe
      
      category: 'Hogar',
      stock: 3, // Forzamos poco stock para probar tu StockBadgePipe
      active: true
    },
    {
      id: 3,
      name: 'Teclado Mecánico RGB',
      description: 'Switches azules, sonido clicky.',
      price: 1299.99,
      imageUrl: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=500&q=80',
      
      category: 'Electrónica',
      stock: 0, // Forzamos sin stock para probar tu StockBadgePipe
      active: true
    }
  ];

  onFilterApplied(filters: any) {
    console.log('El usuario aplicó estos filtros:', filters);
  }

  onProductAdded(product: Product) {
    console.log('El usuario quiere comprar:', product.name);
    alert(`Añadido al carrito: ${product.name}`);
  }

  onPageChanged(page: number) {
    console.log('El usuario quiere ir a la página:', page);
  }
}
