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
  address1: string;
  postcode: string;
  city: string;
  phone: string;
  phone_mobile?: string;
}

export interface PsAddressResponse {
  addresses: PsAddressDto[];
}
