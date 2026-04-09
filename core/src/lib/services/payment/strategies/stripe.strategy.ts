import { Injectable, inject } from '@angular/core';
import { PaymentStrategyProvider, PayEvent } from '../../../contracts/payment.contract';
import { PaymentStrategyService } from '../payment-strategy.service';

declare const window: any;

/**
 * StripeStrategy — implementación del contrato para Stripe.js v3.
 *
 * Ciclo de vida:
 *   initialize()  → carga js.stripe.com una sola vez, crea stripe + elements.
 *   renderUI()    → monta el cardElement en el container dado.
 *   destroy()     → desmonta cardElement y limpia el container.
 *
 * initialize() es idempotente: la segunda llamada es un no-op inmediato.
 * Esto elimina el delay al volver al paso 2 o cambiar de método y regresar.
 */
@Injectable({ providedIn: 'root' })
export class StripeStrategy implements PaymentStrategyProvider {
  readonly providerId = 'STRIPE';
  readonly containerId = 'stripe-payment-container';

  private strategyService = inject(PaymentStrategyService);

  // FIX: Mover a environment.ts antes de producción
  // private publicKey = environment.stripePublicKey;
  private readonly publicKey = 'pk_test_51TJxzmRvYLD3EmWxBBqkBpDf2iQvkGN8iTNKn4Xf7zs4OT4UxRNSPaQsWsiKYQjf7PAtJskV3qF40VzswkyXKd8900IxJIG7lv';

  private stripe:      any  = null;
  private elements:    any  = null;
  private cardElement: any  = null;
  private initialized       = false; // guard principal contra re-init

  // ── initialize ───────────────────────────────────────────────────────────

  async initialize(_config?: Record<string, unknown>): Promise<void> {
    if (this.initialized) return;

    await this.strategyService.loadScript('https://js.stripe.com/v3/');

    if (!window.Stripe) throw new Error('[StripeStrategy] window.Stripe no disponible tras cargar el SDK.');

    // Inyectar keyframe de spin una sola vez para el spinner del botón
    if (!document.getElementById('aura-stripe-styles')) {
      const style = document.createElement('style');
      style.id = 'aura-stripe-styles';
      style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
      document.head.appendChild(style);
    }

    this.stripe      = window.Stripe(this.publicKey);
    this.elements    = this.stripe.elements();
    this.initialized = true;
  }

  // ── renderUI ─────────────────────────────────────────────────────────────

