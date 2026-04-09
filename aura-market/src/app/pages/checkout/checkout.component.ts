import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  AUTH_CONTRACT, CartService, AuraValidators, SECURITY_LIMITS,
  sanitizeFormPayload, sanitizeEmail,
  ORDER_CONTRACT, CheckoutPayload,
  PaymentStrategyService,
  StripeStrategy,
  MercadoPagoStrategy,
  PayPalStrategy,
} from '@aura-store-front/core';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

// Tipos de métodos de pago soportados
type PaymentMethod = 'STRIPE' | 'CARD' | 'PAYPAL' | 'CASH';

// Configuración centralizada del mapa strategy ↔ containerId.
// Para agregar Conekta: { strategy: ConektaStrategy, containerId: 'conekta-container' }
// El componente NO cambia — solo se agrega una entrada aquí y su container en el HTML.
type StrategyConfig = {
  containerId: string;
  // La instancia se inyecta en el componente y se asigna en buildStrategyMap()
  strategy?: any;
};

const STRATEGY_MAP_CONFIG: Record<Exclude<PaymentMethod, 'CASH'>, StrategyConfig> = {
  STRIPE: { containerId: 'stripe-payment-container' },
  CARD:   { containerId: 'cardPaymentBrick_container' },
  PAYPAL: { containerId: 'paypal-button-container'   },
};

@Component({
  selector: 'aura-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './checkout.component.html'
})
export class CheckoutComponent implements OnInit, OnDestroy {
  private fb           = inject(FormBuilder);
  private auth         = inject(AUTH_CONTRACT);
  private orderService = inject(ORDER_CONTRACT);
  private router       = inject(Router);
  public  cartService  = inject(CartService);

  // Servicio contexto del patrón Strategy
  private paymentService  = inject(PaymentStrategyService);
  private stripeStrategy  = inject(StripeStrategy);
  private mpStrategy      = inject(MercadoPagoStrategy);
  private paypalStrategy  = inject(PayPalStrategy);

  // Estados
  public isLoggedIn  = this.auth.isLoggedIn;
  public currentUser = this.auth.currentUser;

  public currentStep           = signal<1 | 2>(1);
  public selectedPaymentMethod = signal<PaymentMethod>('STRIPE');
  public isLoadingGateways     = signal<boolean>(false);
  public isPlacingOrder        = signal<boolean>(false);
  public orderError            = signal<string | null>(null);

  private readonly destroy$      = new Subject<void>();
  private readonly paymentClick$ = new Subject<void>();

  public contactForm!: FormGroup;
  public shippingForm!: FormGroup;

  // Mapa completo strategy + containerId, construido en ngOnInit con las instancias inyectadas.
  // Se define aquí (no como constante del módulo) porque necesita las instancias del DI.
  private strategyMap!: Record<Exclude<PaymentMethod, 'CASH'>, StrategyConfig>;

  ngOnInit() {
    // Construir el mapa asignando las instancias inyectadas
    this.strategyMap = {
      STRIPE: { containerId: 'stripe-payment-container',   strategy: this.stripeStrategy  },
      CARD:   { containerId: 'cardPaymentBrick_container', strategy: this.mpStrategy      },
      PAYPAL: { containerId: 'paypal-button-container',    strategy: this.paypalStrategy  },
    };

    this.initForms();

    this.paymentClick$
      .pipe(debounceTime(1500), takeUntil(this.destroy$))
      .subscribe(() => this._doAdvanceToPayment());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    // El paymentService llama destroy() de la strategy activa internamente
    // al hacer setStrategy() — pero si destruimos el componente sin cambiar,
    // necesitamos limpieza manual
    const method = this.selectedPaymentMethod();
    if (method !== 'CASH') {
      this.strategyMap[method]?.strategy?.destroy?.();
    }
  }

  // ── Formularios ──────────────────────────────────────────────────────────

