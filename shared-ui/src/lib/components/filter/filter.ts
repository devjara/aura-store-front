import { Component, input, output } from '@angular/core';
import { FilterState, FilterConfig } from '@aura-store-front/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'aura-filter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './filter.html'
})
export class Filter {
  //Recibe la configuracioin de filtros - no sabe si son categorias, tallas o material
  filters = input<FilterConfig[]>([]);

  //Estado actual de los filtros seleccionado
  currentState = input<FilterState>({});

  //Emite el nuevo estado cada vez que el usuario interactua
  stateChange = output<FilterState>();

  // Maneja cualquier tipo de filtro checkbox
  toggleCheckbox(key:string, value: string) {
    const current = this.currentState();
    const currentValues = (current[key] as string[]) ?? [];

    const updated = currentValues.includes(value) 
      ? currentValues.filter(v => v !== value)
      :[...currentValues, value];

      this.stateChange.emit({...current, [key]: updated});

  }

  //Maneja filtros de rango(precio, metros, peso, etc)
  updateRange(key: string, event: Event) {
    const value = Number((event.target as HTMLInputElement).value);
    this.stateChange.emit({...this.currentState(), [key]: value});
  }

  //Helper para saber si un checkbox esta activo
  isChecked(key: string, value: string) : boolean {
    return ((this.currentState()[key] as string[]) ?? []).includes(value);
  }

  // Helper para obtener el valor actual de un rango 
  getRangeValue(key: string) : number {
    return (this.currentState()[key] as number) ?? 0;
  }

  onSelectChange(key: string, event: Event) {
  const value = (event.target as HTMLSelectElement).value;
    if (value) {
      this.toggleCheckbox(key, value);
    }
  }

}
