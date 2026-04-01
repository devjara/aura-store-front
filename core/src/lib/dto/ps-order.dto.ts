// Sub-DTO: Relaciones de productos (Shipment Contents)
export interface PsOrderRowDto {
  id: string;
  product_id: string;
  product_name: string;
  product_quantity: string;
  product_price: string;
  unit_price_tax_incl: string;
}

export interface PsOrderAssociationsDto {
  order_rows?: PsOrderRowDto[];
}

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
  associations?: PsOrderAssociationsDto; // Añadido para el Detalle
}

export interface PsOrderResponse {
  orders: PsOrderDto[];
}
