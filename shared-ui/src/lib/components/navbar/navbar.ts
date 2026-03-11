import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Category } from 'core/src/lib/models/category.model';


@Component({
  selector: 'aura-navbar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  categories = input<Category[]>([]);
  
  // 2. Estado temporal (Luego lo conectaremos a un Signal global)
  cartItemCount = input<number>(0);

  // 3. Eventos de salida
  Search = output<string>();

  // Manejador del buscador
  handleSearch(event: Event) {
    event.preventDefault(); // Evita que el formulario recargue la página
    const form = event.target as HTMLFormElement;
    const input = form.elements.namedItem('searchInput') as HTMLInputElement;
    if (input.value.trim()) {
      this.Search.emit(input.value.trim());
      input.value = ''; // Limpiamos la barra
    }
  }
}
