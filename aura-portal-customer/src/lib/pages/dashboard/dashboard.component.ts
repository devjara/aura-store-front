import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { AUTH_CONTRACT, PortalService, Order, CartRule } from 'core';

@Component({
  selector: 'aura-dashboard',
  standalone: true, 
  imports: [],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private authService = inject(AUTH_CONTRACT);
  private portalService = inject(PortalService);

  // Estado reactivo orientado a Modelos
  orders = signal<Order[]>([]);
  rewards = signal<CartRule[]>([]);

  // Computed Values para mostrar en UI
  customerFirstName = computed(() => this.authService.currentUser()?.firstname || 'de vuelta');
  
  // Asumimos que los estados 5, 2, 6, 7 son resolutivos (entregado/cancelado).
  // currentState en Order.model es un string (mapeado de current_state).
  activeOrdersCount = computed(() => this.orders().filter(o => o.currentState !== '6' && o.currentState !== '5').length);
  rewardsCount = computed(() => this.rewards().length);

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
