/**
 * Representa una fila del carrito en Prestashop (raw).
 * Cada fila es un producto con una combinación específica y su cantidad.
 * Se mapea a CartItem en el model.
 */
export interface PsCartRowDTO 
{
    id_product: string;
    id_product_attribute: string;
    quantity: string;
}

/**
 * Representa el carrito completo devuelto por Prestashop (raw).
 * Endpoint: GET /api/carts/{id}?display=full
 * Se mapea a Cart en el model.
 *
 * @remarks
 * - `associations.cart_rows` puede ser undefined si el carrito está vacío.
 * - Todos los IDs vienen como string desde la API de Prestashop.
 * - Para obtener nombre, imagen y variaciones de cada item
 *   se deben cruzar los cart_rows con los endpoints
 *   /products, /combinations y /product_option_values.
 */
export interface PsCartDTO
{
    id: number;
    id_customer: string;
    id_currency: string;
    associations?: {
        cart_rows?: PsCartRowDTO[];
    }
}