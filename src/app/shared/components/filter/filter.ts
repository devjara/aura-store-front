import { Component, input, output, signal } from '@angular/core';
import { Button } from '../ui/button/button';
import { Category } from '@core/models/category.model';
import { FilterState } from '@core/models/filter.model';

@Component({
  selector: 'app-filter',
  standalone: true,
  imports: [Button],
  templateUrl: './filter.html',
  styleUrl: './filter.scss',
})
export class Filter {
  // Entradas
  categories = input<Category[]>([]);
  isLoading = input<boolean>(false);

  // Salida tipada con el modelo de filtro
  onFilterApply = output<FilterState>();

  // Estado interno reactivo
  selectedCategory = signal<number | null>(null);
  minPrice = signal<number | null>(null);
  maxPrice = signal<number | null>(null);
  sortBy = signal<string>('date_desc');
  selectedBrands = signal<number[]>([]); 
  minRating = signal<number | null>(null);

  // --- MÉTODOS DE ACTUALIZACIÓN ---

  // 1. Alternar la selección de categoría (Checkbox)
  updateCategory(id: number) {
    // Si hace clic en la categoría que ya estaba seleccionada, la limpiamos (null)
    this.selectedCategory.set(this.selectedCategory() === id ? null : id);
  }

  // 2. Actualizar el ordenamiento (Select)
  updateSort(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.sortBy.set(value);
  }

  // 3. Actualizar el precio mínimo (Input de texto/número)
  updateMinPrice(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.minPrice.set(value ? Number(value) : null);
  }

  // 4. Actualizar el precio máximo (Input de texto/número)
  updateMaxPrice(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.maxPrice.set(value ? Number(value) : null);
  }

  // 5. Emitir el estado completo al Layout padre (Botón Aplicar)
  applyFilters() {
    this.onFilterApply.emit({
      categoryId: this.selectedCategory(),
      minPrice: this.minPrice(),
      maxPrice: this.maxPrice(),
      sortBy: this.sortBy(),
      brands: this.selectedBrands ? this.selectedBrands() : [], 
      minRating: this.minRating ? this.minRating() : null
    });
  }

}
