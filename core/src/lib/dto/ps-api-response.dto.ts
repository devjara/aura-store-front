export interface PsApiResponseDTO<T>
{
    products?: T[];
    categories?: T[];
    customers?: T[];
    order?: T;
    cart?: T;
    address?: T;
    customer?: T;
}