/**
 * DTO que mapea la respuesta nativa del recurso /api/orders de PrestaShop.
 * Contiene únicamente los campos esenciales para el Dashboard y Mis Pedidos.
 */
export interface PsOrderDto {
  id: number;
  id_customer: string;
  id_cart: string;
  id_currency: string;
  id_lang: string;
  id_carrier: string;
  current_state: string;
  secure_key: string;
  payment: string;
  module: string;
  total_paid: string;
  total_paid_real: string;
  total_products: string;
  total_shipping: string;
  reference: string;
  date_add: string;
  date_upd: string;
}

export interface PsOrderResponse {
  orders: PsOrderDto[];
}
