import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, filter } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

import { PortalContract } from './portal.contract';
import { TenantService } from '../tenant/tenant.service';

// DTOs (Lo que llega nativo de PrestaShop)
import { PsOrderDto, PsOrderResponse } from '../../dto/ps-order.dto';
import { PsCartRuleDto, PsCartRuleResponse } from '../../dto/ps-cart-rule.dto';

// Modelos limpios (Lo que emitimos a la UI)
import { Order } from '../../models/order.model';
import { CartRule } from '../../models/cart-rule.model';

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

  // --- MAPPERS (Capa de Translación DTO -> Model) ---

  private mapToOrderModel(dto: PsOrderDto): Order {
    return {
      id: dto.id,
      customerId: parseInt(dto.id_customer, 10),
      currentState: dto.current_state,
      paymentMethod: dto.payment,
      totalPaid: parseFloat(dto.total_paid) || 0,
      reference: dto.reference,
      dateAdd: new Date(dto.date_add)
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
}
