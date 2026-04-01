import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AUTH_CONTRACT, PortalService, Order, CartRule } from 'core';
import { MetricCardComponent, StatusBadgeComponent } from 'shared-ui';

@Component({
  selector: 'aura-dashboard',
  standalone: true, 
  imports: [CommonModule, MetricCardComponent, StatusBadgeComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private authService = inject(AUTH_CONTRACT);
  private portalService = inject(PortalService);

  // Estado reactivo orientado a Modelos
  orders = signal<Order[]>([]);
  rewards = signal<CartRule[]>([]);

  // Computed Values para UI Overview
  customerFirstName = computed(() => this.authService.currentUser()?.firstname || 'cliente');
  activeOrdersCount = computed(() => this.orders().filter(o => o.currentState !== '6' && o.currentState !== '5').length);
  rewardsCount = computed(() => this.rewards().length);

  // Lógica Avanzada UI: Último Pedido The Atrium
  latestOrder = computed(() => {
    const list = this.orders();
    if (list.length === 0) return null;
    return list[0]; // Como lo ordenaste DESC en el API, el 0 es el último.
  });

  // Mapear el currentState (string numerico) al badge
  getLatestOrderStatus(stateId: string): string {
    // Basic rules map
    switch (stateId) {
      case '5': return 'delivered';
      case '4': return 'transit';
      case '6': return 'hold'; // Cancelado/Error
      case '3': return 'processing';
      case '2': return 'processing';
      default: return 'processing';
    }
  }

  // Lógica UI: Actividad Reciente (Mapeamos los últimos 4 eventos/pedidos)
  recentActivity = computed(() => {
    return this.orders().slice(0, 4).map(o => ({
      title: `Pedido #${o.reference} actualizado`,
      date: o.dateAdd,
      statusType: this.getLatestOrderStatus(o.currentState)
    }));
  });

  async ngOnInit() {
    const user = this.authService.currentUser();
    if (user && user.id) {
      // Llamadas en paralelo para no bloquear
      const [userOrders, userRewards] = await Promise.all([
        this.portalService.getRecentOrders(user.id.toString()),
        this.portalService.getActiveRewards(user.id.toString())
      ]);

      this.orders.set(userOrders);
      this.rewards.set(userRewards);
    }
  }
}
