import { InjectionToken } from '@angular/core';
import { Order, OrderDetail } from '../../models/order.model';
import { CartRule } from '../../models/cart-rule.model';
import { Address } from '../../models/address.model';

export interface PortalContract {
  /**
   * Obtiene todas las órdenes vinculadas a un cliente por su ID
   */
  getRecentOrders(customerId: string): Promise<Order[]>;

  /**
   * Obtiene el detalle de una orden por su ID
   */
  getOrderById(orderId: string): Promise<OrderDetail | null>;

  /**
   * Obtiene todas las recompensas o vales vinculados a un cliente
   */
  getActiveRewards(customerId: string): Promise<CartRule[]>;

  /**
   * Obtiene la libreta de direcciones guardadas por un cliente
   */
  getAddresses(customerId: string): Promise<Address[]>;

  /**
   * Registra una nueva dirección (MVP)
   */
  saveAddress(address: Partial<Address>): Promise<boolean>;
}

export const PORTAL_CONTRACT = new InjectionToken<PortalContract>('PORTAL_CONTRACT');
