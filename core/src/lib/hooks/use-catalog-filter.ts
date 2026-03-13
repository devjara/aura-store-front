import { computed, signal, Signal } from "@angular/core";
import { FilterState } from "../models/filter.model";

export function useCatalogFilter<T>(items: Signal<T[]>, filterFn:(item: T, state: FilterState) => boolean)
{
    const filterState = signal<FilterState>({});
    const filteredItems = computed(() => {
        const state = filterState();
        const hasFilters = Object.keys(state).length > 0;
        if(!hasFilters) return items();
        return items().filter(item => filterFn(item, state));
    });

    return {filterState, filteredItems};
}