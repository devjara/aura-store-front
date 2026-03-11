export interface FilterState 
{
    categoryId: number | null;
    minPrice: number | null;
    maxPrice: number | null;
    brands: number[];
    minRating: number | null;
    sortBy: string;
}