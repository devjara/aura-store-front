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
  address2?: string; // Colonia o Interior
  city: string;      // Ciudad
  state: string;     // Provincia / Estado
  country: string;   // Fijo a México en MVP
  postcode: string;  // Código Postal
  phone: string;     // Teléfono de contacto logístico

  // Campos Fiscales
  requiresInvoice?: boolean;
  company?: string;   // Razón Social
  vatNumber?: string; // RFC
  dni?: string;       // Uso CFDI / Identificación
}

// Catálogo Inmutable Centralizado
export const MEXICO_STATES: readonly string[] = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 
  'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Estado de México', 
  'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 
  'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 
  'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
];
