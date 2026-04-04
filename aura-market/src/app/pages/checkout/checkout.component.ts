import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  AUTH_CONTRACT, CartService, AuraValidators, SECURITY_LIMITS,
  sanitizeFormPayload, sanitizeEmail,
  ORDER_CONTRACT, CheckoutPayload
} from '@aura-store-front/core';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

// ¡Temporal: LLaves de prueba! 🔑
const MERCADO_PAGO_PUBLIC_KEY = 'TEST-d11ae4fb-fb7c-4f4f-accc-40d8d7eaf68f';
const PAYPAL_CLIENT_ID = 'ATPuQkBISVu-IPT_Bcia6m0pJ-kJRinudvV_5FkGmZBecC9C1Zm6t-_HuC0Y909o_hFyFE-jqUbcSgBE';

declare var window: any;

@Component({
  selector: 'aura-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './checkout.component.html'
})
export class CheckoutComponent implements OnInit {
  private fb          = inject(FormBuilder);
  private auth        = inject(AUTH_CONTRACT);
  private orderService = inject(ORDER_CONTRACT);
  private router      = inject(Router);
  public  cartService = inject(CartService);
  private document   = inject(DOCUMENT);

  // Estados
  public isLoggedIn  = this.auth.isLoggedIn;
  public currentUser = this.auth.currentUser;

  public currentStep           = signal<1 | 2>(1);
  public selectedPaymentMethod = signal<'CARD' | 'PAYPAL' | 'CASH'>('CARD');
  public isLoadingGateways     = signal<boolean>(false);
  public isPlacingOrder        = signal<boolean>(false);
  public orderError            = signal<string | null>(null);

  // Anti Brute-Force: debounce en el botón de pago
  private readonly paymentClick$ = new Subject<void>();
  

  // Formularios
  public contactForm!: FormGroup;
  public shippingForm!: FormGroup;

  ngOnInit() {
    this.initForms();
    // Rate Limiting local: sólo procesa 1 intento de pago cada 1.5 segundos
    this.paymentClick$.pipe(debounceTime(1500)).subscribe(() => {
      this._doAdvanceToPayment();
    });
  }

  private initForms() {
    const prefillEmail = this.currentUser()?.email || '';
    const prefillName = this.currentUser()?.firstname || '';
    const prefillLastname = this.currentUser()?.lastname || '';

    this.contactForm = this.fb.group({
      email: [prefillEmail, [
        Validators.required,
        Validators.maxLength(SECURITY_LIMITS.MAX_EMAIL_LEN),
        AuraValidators.strictEmail,
        AuraValidators.xssSafe,
        AuraValidators.sqlSafe,
      ]]
    });

    this.shippingForm = this.fb.group({
      firstName: [prefillName, [
        Validators.required,
        Validators.maxLength(SECURITY_LIMITS.MAX_NAME_LEN),
        AuraValidators.humanName,
        AuraValidators.sqlSafe,
        AuraValidators.xssSafe,
      ]],
      lastName: [prefillLastname, [
        Validators.required,
        Validators.maxLength(SECURITY_LIMITS.MAX_NAME_LEN),
        AuraValidators.humanName,
        AuraValidators.sqlSafe,
        AuraValidators.xssSafe,
      ]],
      address: ['', [
        Validators.required,
        AuraValidators.safeAddress,
      ]],
      phone: ['', [
        Validators.required,
        AuraValidators.strictPhone,
      ]],
      city: ['', [
        Validators.required,
        Validators.maxLength(SECURITY_LIMITS.MAX_CITY_LEN),
        AuraValidators.humanName,
        AuraValidators.sqlSafe,
      ]],
      state: ['', [
        Validators.required,
        Validators.maxLength(SECURITY_LIMITS.MAX_CITY_LEN),
        AuraValidators.humanName,
        AuraValidators.sqlSafe,
      ]],
      zip: ['', [
        Validators.required,
        AuraValidators.strictZip,
      ]],
    });
  }

  /** Rate-limited: dispara el debounce en lugar de ejecutar directo */
  public advanceToPayment() {
    this.paymentClick$.next();
  }

  /** Lógica real de validación y avance al Paso 2 */
  private _doAdvanceToPayment() {
    const isContactOK = this.isLoggedIn() ? true : this.contactForm.valid;

    if (isContactOK && this.shippingForm.valid) {
      // Sanitizar el payload antes de usarlo en el siguiente paso
      const safeShipping = sanitizeFormPayload(this.shippingForm.value);
      const safeEmail = this.isLoggedIn()
        ? sanitizeEmail(this.currentUser()?.email ?? '')
        : sanitizeEmail(this.contactForm.value.email);

      console.log('[Aura Security] Payload sanitizado listo:', { ...safeShipping, email: safeEmail });

      this.currentStep.set(2);
      this.initPaymentGateways();
    } else {
      console.warn('[Aura Security] Formulario inválido. Verifica los campos requeridos.');
      this.contactForm.markAllAsTouched();
      this.shippingForm.markAllAsTouched();
    }
  }

  public goBackToShipping() {
    this.currentStep.set(1);
  }

  // ============== CONSTRUCCIÓN DEL PAYLOAD ============== //

