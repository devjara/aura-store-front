/**
 * DTO que mapea la respuesta nativa del recurso /api/addresses de PrestaShop.
 * Omite campos innecesarios como id_country si son fijos o no usados en la UI MVP.
 */
export interface PsAddressDto {
  id: number;
  id_customer: string;
  alias: string;
  firstname: string;
  lastname: string;
  company?: string;
  address1: string;
  address2?: string;
  postcode: string;
  city: string;
  id_state?: string;
  id_country?: string;
  phone: string;
  phone_mobile?: string;
  vat_number?: string;
  dni?: string;
}

export interface PsAddressResponse {
  addresses: PsAddressDto[];
}
