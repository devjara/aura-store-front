import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AUTH_CONTRACT, PortalService, Order } from 'core';
import { StatusBadgeComponent } from 'shared-ui';

@Component({
  selector: 'aura-order-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, StatusBadgeComponent],
  templateUrl: './order-history.component.html',
  styleUrl: './order-history.component.scss',
})
export class OrderHistoryComponent implements OnInit {
  private authService = inject(AUTH_CONTRACT);
  private portalService = inject(PortalService);

  // Fuente de la verdad
  orders = signal<Order[]>([]);

  // Filtros reactivos (bidireccionales con [(ngModel)])
  searchQuery = signal<string>('');
  statusFilter = signal<string>('all');
  dateFilter = signal<string>('all');

  // Mini-Métricas Computadas (Header The Atrium)
  activeOrdersCount = computed(() => this.orders().filter(o => o.currentState !== '6' && o.currentState !== '5').length);
  deliveredOrdersCount = computed(() => this.orders().filter(o => o.currentState === '5').length);

  // Buscador & Filtrador Instantáneo
  filteredOrders = computed(() => {
    let result = this.orders();
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();
    
    // 1. Filtrar por búsqueda textual
    if (query) {
      result = result.filter(o => 
        o.reference.toLowerCase().includes(query) || 
        o.id.toString().includes(query)
      );
    }

    // 2. Filtrar por Estado visual
    if (status !== 'all') {
      result = result.filter(o => this.getOrderStatusType(o.currentState) === status);
    }

    return result;
  });

  async ngOnInit() {
    const user = this.authService.currentUser();
    if (user?.id) {
      const data = await this.portalService.getRecentOrders(user.id.toString());
      if (data.length === 0) {
        // --- INYECCIÓN DE ORDEN FAKE PARA DEMOSTRACIÓN DE UI ---
        this.orders.set([{
          id: 999999,
          customerId: user.id || 0,
          currentState: '4', // En Tránsito
          paymentMethod: 'Tarjeta de Crédito',
          totalPaid: 1299.50,
          totalShipping: 150.00,
          reference: 'ATR-FAKE-01',
          dateAdd: new Date()
        }]);
      } else {
        this.orders.set(data);
      }
    }
  }

  // Helper para mapear el Status de PrestaShop al Componente Visual
  getOrderStatusType(stateId: string): string {
    switch (stateId) {
      case '5': return 'delivered';
      case '4': return 'transit';
      case '6': return 'hold';
      case '3': 
      case '2': return 'processing';
      default: return 'processing';
    }
  }

  // Traducción literal al Español para sobrescribir en el badge
  getOrderStatusText(stateId: string): string {
    switch (stateId) {
      case '5': return 'Entregado';
      case '4': return 'En Tránsito';
      case '6': return 'Retenido / Error';
      case '3': 
      case '2': return 'En Proceso';
      default: return 'En Proceso';
    }
  }
}