  private initForms() {
    const prefillEmail    = this.currentUser()?.email     || '';
    const prefillName     = this.currentUser()?.firstname || '';
    const prefillLastname = this.currentUser()?.lastname  || '';

    this.contactForm = this.fb.group({
      email: [prefillEmail, [
        Validators.required, Validators.maxLength(SECURITY_LIMITS.MAX_EMAIL_LEN),
        AuraValidators.strictEmail, AuraValidators.xssSafe, AuraValidators.sqlSafe,
      ]]
    });

    this.shippingForm = this.fb.group({
      firstName: [prefillName,     [Validators.required, Validators.maxLength(SECURITY_LIMITS.MAX_NAME_LEN), AuraValidators.humanName, AuraValidators.sqlSafe, AuraValidators.xssSafe]],
      lastName:  [prefillLastname, [Validators.required, Validators.maxLength(SECURITY_LIMITS.MAX_NAME_LEN), AuraValidators.humanName, AuraValidators.sqlSafe, AuraValidators.xssSafe]],
      address:   ['', [Validators.required, AuraValidators.safeAddress]],
      phone:     ['', [Validators.required, AuraValidators.strictPhone]],
      city:      ['', [Validators.required, Validators.maxLength(SECURITY_LIMITS.MAX_CITY_LEN), AuraValidators.humanName, AuraValidators.sqlSafe]],
      state:     ['', [Validators.required, Validators.maxLength(SECURITY_LIMITS.MAX_CITY_LEN), AuraValidators.humanName, AuraValidators.sqlSafe]],
      zip:       ['', [Validators.required, AuraValidators.strictZip]],
    });
  }

  // ── Navegación entre pasos ───────────────────────────────────────────────

  public advanceToPayment() {
    this.paymentClick$.next();
  }

  private _doAdvanceToPayment() {
    const isContactOK = this.isLoggedIn() ? true : this.contactForm.valid;
    if (isContactOK && this.shippingForm.valid) {
      this.currentStep.set(2);
      // setTimeout(0) no es suficiente — @if(currentStep() === 2) destruye y
      // recrea el DOM completo, Angular puede necesitar varios ciclos.
      // _waitForContainer() hace polling cada 50ms hasta que el div exista.
      const method = this.selectedPaymentMethod();
      if (method !== 'CASH') {
        const containerId = this.strategyMap[method as Exclude<PaymentMethod, 'CASH'>]?.containerId;
        if (containerId) {
          this._waitForContainer(containerId).then(() => this._initActiveGateway());
        }
      }
    } else {
      this.contactForm.markAllAsTouched();
      this.shippingForm.markAllAsTouched();
    }
  }

  public goBackToShipping() {
    // paymentService.setStrategy() llama destroy() internamente,
    // pero al volver al paso 1 no hay cambio de strategy — destruir manualmente
    const method = this.selectedPaymentMethod();
    if (method !== 'CASH') {
      this.strategyMap[method]?.strategy?.destroy?.();
    }
    this.currentStep.set(1);
  }

  // ── Selección de método ──────────────────────────────────────────────────

  public selectPaymentMethod(method: PaymentMethod) {
    if (this.selectedPaymentMethod() === method) return;

    // setStrategy() destruye la anterior y activa la nueva
    const config = method !== 'CASH' ? this.strategyMap[method] : null;
    if (config?.strategy) {
      this.paymentService.setStrategy(config.strategy);
    }

    this.selectedPaymentMethod.set(method);

    if (this.currentStep() === 2 && method !== 'CASH') {
      const containerId = this.strategyMap[method as Exclude<PaymentMethod, 'CASH'>]?.containerId;
      if (containerId) {
        this._waitForContainer(containerId).then(() => this._initActiveGateway());
      }
    }
  }

  // ── Orquestación de pasarelas ────────────────────────────────────────────

