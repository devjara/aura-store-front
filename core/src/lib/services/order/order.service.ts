import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { OrderContract } from '../../contracts/order.contract';
import { CheckoutPayload, OrderConfirmation } from '../../models/checkout-payload.model';
import { PsApiResponseDTO } from '../../dto/ps-api-response.dto';
import { Order } from '../../models/order.model';
import { Cart } from '../../models/cart.model';
import { Address } from '../../models/address.model';
import { Customer } from '../../models/customer.model';

/**
 * OrderService — Implementación del OrderContract para guardar ordenes en PrestaShop
 *
 * Orquesta la secuencia de 6 llamadas al WebService nativo de PrestaShop:
 *   1. Resolver cliente (guest o registrado)
 *   2. Crear dirección de envío
 *   3. Crear carrito en PS
 *   4. Agregar productos al carrito
 *   5. Crear la orden
 *   6. Registrar el pago
 *
 * El apiInterceptor inyecta ws_key y output_format=JSON automáticamente
 * en cualquier URL que contenga /api/, por lo que este servicio no
 * maneja credenciales directamente.
 *
 * Para producción: nginx inyecta el header Authorization server-side
 * y la ws_key desaparece de las query params. Cero cambios aquí.
 */
@Injectable({ providedIn: 'root' })
export class OrderService extends OrderContract {
  private http = inject(HttpClient);

  // ─── IDs de PrestaShop (ajustar según configuración del servidor) ─────────
  // MXN, Español, México, Carrier default
  private readonly PS_ID_CURRENCY = 3;
  private readonly PS_ID_LANG     = 2;
  private readonly PS_ID_COUNTRY  = 144; // México
  private readonly PS_ID_CARRIER  = 1;   // Ajustar según módulo de envío
  private readonly PS_ID_SHOP       = 1;
  private readonly PS_ID_SHOP_GROUP = 1;

