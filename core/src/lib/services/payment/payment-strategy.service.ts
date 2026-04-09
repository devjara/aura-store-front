import { Injectable, inject, DOCUMENT } from '@angular/core';
import { PaymentStrategyProvider, PayEvent } from '../../contracts/payment.contract';

/**
 * PaymentStrategyService — El Contexto del patrón Strategy.
 *
 * Responsabilidades:
 * - Mantener la strategy activa y delegar initialize/renderUI/destroy.
 * - Proveer loadScript() robusto compartido por todas las strategies.
 * - NO conoce ninguna pasarela concreta — solo habla con el contrato.
 *
 * Para agregar Conekta, OpenPay, etc: crear la Strategy, inyectarla en
 * el componente, y llamar setStrategy(). Este servicio no cambia nunca.
 */
@Injectable({ providedIn: 'root' })
export class PaymentStrategyService {
  private document       = inject(DOCUMENT);
  private activeStrategy?: PaymentStrategyProvider;

  // Cache de scripts ya cargados — sobrevive cambios de strategy.
  // Clave: src del script. Valor: Promise que resuelve cuando onload dispara.
  // FIX: guardar la Promise (no solo un booleano) evita el race condition donde
  // el <script> ya está en el DOM pero window.Stripe todavía es undefined.
  private scriptCache = new Map<string, Promise<void>>();

  // ── Strategy management ──────────────────────────────────────────────────

  setStrategy(strategy: PaymentStrategyProvider): void {
    // Si hay una strategy activa diferente, limpiar su DOM antes de cambiar
    if (this.activeStrategy && this.activeStrategy.providerId !== strategy.providerId) {
      this.activeStrategy.destroy();
    }
    this.activeStrategy = strategy;
  }

  get activeProviderId(): string | null {
    return this.activeStrategy?.providerId ?? null;
  }

  async initializeActiveProvider(config?: Record<string, unknown>): Promise<void> {
    if (!this.activeStrategy) throw new Error('[PaymentService] No hay pasarela seleccionada.');
    await this.activeStrategy.initialize(config);
  }

  async renderUI(
    containerId: string,
    callbacks: { onSuccess: (event: PayEvent) => void; onError: (error: unknown) => void },
    options?: Record<string, any>
  ): Promise<void> {
    if (!this.activeStrategy) throw new Error('[PaymentService] No hay pasarela seleccionada.');
    await this.activeStrategy.renderUI(containerId, callbacks, options);
  }

  // ── Script loader ────────────────────────────────────────────────────────

  /**
   * Carga un script externo de forma segura y cacheable.
   *
   * FIX vs versión anterior: el querySelector solo verificaba que el <script>
   * existía en el DOM, pero no que window.Stripe (o window.MercadoPago) ya
   * estuviera disponible — si llamabas loadScript() dos veces casi al mismo
   * tiempo, ambas llamadas pasaban el querySelector y cada una creaba su propio
   * <script>, causando doble carga y condición de carrera.
   *
   * Ahora se guarda la Promise misma en el cache. La segunda llamada recibe
   * la misma Promise que la primera y espera a que el onload original se dispare.
   */
  loadScript(src: string): Promise<void> {
    // Ya está cargando o cargado — devolver la misma Promise
    if (this.scriptCache.has(src)) {
      return this.scriptCache.get(src)!;
    }

    const promise = new Promise<void>((resolve, reject) => {
      // Doble check: si por alguna razón el script ya está en el DOM
      // (cargado por otra parte de la app), resolver inmediatamente
      if (this.document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }

      const script    = this.document.createElement('script');
      script.src      = src;
      script.async    = true;
      script.onload   = () => resolve();
      script.onerror  = () => {
        // Si falla, remover del cache para permitir reintentar
        this.scriptCache.delete(src);
        reject(new Error(`[PaymentService] No se pudo cargar: ${src}`));
      };
      this.document.head.appendChild(script);
    });

    this.scriptCache.set(src, promise);
    return promise;
  }
}