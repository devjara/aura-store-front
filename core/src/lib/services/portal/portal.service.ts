import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, filter } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

import { PortalContract } from './portal.contract';
import { TenantService } from '../tenant/tenant.service';

// DTOs (Lo que llega nativo de PrestaShop)
import { PsOrderDto, PsOrderResponse } from '../../dto/ps-order.dto';
import { PsCartRuleDto, PsCartRuleResponse } from '../../dto/ps-cart-rule.dto';
import { PsAddressDto, PsAddressResponse } from '../../dto/ps-address.dto';

// Modelos limpios (Lo que emitimos a la UI)
import { Order, OrderDetail, OrderItem } from '../../models/order.model';
import { CartRule } from '../../models/cart-rule.model';
import { Address } from '../../models/address.model';

@Injectable({
  providedIn: 'root',
})
export class PortalService implements PortalContract {
  private http = inject(HttpClient);
  private tenantService = inject(TenantService);
  private tenant$ = toObservable(this.tenantService.tenant);

  private async waitForTenant(): Promise<void> {
    return firstValueFrom(this.tenant$.pipe(filter((t) => t !== null))).then(() => void 0);
  }

  async getRecentOrders(customerId: string): Promise<Order[]> {
    if (!customerId) return [];
    await this.waitForTenant();

    try {
      const url = `${this.tenantService.getApiUrl()}/orders`;
      const response = await firstValueFrom(
        this.http.get<PsOrderResponse>(url, {
          params: {
            display: 'full',
            output_format: 'JSON',
            'filter[id_customer]': customerId,
            sort: '[id_DESC]'
          },
        })
      );
      
      const ordersDto = response.orders || [];
      return ordersDto.map(dto => this.mapToOrderModel(dto));

    } catch (e) {
      console.error('Error obteniendo órdenes:', e);
      return [];
    }
  }

  async getOrderById(orderId: string): Promise<OrderDetail | null> {
    if (!orderId) return null;
    await this.waitForTenant();

    try {
      const url = `${this.tenantService.getApiUrl()}/orders`;
      const response = await firstValueFrom(
        this.http.get<PsOrderResponse>(url, {
          params: {
            display: 'full',
            output_format: 'JSON',
            'filter[id]': orderId
          },
        })
      );
      
      const ordersDto = response.orders || [];
      if (ordersDto.length === 0) return null;
      
      return this.mapToOrderDetailModel(ordersDto[0]);

    } catch (e) {
      console.error(`Error obteniendo detalle de la orden ${orderId}:`, e);
      return null;
    }
  }

  async getActiveRewards(customerId: string): Promise<CartRule[]> {
    if (!customerId) return [];
    await this.waitForTenant();

    try {
      const url = `${this.tenantService.getApiUrl()}/cart_rules`;
      const response = await firstValueFrom(
        this.http.get<PsCartRuleResponse>(url, {
          params: {
            display: 'full',
            output_format: 'JSON',
            'filter[id_customer]': customerId,
            'filter[active]': '1' // Solo activas
          },
        })
      );
      
      const rewardsDto = response.cart_rules || [];
      return rewardsDto.map(dto => this.mapToCartRuleModel(dto));

    } catch (e) {
      console.error('Error obteniendo recompensas:', e);
      return [];
    }
  }

  async getAddresses(customerId: string): Promise<Address[]> {
    if (!customerId) return [];
    await this.waitForTenant();

    try {
      const url = `${this.tenantService.getApiUrl()}/addresses`;
      const response = await firstValueFrom(
        this.http.get<PsAddressResponse>(url, {
          params: {
            display: 'full',
            output_format: 'JSON',
            'filter[id_customer]': customerId,
            'filter[deleted]': '0' // Evitar traer basura dada de baja
          },
        })
      );
      
      const addressesDto = response.addresses || [];
      return addressesDto.map(dto => this.mapToAddressModel(dto));

    } catch (e) {
      console.error('Error obteniendo direcciones:', e);
      return [];
    }
  }

  async saveAddress(address: Partial<Address>): Promise<boolean> {
    await this.waitForTenant();
    console.log('Sending address payload to server:', address); // Simulando log y complaciendo a eslint
    await new Promise(resolve => setTimeout(resolve, 1500));
    return true; 
  }

  // --- MAPPERS (Capa de Translación DTO -> Model) ---

  private mapToOrderModel(dto: PsOrderDto): Order {
    return {
      id: dto.id,
      customerId: parseInt(dto.id_customer, 10),
      currentState: dto.current_state,
      paymentMethod: dto.payment,
      totalPaid: parseFloat(dto.total_paid) || 0,
      totalShipping: parseFloat(dto.total_shipping) || 0,
      reference: dto.reference,
      dateAdd: new Date(dto.date_add)
    };
  }

  private mapToOrderDetailModel(dto: PsOrderDto): OrderDetail {
    const baseOrder = this.mapToOrderModel(dto);
    const orderRows = dto.associations?.order_rows || [];
    
    const items: OrderItem[] = orderRows.map(row => ({
      id: parseInt(row.id, 10),
      productId: parseInt(row.product_id, 10),
      name: row.product_name,
      quantity: parseInt(row.product_quantity, 10),
      unitPrice: parseFloat(row.unit_price_tax_incl) || 0,
      totalPrice: parseFloat(row.product_price) || 0
    }));

    return {
      ...baseOrder,
      items
    };
  }

  private mapToCartRuleModel(dto: PsCartRuleDto): CartRule {
    return {
      id: dto.id,
      customerId: parseInt(dto.id_customer, 10) || 0,
      code: dto.code,
      description: dto.description || '',
      dateFrom: new Date(dto.date_from),
      dateTo: new Date(dto.date_to),
      minimumAmount: parseFloat(dto.minimum_amount) || 0,
      reductionPercent: parseFloat(dto.reduction_percent) || 0,
      reductionAmount: parseFloat(dto.reduction_amount) || 0,
      isActive: dto.active === '1'
    };
  }

  private mapToAddressModel(dto: PsAddressDto): Address {
    return {
      id: dto.id,
      customerId: parseInt(dto.id_customer, 10),
      alias: dto.alias,
      firstName: dto.firstname,
      lastName: dto.lastname,
      address1: dto.address1,
      city: dto.city,
      postcode: dto.postcode,
      phone: dto.phone_mobile || dto.phone || ''
    };
  }
}
