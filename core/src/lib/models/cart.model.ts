/**
 * Representa el carrito de compras completo del cliente
 * Es el model limpio mapeado desde PsCartDTO
 */
export interface Cart 
{
    id: number;
    customerId: number;
    currencyId: number;
    items: CartItem[];
}

/**
 * Variación de un producto en el carrito.
 * Mapeado desde PsProductOptionDTO + PsProductOptionValueDTO.
 * Ejemplos: { label: 'Color', value: 'Rojo' }, { label: 'Talla', value: 'XL' }
 */
export interface CartItemVariation {
    label: string;
    value: string;
}

/**
 * Item del carrito enriquecido para mostrar en el drawer.
 * Se ensambla cruzando CartItem con datos de productos, imágenes y combinaciones.
 * Es lo que consume aura-cart-drawer en shared-ui.
 */
export interface CartItemView {
    productId: number;
    productAttributeId: number;
    quantity: number;
    name: string;
    price: number;
    imageUrl: string;
    variations?: CartItemVariation[];   
}

/**
 * Item crudo del carrito — solo IDs.
 * Mapeado desde PsCartRowDTO.
 * No contiene nombre, imagen ni variaciones — solo referencias a Prestashop.
 * Para mostrar en UI usar CartItemView.
 */
export interface CartItem 
{
    productId: number;
    productAttributeId: number;
    quantity: number;
}

