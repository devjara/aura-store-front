export interface PsCartRowDTO 
{
    id_product: string;
    id_product_attribute: string;
    quantity: string;
}

export interface PsCartDTO
{
    id: number;
    id_customer: string;
    id_currency: string;
    associations?: {
        cart_rows?: PsCartRowDTO[];
    }
}