  private buildPayload(): CheckoutPayload {
    const safeShipping = sanitizeFormPayload(this.shippingForm.value);
    const user = this.currentUser();
    const isGuest = !this.isLoggedIn();
    const email = isGuest
      ? sanitizeEmail(this.contactForm.value.email)
      : sanitizeEmail(user?.email ?? '');

    return {
      customer: {
        email,
        firstName: safeShipping['firstName'],
        lastName:  safeShipping['lastName'],
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
        productId: i.productId,
        quantity:  i.quantity,
        price:     i.price,
        productName: i.name,
      })),
      payment: { method: this.selectedPaymentMethod() },
      total: this.cartService.subtotal(),
    };
  }

  /** Maneja errores del OrderService con mensajes legibles */
  private handleOrderError(error: unknown): void {
    if (error instanceof Error) {
      switch (error.message) {
        case 'ORDER_CUSTOMER_EXISTS':
          this.orderError.set('Este correo ya tiene una cuenta. Inicia sesión para continuar.');
          break;
        case 'ORDER_PAYMENT_FAILED':
          this.orderError.set('El pago no pudo procesarse. Verifica los datos de tu tarjeta.');
          break;
        case 'ORDER_STOCK_UNAVAILABLE':
          this.orderError.set('Uno o más productos ya no tienen stock disponible.');
          break;
        default:
          this.orderError.set('Ocurrió un error al procesar tu pedido. Intenta de nuevo.');
      }
    }
    this.isPlacingOrder.set(false);
  }

  // ============== FUNCIONES GENERALES DE PAGO ============== //

  public async processGeneralPayment() {
    if (this.selectedPaymentMethod() !== 'CASH' || this.isPlacingOrder()) return;
    this.isPlacingOrder.set(true);
    this.orderError.set(null);
    try {
      const confirmation = await this.orderService.placeOrder(this.buildPayload());
      this.cartService.items.set([]);
      this.router.navigate(['/orden/confirmacion', confirmation.reference], {
        state: { paymentMethod: 'CASH' }
      });
    } catch (error) {
      this.handleOrderError(error);
    }
  }

  // ============== INYECCIÓN DE PASARELAS (SDK HEADLESS) ============== //

  private async initPaymentGateways() {
    if (this.isLoadingGateways()) return; // Prevenir cargas dobles
    this.isLoadingGateways.set(true);

    try {
      // 1. Cargar Mercado Pago Bricks
      await this.loadScript('https://sdk.mercadopago.com/js/v2');
      this.renderMercadoPagoBrick();

      // 2. Cargar PayPal Smart Buttons
      await this.loadScript(`https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=MXN`);
      this.renderPayPalButtons();

    } catch (error) {
      console.error('Error inyectando SDKs de pago:', error);
    } finally {
      this.isLoadingGateways.set(false);
    }
  }

  private renderMercadoPagoBrick() {
    if (!window.MercadoPago) return;

    const mp = new window.MercadoPago(MERCADO_PAGO_PUBLIC_KEY, { locale: 'es-MX' });
    const bricksBuilder = mp.bricks();

    bricksBuilder.create("cardPayment", "cardPaymentBrick_container", {
      initialization: {
        amount: this.cartService.subtotal(), 
      },
      customization: {
        visual: {
          style: {
            theme: "default"
          }
        }
      },
      callbacks: {
        onReady: () => {
          console.log('MercadoPago Brick renderizado.');
        },
        onSubmit: (cardFormData: any) => {
          // Token de MercadoPago capturado — enviar al backend para procesar el cargo
          this.isPlacingOrder.set(true);
          this.orderError.set(null);
          const payload = this.buildPayload();
          payload.payment = { method: 'CARD', token: cardFormData.token };

          return this.orderService.placeOrder(payload).then(confirmation => {
            this.cartService.items.set([]);
            this.router.navigate(['/orden/confirmacion', confirmation.reference], {
              state: { paymentMethod: 'CARD' }
            });
          }).catch(error => {
            this.handleOrderError(error);
            return Promise.reject(error);
          });
        },
        onError: (error: any) => {
          console.error('[MercadoPago Brick Error]', error);
        }
      }
    });
  }

  private renderPayPalButtons() {
    if (!window.paypal) return;

    window.paypal.Buttons({
      createOrder: (data: any, actions: any) => {
        // Le dice a PayPal cuánto cobrar
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: this.cartService.subtotal().toFixed(2)
            }
          }]
        });
      },
      onApprove: (data: any, actions: any) => {
        // Cliente aceptó el pago — capturar y crear orden en PrestaShop
        return actions.order.capture().then(async (details: any) => {
          this.isPlacingOrder.set(true);
          this.orderError.set(null);
          const payload = this.buildPayload();
          payload.payment = { method: 'PAYPAL', transactionId: details.id };
          try {
            const confirmation = await this.orderService.placeOrder(payload);
            this.cartService.items.set([]);
            this.router.navigate(['/orden/confirmacion', confirmation.reference], {
              state: { paymentMethod: 'PAYPAL' }
            });
          } catch (error) {
            this.handleOrderError(error);
          }
        });
      }
    }).render('#paypal-button-container');
  }

  // Utilidad Dinámica para inyectar Javascripts de Terceros
  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Evitar cargar el mismo script dos veces si regresan
      if (this.document.querySelector(`script[src="${src}"]`)) {
        return resolve();
      }
      const script = this.document.createElement('script');
      script.src = src;
      script.type = 'text/javascript';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(`No se pudo cargar: ${src}`);
      this.document.head.appendChild(script);
    });
  }

}