  async renderUI(
    containerId: string,
    callbacks: { onSuccess: (event: PayEvent) => void; onError: (error: unknown) => void },
    _options?: Record<string, any>
  ): Promise<void> {
    if (!this.stripe || !this.elements) {
      throw new Error('[StripeStrategy] Llamar initialize() antes de renderUI().');
    }

    const container = document.getElementById(containerId);
    if (!container) throw new Error(`[StripeStrategy] Contenedor #${containerId} no encontrado.`);

    // Si hay un cardElement previo, destruirlo completamente del registro
    // interno de Stripe antes de crear uno nuevo — unmount() solo no es suficiente.
    if (this.cardElement) {
      this.cardElement.unmount();
      this.cardElement.destroy();
      this.cardElement = null;
    }

    container.innerHTML = `
      <div style="padding: 20px 0 4px 0;">

        <label style="display:block; font-size:10px; font-weight:700; color:#94a3b8;
                      text-transform:uppercase; letter-spacing:0.12em; margin-bottom:8px;">
          Datos de tarjeta
        </label>

        <!-- Stripe monta aquí el iframe del campo unificado -->
        <div id="stripe-card-element"
             style="padding: 13px 16px;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 12px;
                    background: #f8fafc;
                    transition: border-color 0.2s;">
        </div>

        <!-- Error inline -->
        <div id="stripe-card-errors"
             style="min-height:18px; font-size:11px; font-weight:700;
                    color:#f43f5e; margin: 8px 0 16px; letter-spacing:0.02em;">
        </div>

        <!-- Botón confirmar -->
        <button id="stripe-submit-btn"
                style="width:100%; background:#0f172a; color:#fff; border:none;
                       border-radius:12px; padding:14px 24px; font-size:13px;
                       font-weight:700; letter-spacing:0.04em; cursor:pointer;
                       display:flex; align-items:center; justify-content:center; gap:8px;
                       transition: opacity 0.15s, transform 0.1s;">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" stroke-linejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
            <line x1="1" y1="10" x2="23" y2="10"></line>
          </svg>
          Confirmar pago
        </button>

        <p style="text-align:center; font-size:10px; color:#cbd5e1; font-weight:600;
                  margin-top:12px; display:flex; align-items:center; justify-content:center; gap:4px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          Cifrado SSL · Procesado por Stripe
        </p>
      </div>
    `;

    // Crear y montar el cardElement — operación rápida, sin network request
    this.cardElement = this.elements.create('card', {
      style: {
        base: {
          color: '#1e293b',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          fontSmoothing: 'antialiased',
          fontSize: '15px',
          fontWeight: '500',
          '::placeholder': { color: '#cbd5e1' },
          iconColor: '#64748b',
        },
        invalid: {
          color: '#f43f5e',
          iconColor: '#f43f5e',
        },
        complete: {
          color: '#0f172a',
          iconColor: '#10b981',
        }
      },
      hidePostalCode: true,
    });

    this.cardElement.mount('#stripe-card-element');

    // Focus visual en el container cuando el usuario interactúa con el campo
    const cardContainer = document.getElementById('stripe-card-element');
    this.cardElement.on('focus', () => {
      if (cardContainer) cardContainer.style.borderColor = '#0f172a';
    });
    this.cardElement.on('blur', () => {
      if (cardContainer) cardContainer.style.borderColor = '#e2e8f0';
    });

    this.cardElement.on('change', (event: any) => {
      const el = document.getElementById('stripe-card-errors');
      if (el) el.textContent = event.error?.message ?? '';
      if (cardContainer) {
        cardContainer.style.borderColor = event.error ? '#f43f5e' : event.complete ? '#10b981' : '#e2e8f0';
      }
    });

    const btn = document.getElementById('stripe-submit-btn') as HTMLButtonElement | null;
    if (btn) {
      btn.addEventListener('mouseenter', () => { btn.style.background = '#1e293b'; });
      btn.addEventListener('mouseleave', () => { if (!btn.disabled) btn.style.background = '#0f172a'; });

      btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.style.opacity = '0.7';
        btn.innerHTML = `
          <svg style="animation: spin 0.8s linear infinite; width:15px; height:15px;"
               xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle style="opacity:.25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path style="opacity:.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          Procesando...
        `;

        try {
          const { token, error } = await this.stripe.createToken(this.cardElement);
          if (error) {
            const el = document.getElementById('stripe-card-errors');
            if (el) el.textContent = error.message;
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" stroke-width="2.5"
                   stroke-linecap="round" stroke-linejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                <line x1="1" y1="10" x2="23" y2="10"></line>
              </svg>
              Confirmar pago
            `;
          } else {
            callbacks.onSuccess({
              status:   'SUCCESS',
              provider: this.providerId,
              payload:  { method: 'STRIPE', token: token.id }
            });
          }
        } catch (err) {
          callbacks.onError(err);
          btn.disabled = false;
          btn.style.opacity = '1';
          btn.textContent = 'Confirmar pago';
        }
      });
    }
  }

  // ── destroy ──────────────────────────────────────────────────────────────

  destroy(): void {
    if (this.cardElement) {
      // unmount() solo lo saca del DOM visualmente.
      // destroy() lo elimina del registro interno de Stripe — sin esto,
      // la próxima llamada a elements.create('card') lanza
      // "Can only create one Element of type card".
      this.cardElement.unmount();
      this.cardElement.destroy();
      this.cardElement = null;
    }

    const container = document.getElementById(this.containerId);
    if (container) container.innerHTML = '';

    // NO resetear this.initialized — stripe y elements siguen siendo válidos.
    // La próxima llamada a renderUI puede reutilizarlos directamente.
  }
}