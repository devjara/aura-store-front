/**
 * CheckoutPayload — Modelo de dominio intermedio del checkout.
 *
 * Contiene todos los datos necesarios para crear una orden en PrestaShop
 * vía el WS nativo. El CheckoutComponent lo construye, lo sanitiza
 * y lo pasa al OrderService sin conocer los detalles de la API de PS.
 */

export type PaymentMethod = 'CARD' | 'PAYPAL' | 'CASH';

export interface CheckoutCustomer {
  email: string;
  firstName: string;
  lastName: string;
  /** true = comprador invitado, false = usuario registrado */
  isGuest: boolean;
  /** Solo presente si isGuest = false */
  customerId?: number;
  dni: string;
}

export interface CheckoutShipping {
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
}

export interface CheckoutPaymentInfo {
  method: PaymentMethod;
  token?: string; /** Token de MercadoPago Brick (tarjeta) */
  transactionId?: string;  /** Transaction ID de PayPal después del capture */
}

export interface CheckoutPayload {
  customer: CheckoutCustomer;
  shipping: CheckoutShipping;
  cart: { productId: number; quantity: number; price: number, productName: string }[];
  payment: CheckoutPaymentInfo;
  total: number;
}

/** Respuesta exitosa del OrderService */
export interface OrderConfirmation {
  orderId: number;
  reference: string;
  total: number;
  paymentMethod: PaymentMethod;
}
