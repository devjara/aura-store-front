export interface PsApiResponseDTO<T>
{
    products?: T[];
    categories?: T[];
    customers?: T[];
}