import { Injectable, inject } from '@angular/core';
import { PaymentStrategyProvider, PayEvent } from '../../../contracts/payment.contract';
import { PaymentStrategyService } from '../payment-strategy.service';

declare let window: any;

@Injectable({
  providedIn: 'root'
})
export class PayPalStrategy implements PaymentStrategyProvider {
  readonly providerId = 'PAYPAL';
  private strategyService = inject(PaymentStrategyService);
  
  private clientId = 'ATPuQkBISVu-IPT_Bcia6m0pJ-kJRinudvV_5FkGmZBecC9C1Zm6t-_HuC0Y909o_hFyFE-jqUbcSgBE';

  async initialize(config?: Record<string, unknown>): Promise<void> {
    await this.strategyService.loadScript(`https://www.paypal.com/sdk/js?client-id=${this.clientId}&currency=MXN`);
  }

  async renderUI(
    containerId: string, 
    callbacks: { onSuccess: (event: PayEvent) => void; onError: (error: unknown) => void; },
    options?: Record<string, any>
  ): Promise<void> {
    if (!window.paypal) {
      throw new Error('PayPal SDK no cargó correctamente.');
    }

    const container = document.getElementById(containerId);
    if (container) container.innerHTML = '';

    const amountStr = options && options['amount'] ? Number(options['amount']).toFixed(2) : '0.00';

    window.paypal.Buttons({
      createOrder: (data: any, actions: any) => {
        return actions.order.create({
          purchase_units: [{
            amount: { value: amountStr }
          }]
        });
      },
      onApprove: (data: any, actions: any) => {
        return actions.order.capture().then((details: any) => {
          callbacks.onSuccess({
            status: 'SUCCESS',
            provider: this.providerId,
            payload: {
              method: 'PAYPAL',
              transactionId: details.id
            }
          });
        }).catch((err: any) => {
          callbacks.onError(err);
        });
      },
      onError: (err: any) => {
        callbacks.onError(err);
      }
    }).render(`#${containerId}`);
  }

  destroy(): void {
    // PayPal Smart Buttons se limpian vaciando el contenedor.
    const container = document.getElementById('payment-container'); // O el containerId usado
    if (container) container.innerHTML = '';
  }
}