  override async placeOrder(payload: CheckoutPayload): Promise<OrderConfirmation> {
    try {
      // PASO 1 — Resolver cliente
      const customerId = await this.resolveCustomer(payload.customer);

      // PASO 2 — Crear dirección de envío
      const addressId = await this.createAddress(customerId, payload.customer, payload.shipping, payload.customer.dni);

      // PASO 3 — Crear carrito en PS
      const cartId = await this.createCart(customerId, addressId);

      // PASO 4 — Agregar productos al carrito
      await this.addProductsToCart(cartId, customerId, payload.cart, addressId);

      // PASO 5 — Crear la orden
      const order = await this.createOrder(cartId, customerId, addressId, payload.payment, payload.cart, payload.total);

      // PASO 6 — Registrar el pago
      await this.registerPayment(order.id, order.reference, payload.total, payload.payment);

      return {
        orderId:       order.id,
        reference:     order.reference,
        total:         payload.total,
        paymentMethod: payload.payment.method,
      };
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('ORDER_')) throw error;
      throw this.handleHttpError(error);
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Paso 1 — Resolver cliente
  // ════════════════════════════════════════════════════════════════════════════

  private async resolveCustomer(customer: CheckoutPayload['customer']): Promise<number> {
    // Usuario ya autenticado — usar su id directamente
    if (!customer.isGuest && customer.customerId) {
      return customer.customerId;
    }

    // Verificar si el email ya existe en PS
    const existing = await firstValueFrom(
      this.http.get<PsApiResponseDTO<Customer>>(`/api/customers?filter[email]=${encodeURIComponent(customer.email)}&display=full`)
    );

    if (existing?.customers?.length) {
      const found = existing.customers[0];
      // Si existe como cuenta registrada (no guest) → pedir que inicie sesión
      if (Number(found.is_guest) === 0) {
        throw new Error('ORDER_CUSTOMER_EXISTS');
      }
      // Si existe como guest → reusar
      return Number(found.id);
    }

    // Crear cliente invitado
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <prestashop>
        <customer>
          <firstname><![CDATA[${customer.firstName}]]></firstname>
          <lastname><![CDATA[${customer.lastName}]]></lastname>
          <email><![CDATA[${customer.email}]]></email>
          <passwd><![CDATA[Guest_${Date.now()}]]></passwd>
          <id_gender>0</id_gender>
          <is_guest>1</is_guest>
          <active>1</active>
          <newsletter>0</newsletter>
          <optin>0</optin>
        </customer>
      </prestashop>`;

    const response = await firstValueFrom(
      this.http.post<PsApiResponseDTO<Customer>>('/api/customers', xml, {
        headers: { 'Content-Type': 'application/xml' }
      })
    );

    if (!response?.customer?.id) throw new Error('ORDER_SERVICE_ERROR');
    return Number(response.customer.id);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Paso 2 — Crear dirección
  // ════════════════════════════════════════════════════════════════════════════

  private async createAddress(
    customerId: number,
    customer: CheckoutPayload['customer'],
    shipping: CheckoutPayload['shipping'],
    dni: string
  ): Promise<number> {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <prestashop>
        <address>
          <id_customer>${customerId}</id_customer>
          <id_country>${this.PS_ID_COUNTRY}</id_country>
          <alias><![CDATA[Envío]]></alias>
          <firstname><![CDATA[${customer.firstName}]]></firstname>
          <lastname><![CDATA[${customer.lastName}]]></lastname>
          <address1><![CDATA[${shipping.address}]]></address1>
          <city><![CDATA[${shipping.city}]]></city>
          <postcode><![CDATA[${shipping.zip}]]></postcode>
          <phone><![CDATA[${shipping.phone}]]></phone>
          <dni><![CDATA[${dni}]]></dni>
        </address>
      </prestashop>`;

    const response = await firstValueFrom(
      this.http.post<PsApiResponseDTO<Address>>('/api/addresses', xml, {
        headers: { 'Content-Type': 'application/xml' }
      })
    );

    console.log('createAddress response:', JSON.stringify(response));


    if (!response?.address?.id) throw new Error('ORDER_SERVICE_ERROR');
    return Number(response.address.id);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Paso 3 — Crear carrito
  // ════════════════════════════════════════════════════════════════════════════

  private async createCart(customerId: number, addressId: number): Promise<number> {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <prestashop>
        <cart>
          <id_currency>${this.PS_ID_CURRENCY}</id_currency>
          <id_lang>${this.PS_ID_LANG}</id_lang>
          <id_customer>${customerId}</id_customer>
          <id_address_delivery>${addressId}</id_address_delivery>
          <id_address_invoice>${addressId}</id_address_invoice>
          <id_carrier>${this.PS_ID_CARRIER}</id_carrier>
          <id_shop>${this.PS_ID_SHOP}</id_shop>
          <id_shop_group>${this.PS_ID_SHOP_GROUP}</id_shop_group>
        </cart>
      </prestashop>`;

    const response = await firstValueFrom(
      this.http.post<PsApiResponseDTO<Cart>>('/api/carts', xml, {
        headers: { 'Content-Type': 'application/xml' }
      })
    );

    if (!response?.cart?.id) throw new Error('ORDER_SERVICE_ERROR');
  const cartId = Number(response.cart.id);

  // 2. PUT para forzar la dirección — PS ignora las direcciones en el POST
  const updateXml = `<?xml version="1.0" encoding="UTF-8"?>
    <prestashop>
      <cart>
        <id>${cartId}</id>
        <id_currency>${this.PS_ID_CURRENCY}</id_currency>
        <id_lang>${this.PS_ID_LANG}</id_lang>
        <id_customer>${customerId}</id_customer>
        <id_address_delivery>${addressId}</id_address_delivery>
        <id_address_invoice>${addressId}</id_address_invoice>
        <id_carrier>${this.PS_ID_CARRIER}</id_carrier>
        <id_shop>${this.PS_ID_SHOP}</id_shop>
        <id_shop_group>${this.PS_ID_SHOP_GROUP}</id_shop_group>
      </cart>
    </prestashop>`;

  await firstValueFrom(
    this.http.put<PsApiResponseDTO<Cart>>(`/api/carts/${cartId}`, updateXml, {
      headers: { 'Content-Type': 'application/xml' }
    })
  );

  return cartId;

   
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Paso 4 — Agregar productos al carrito
  // ════════════════════════════════════════════════════════════════════════════

  private async addProductsToCart(
    cartId: number,
    customerId: number,
    items: CheckoutPayload['cart'],
    addressId: number
  ): Promise<void> {
    const rows = items.map(item => `
      <cart_row>
        <id_product>${item.productId}</id_product>
        <id_product_attribute>0</id_product_attribute>
        <quantity>${item.quantity}</quantity>
        <id_address_delivery>${addressId}</id_address_delivery>
      </cart_row>`).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <prestashop>
        <cart>
          <id>${cartId}</id>
          <id_currency>${this.PS_ID_CURRENCY}</id_currency>
          <id_lang>${this.PS_ID_LANG}</id_lang>
          <id_customer>${customerId}</id_customer>
          <id_address_delivery>${addressId}</id_address_delivery> <!-- MANDATORIO REPETIRLO -->
          <id_address_invoice>${addressId}</id_address_invoice>   <!-- MANDATORIO REPETIRLO -->
          <id_shop>${this.PS_ID_SHOP}</id_shop>
          <id_shop_group>${this.PS_ID_SHOP_GROUP}</id_shop_group>
          <associations>
            <cart_rows>${rows}</cart_rows>
          </associations>
        </cart>
      </prestashop>`;

    await firstValueFrom(
      this.http.put<PsApiResponseDTO<Cart>>( `/api/carts/${cartId}`, xml, {
        headers: { 'Content-Type': 'application/xml' }
      })
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Paso 5 — Crear la orden
  // ════════════════════════════════════════════════════════════════════════════

  private async createOrder(
  cartId: number,
  customerId: number,
  addressId: number,
  payment: CheckoutPayload['payment'],
  cartItems: CheckoutPayload['cart'],
  total: number
): Promise<{ id: number; reference: string }> {
  const orderState = payment.method === 'CASH' ? 1 : 2;
  const totalFormatted = Number(total ?? 0).toFixed(6); 
  
  const secureKey = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  // 1. Generar dinámicamente las filas de la orden
  const orderRowsXml = cartItems.map(item => {
    // Calculamos el precio unitario basado en el total que ya tenemos
    // Importante: unit_price_tax_incl debe ser un número válido, nunca ""
    const unitPrice = (total / cartItems.reduce((acc, i) => acc + i.quantity, 0)).toFixed(6);
    
    return `
      <order_row>
        <product_id>${item.productId}</product_id>
        <product_attribute_id>0</product_attribute_id>
        <product_quantity>${item.quantity}</product_quantity>
        <product_name><![CDATA[${item.productName || 'Producto'}]]></product_name>
        <product_reference><![CDATA[REF-${item.productId}]]></product_reference>
        <unit_price_tax_incl>${unitPrice}</unit_price_tax_incl>
        <unit_price_tax_excl>${unitPrice}</unit_price_tax_excl>
      </order_row>`;
  }).join('');

  // 2. Construir el XML con TODOS los campos de total para evitar el formatPrice(NULL)
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
      <order>
        <id_address_delivery>${addressId}</id_address_delivery>
        <id_address_invoice>${addressId}</id_address_invoice>
        <id_cart>${cartId}</id_cart>
        <id_currency>${this.PS_ID_CURRENCY}</id_currency>
        <id_lang>${this.PS_ID_LANG}</id_lang>
        <id_customer>${customerId}</id_customer>
        <id_carrier>${this.PS_ID_CARRIER}</id_carrier>
        <id_shop>1</id_shop>
        <id_shop_group>1</id_shop_group>
        <current_state>${orderState}</current_state>
        <module>${this.paymentToModule(payment.method)}</module>
        <payment>${this.paymentToLabel(payment.method)}</payment>
        <secure_key>${secureKey}</secure_key>
        <conversion_rate>1.000000</conversion_rate>
        <round_mode>2</round_mode>
        <round_type>1</round_type>
        <total_paid>${totalFormatted}</total_paid>
        <total_paid_real>${totalFormatted}</total_paid_real>
        <total_products>${totalFormatted}</total_products>
        <total_products_wt>${totalFormatted}</total_products_wt>
        <total_paid_tax_incl>${totalFormatted}</total_paid_tax_incl>
        <total_paid_tax_excl>${totalFormatted}</total_paid_tax_excl>
        <total_shipping>0.000000</total_shipping>
        <total_shipping_tax_incl>0.000000</total_shipping_tax_incl>
        <total_shipping_tax_excl>0.000000</total_shipping_tax_excl>
        <total_discounts>0.000000</total_discounts>
        <total_wrapping>0.000000</total_wrapping>
        <associations>
          <order_rows>
            ${orderRowsXml}
          </order_rows>
        </associations>
      </order>
    </prestashop>`;

  const response = await firstValueFrom(
    this.http.post<PsApiResponseDTO<Order>>('/api/orders', xml, {
      headers: { 'Content-Type': 'application/xml' }
    })
  );

  if (!response?.order?.id) throw new Error('ORDER_SERVICE_ERROR');
  
  return {
    id: Number(response.order.id),
    reference: response.order.reference ?? `ORD-${response.order.id}`,
  };
}

  // ════════════════════════════════════════════════════════════════════════════
  // Paso 6 — Registrar pago
  // ════════════════════════════════════════════════════════════════════════════

  private async registerPayment(
    orderId: number,
    orderReference: string,
    total: number,
    payment: CheckoutPayload['payment']
  ): Promise<void> {
    const transactionId = payment.transactionId ?? payment.token ?? '';

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <prestashop>
        <order_payment>
          <order_reference><![CDATA[${orderReference}]]></order_reference>
          <id_currency>${this.PS_ID_CURRENCY}</id_currency>
          <amount>${total.toFixed(6)}</amount>
          <payment_method><![CDATA[${this.paymentToLabel(payment.method)}]]></payment_method>
          <transaction_id><![CDATA[${transactionId}]]></transaction_id>
          <date_add>${new Date().toISOString().slice(0, 19).replace('T', ' ')}</date_add>
        </order_payment>
      </prestashop>`;

    await firstValueFrom(
      this.http.post<PsApiResponseDTO<Order>>('/api/order_payments', xml, {
        headers: { 'Content-Type': 'application/xml' }
      })
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Utilidades
  // ════════════════════════════════════════════════════════════════════════════

  private paymentToModule(method: string): string {
    // Módulos built-in de PrestaShop siempre disponibles.
    // En producción: cambiar CARD → 'mercadopago', PAYPAL → 'paypal'
    // una vez que esos módulos estén instalados en el servidor.
    return ({
      CARD:   'ps_checkpayment',  // → producción: 'mercadopago'
      PAYPAL: 'ps_checkpayment',  // → producción: 'paypal'
      CASH:   'bankwire',         // → producción: 'ps_cashondelivery' o 'bankwire'
    } as Record<string, string>)[method] ?? 'ps_checkpayment';
  }

  private paymentToLabel(method: string): string {
    return ({
      CARD:   'Tarjeta de Crédito/Débito',
      PAYPAL: 'PayPal',
      CASH:   'Pago en Efectivo / Transferencia SPEI',
    } as Record<string, string>)[method] ?? 'Otro';
  }

  private handleHttpError(error: unknown): Error {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 409) return new Error('ORDER_CUSTOMER_EXISTS');
      if (error.status === 422) return new Error('ORDER_STOCK_UNAVAILABLE');
    }
    return new Error('ORDER_SERVICE_ERROR');
  }
}
