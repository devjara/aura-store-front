/**
 * Modelo de dominio para las Órdenes de compra.
 * Estructura tipada sin basura del backend para uso en la UI del Portal.
 */
export interface Order {
  id: number;
  customerId: number;
  currentState: string;
  paymentMethod: string;
  totalPaid: number;
  reference: string;
  dateAdd: Date;
}
