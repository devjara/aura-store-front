import { InjectionToken } from '@angular/core';
import { CheckoutPayload, OrderConfirmation } from '../models/checkout-payload.model';

/**
 * OrderContract — Contrato abstracto para la creación de órdenes.
 *
 * Sigue el mismo patrón que AuthContract: los componentes dependen
 * de la abstracción, no de la implementación concreta de PrestaShop.
 * Si en el futuro se usa Shopify o una API propia, solo cambia
 * la implementación registrada en app.config.ts.
 */
export abstract class OrderContract {
  /**
   * Crea una orden completa en el backend de e-commerce.
   * Maneja internamente: cliente, dirección, carrito y orden.
   *
   * @param payload Datos sanitizados del checkout
   * @returns Confirmación con id_order y referencia legible
   * @throws 'ORDER_CUSTOMER_EXISTS'     — email de guest ya está registrado como usuario
   * @throws 'ORDER_PAYMENT_FAILED'      — el token/transactionId no fue válido
   * @throws 'ORDER_STOCK_UNAVAILABLE'   — uno o más productos sin stock
   * @throws 'ORDER_SERVICE_ERROR'       — error genérico del backend
   */
  abstract placeOrder(payload: CheckoutPayload): Promise<OrderConfirmation>;
}

export const ORDER_CONTRACT = new InjectionToken<OrderContract>('ORDER_CONTRACT');
