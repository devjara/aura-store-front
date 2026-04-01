import { InjectionToken } from '@angular/core';
import { Order } from '../../models/order.model';
import { CartRule } from '../../models/cart-rule.model';

export interface PortalContract {
  /**
   * Obtiene todas las órdenes vinculadas a un cliente por su ID
   */
  getRecentOrders(customerId: string): Promise<Order[]>;

  /**
   * Obtiene todas las recompensas o vales vinculados a un cliente
   */
  getActiveRewards(customerId: string): Promise<CartRule[]>;
}

export const PORTAL_CONTRACT = new InjectionToken<PortalContract>('PORTAL_CONTRACT');
