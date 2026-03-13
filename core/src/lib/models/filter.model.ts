export type FilterType  = 'checkbox' | 'range' | 'select' | 'toggle';

export interface FilterOption {
    label: string;
    value: string;
}

export interface FilterConfig {
    key: string; // Identificador unico: category, material, size
    label: string; //texto visble: Categorias, Material, Talla
    type: FilterType;
    options?: FilterOption[]; // para checkbox y select
    min?: number; //range
    max?: number; //range
}

export interface FilterState {
    [key:string] : string[] | number;
}