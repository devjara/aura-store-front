import { CartItemView } from "./cart.model";


/**
 * Regla para persistir el carrito
 * 1 dia = Usuario no autenticado
 * 3 dias = Usuario autenticado
 */
export interface StoredCard
{
   items: CartItemView[];
   expiresAt: number;
   authenticated: boolean
}
