export interface CartItem 
{
    productId: number;
    productAttributeId: number;
    quantity: number;
}

export interface Cart 
{
    id: number;
    customerId: number;
    currencyId: number;
    items: CartItem[];
}