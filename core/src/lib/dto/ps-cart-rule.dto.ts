/**
 * DTO que mapea la respuesta nativa del recurso /api/cart_rules de PrestaShop.
 * Representa los cupones de descuento o recompensas (Rewards).
 */
export interface PsCartRuleDto {
  id: number;
  id_customer: string;
  date_from: string;
  date_to: string;
  description: string;
  quantity: string;
  quantity_per_user: string;
  code: string;
  minimum_amount: string;
  minimum_amount_tax: string;
  minimum_amount_currency: string;
  minimum_amount_shipping: string;
  free_shipping: string;
  reduction_percent: string;
  reduction_amount: string;
  reduction_tax: string;
  reduction_currency: string;
  active: string;
  highlight: string;
  date_add: string;
  date_upd: string;
}

export interface PsCartRuleResponse {
  cart_rules: PsCartRuleDto[];
}
