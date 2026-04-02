import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AUTH_CONTRACT, CartService, AuraValidators, SECURITY_LIMITS, sanitizeFormPayload, sanitizeEmail } from '@aura-store-front/core';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

// ¡TUS LLAVES MAESTRAS DEL SANDBOX! 🔑
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
  private fb = inject(FormBuilder);
  private auth = inject(AUTH_CONTRACT);
  public cartService = inject(CartService);
  private document = inject(DOCUMENT);

  // Estados
  public isLoggedIn = this.auth.isLoggedIn;
  public currentUser = this.auth.currentUser;
  
  public currentStep = signal<1 | 2>(1); // 1: Contacto/Envío, 2: Pago
  public selectedPaymentMethod = signal<'CARD' | 'PAYPAL' | 'CASH'>('CARD');
  public isLoadingGateways = signal<boolean>(false);
  
  // Anti Brute-Force: debounce en el botón de pago para evitar spam de requests
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

  // ============== FUNCIONES GENERALES DE PAGO ============== //

  public processGeneralPayment() {
    if (this.selectedPaymentMethod() === 'CASH') {
      console.log('Generando referencia de OXXO / Transferencia vía PrestaShop...');
      alert('¡Simulación Exitosa! Aquí Angular mandaría la orden al Backend indicando pago offline. La referencia llegaría a ' + this.contactForm.get('email')?.value);
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
          // AQUI EL TARJETAZO FUE PROCESADO
          // Generar Promise que manda el 'cardFormData.token' al Backend (PrestaShop API) para consolidar Orden
          return new Promise((resolve, reject) => {
            console.log('Token de MercadoPago capturado, listo para el Backend:', cardFormData);
            resolve(true); 
          });
        },
        onError: (error: any) => {
          console.error(error);
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
        // El cliente aceptó el pago en su cuenta de PayPal
        return actions.order.capture().then((details: any) => {
          console.log('Pago de PayPal completado por:', details.payer.name.given_name);
          // AQUI NOTIFICAR A PRESTASHOP DEL EXITO DE PAYPAL (ID Transaction)
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