  /**
   * Inicializa la pasarela activa.
   * El componente NO sabe qué SDK se va a cargar — eso lo decide la Strategy.
   * Gracias al guard initialized en cada Strategy, la segunda llamada es instantánea.
   */
  private async _initActiveGateway() {
    if (this.isLoadingGateways()) return;

    const method = this.selectedPaymentMethod();
    if (method === 'CASH') return;

    const config = this.strategyMap[method];
    if (!config?.strategy) {
      this.orderError.set('Este método de pago no está disponible aún.');
      return;
    }

    this.isLoadingGateways.set(true);
    this.orderError.set(null);

    try {
      this.paymentService.setStrategy(config.strategy);
      await this.paymentService.initializeActiveProvider();
      await this.paymentService.renderUI(
        config.containerId,
        {
          onSuccess: async (event) => {
            await this._placeOrder(event.payload);
          },
          onError: (error: any) => {
            console.error('[Checkout] Gateway error:', error);
            this.isLoadingGateways.set(false);
            this._handleOrderError(
              error instanceof Error ? error : new Error('Error en la pasarela de pago.')
            );
          }
        },
        { amount: this.cartService.subtotal() }
      );
    } catch (error) {
      console.error('[Checkout] Error inicializando pasarela:', error);
      this.orderError.set('No se pudo cargar la pasarela de pago. Intenta de nuevo.');
    } finally {
      this.isLoadingGateways.set(false);
    }
  }

  // ── Orden ────────────────────────────────────────────────────────────────

  /**
   * Punto de convergencia único para TODAS las pasarelas.
   * Stripe, MercadoPago, PayPal, Conekta — todos llegan aquí con su payload.
   */
  private async _placeOrder(payment: Record<string, any>) {
    this.isPlacingOrder.set(true);
    this.orderError.set(null);
    try {
      const payload   = this._buildPayload();
      payload.payment = payment as any;
      const confirmation = await this.orderService.placeOrder(payload);
      this.cartService.items.set([]);
      this.router.navigate(['/orden/confirmacion', confirmation.reference], {
        state: { paymentMethod: payment['method'] }
      });
    } catch (error) {
      this._handleOrderError(error);
    }
  }

  public async processGeneralPayment() {
    if (this.selectedPaymentMethod() !== 'CASH' || this.isPlacingOrder()) return;
    await this._placeOrder({ method: 'CASH' });
  }

  private _buildPayload(): CheckoutPayload {
    const safeShipping = sanitizeFormPayload(this.shippingForm.value);
    const user    = this.currentUser();
    const isGuest = !this.isLoggedIn();
    const email   = isGuest
      ? sanitizeEmail(this.contactForm.value.email)
      : sanitizeEmail(user?.email ?? '');

    return {
      customer: {
        email,
        firstName:  safeShipping['firstName'],
        lastName:   safeShipping['lastName'],
        isGuest,
        customerId: isGuest ? undefined : user?.id,
        dni: 'XAXX010101000'
      },
      shipping: {
        address: safeShipping['address'],
        city:    safeShipping['city'],
        state:   safeShipping['state'],
        zip:     safeShipping['zip'],
        phone:   safeShipping['phone'],
      },
      cart: this.cartService.items().map(i => ({
        productId:   i.productId,
        quantity:    i.quantity,
        price:       i.price,
        productName: i.name,
      })),
      payment: { method: this.selectedPaymentMethod() },
      total: this.cartService.subtotal(),
    };
  }

  private _handleOrderError(error: unknown): void {
    const msg = error instanceof Error ? error.message : '';
    const errorMap: Record<string, string> = {
      'ORDER_CUSTOMER_EXISTS':   'Este correo ya tiene una cuenta. Inicia sesión.',
      'ORDER_PAYMENT_FAILED':    'El pago no pudo procesarse. Revisa tu tarjeta.',
      'ORDER_STOCK_UNAVAILABLE': 'Sin stock disponible.',
    };
    this.orderError.set(errorMap[msg] ?? 'Error al procesar pedido. Intenta de nuevo.');
    this.isPlacingOrder.set(false);
  }

  /**
   * Espera (polling cada 50ms, máx 3s) a que un elemento con el id dado
   * aparezca en el DOM. Necesario porque @if() destruye y recrea los nodos
   * del template y Angular puede tardar más de un tick en crearlos.
   */
  private _waitForContainer(containerId: string, maxWaitMs = 3000): Promise<void> {
    return new Promise((resolve, reject) => {
      const interval = 50;
      let elapsed    = 0;
      const check    = () => {
        if (document.getElementById(containerId)) {
          resolve();
        } else if (elapsed >= maxWaitMs) {
          reject(new Error(`[Checkout] Timeout: #${containerId} no apareció en ${maxWaitMs}ms`));
        } else {
          elapsed += interval;
          setTimeout(check, interval);
        }
      };
      check();
    });
  }
}