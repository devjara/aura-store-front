/**
 * Representa el resultado estándar de un intento de cobro
 * independientemente de la pasarela usada.
 */
export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  errorMessage?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ERROR';
}

export interface PayEvent {
  status: 'SUCCESS' | 'ERROR';
  provider: string;
  payload: {
    method: 'CARD' | 'PAYPAL' | 'STRIPE' | 'CASH';
    token?: string;
    transactionId?: string;
  };
  error?: any;
}

/**
 * Patrón Strategy: Contrato Universal de Pasarela de Pago Frontend.
 * Cualquier sistema de pago (MercadoPago, PayPal, Stripe, Conekta, etc.)
 * DEBE implementar esta interfaz estricta para conectarse a Aura Checkout.
 */
export interface PaymentStrategyProvider {
  /** Identificador único de la pasarela ej: "STRIPE" */
  readonly providerId: string;

  /**
   * Inicializa la pasarela y carga los scripts necesarios.
   * DEBE ser idempotente: llamarlo N veces = mismo resultado que llamarlo 1 vez.
   */
  initialize(config?: Record<string, unknown>): Promise<void>;

  /**
   * Renderiza el componente visual nativo dentro del contenedor dado.
   */
  renderUI(
    containerId: string,
    callbacks: {
      onSuccess: (event: PayEvent) => void;
      onError:   (error: any)      => void;
    },
    options?: Record<string, any>
  ): Promise<void>;

  /** Limpia el DOM cuando el usuario cambia de método o sale del checkout. */
  destroy(): void;
}