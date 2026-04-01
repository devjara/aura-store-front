/**
 * Modelos de dominio para las Órdenes de compra.
 * Estructura tipada sin basura del backend para uso en la UI del Portal.
 */

// Artículo Individual Comprado (Shipment Content)
export interface OrderItem {
  id: number;
  productId: number;
  name: string;
  quantity: number;
  unitPrice: number;    // Precio unitario base
  totalPrice: number;   // Precio total por la cantidad
}

// Resumen General de Orden (Historial / Cards)
export interface Order {
  id: number;
  customerId: number;
  currentState: string;
  paymentMethod: string;
  totalPaid: number;
  totalShipping?: number;
  reference: string;
  dateAdd: Date;
}

// Orden con su listado de contenidos completo (Rastreo Detallado)
export interface OrderDetail extends Order {
  items: OrderItem[];
}
