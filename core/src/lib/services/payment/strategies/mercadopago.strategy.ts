import { Injectable, inject } from '@angular/core';
import { PaymentStrategyProvider, PayEvent } from '../../../contracts/payment.contract';
import { PaymentStrategyService } from '../payment-strategy.service';

declare let window: any;

@Injectable({
  providedIn: 'root'
})
export class MercadoPagoStrategy implements PaymentStrategyProvider {
  readonly providerId = 'MERCADOPAGO';
  private strategyService = inject(PaymentStrategyService);
  
  private publicKey = 'TEST-d11ae4fb-fb7c-4f4f-accc-40d8d7eaf68f';
  private mpInstance: any;
  private bricksBuilder: any;
  private cardPaymentController: any;

  async initialize(config?: Record<string, unknown>): Promise<void> {
    await this.strategyService.loadScript('https://sdk.mercadopago.com/js/v2');
    
    if (window.MercadoPago) {
      this.mpInstance = new window.MercadoPago(this.publicKey, { locale: 'es-MX' });
      this.bricksBuilder = this.mpInstance.bricks();
    }
  }

  async renderUI(
    containerId: string, 
    callbacks: { onSuccess: (event: PayEvent) => void; onError: (error: unknown) => void; }
  ): Promise<void> {
    if (!this.bricksBuilder) {
      throw new Error('MercadoPago no fue inicializado correctamente.');
    }

    // El container tiene que estar vacío
    const container = document.getElementById(containerId);
    if (container) container.innerHTML = '';

    const brickConfig = {
      initialization: {
        amount: 100, // Se recomienda sobreescribir desde checkout
      },
      customization: {
        visual: {
          style: { theme: 'default' },
          hideFormTitle: true,
        }
      },
      callbacks: {
        onReady: () => {
          console.log('[MercadoPago Strategy] Brick renderizado.');
        },
        onSubmit: (cardFormData: any) => {
          callbacks.onSuccess({
            status: 'SUCCESS',
            provider: this.providerId,
            payload: {
              method: 'CARD', // O CARD_MP si lo requieres
              token: cardFormData.token,
            }
          });
          return Promise.resolve();
        },
        onError: (error: any) => {
          console.error('[MercadoPago Strategy Error]', error);
          callbacks.onError(error);
        }
      }
    };

    try {
      this.cardPaymentController = await this.bricksBuilder.create("cardPayment", containerId, brickConfig);
    } catch (e) {
      callbacks.onError(e);
    }
  }

  destroy(): void {
    if (this.cardPaymentController && typeof this.cardPaymentController.unmount === 'function') {
      try {
        this.cardPaymentController.unmount();
      } catch(e) {
        console.error('[MercadoPago Strategy Error]', e);
      }
    }
    const container = document.getElementById('payment-container'); // o parametrizar
    if (container) container.innerHTML = '';
  }
}
