/**
 * Modelo de Dominio Angular para la Libreta de Direcciones.
 * Tipado estricto, sin metadata técnica de Backend.
 */
export interface Address {
  id: number;
  customerId: number;
  alias: string;     // Ej. "Mi Casa", "Trabajo"
  firstName: string; // Quien recibe
  lastName: string;  // Quien recibe
  address1: string;  // Calle y número
  city: string;      // Ciudad
  postcode: string;  // Código Postal
  phone: string;     // Teléfono de contacto logístico
}
