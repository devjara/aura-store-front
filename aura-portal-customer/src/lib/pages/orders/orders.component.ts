import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PortalService, OrderDetail } from 'core';
import { StatusBadgeComponent } from 'shared-ui';

@Component({
  selector: 'aura-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss',
})
export class OrdersComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private portalService = inject(PortalService);

  order = signal<OrderDetail | null>(null);
  isLoading = signal<boolean>(true);

  async ngOnInit() {
    // 1. Obtener ID de la ruta
    const orderId = this.route.snapshot.paramMap.get('id');
    
    // 2. Traer Data completa
    if (orderId) {
      if (orderId === '999999') {
        // --- INYECCIÓN DE ORDEN FAKE PARA DEMOSTRACIÓN DE UI ---
        this.order.set({
          id: 999999,
          customerId: 0,
          currentState: '4', // En Tránsito
          paymentMethod: 'Tarjeta de Crédito terminada en 4421',
          totalPaid: 1299.50,
          totalShipping: 150.00,
          reference: 'ATR-FAKE-01',
          dateAdd: new Date(),
          items: [
            { id: 101, productId: 5, name: 'Sudadera Aura Essential (Negro/M)', quantity: 1, unitPrice: 850.50, totalPrice: 850.50 },
            { id: 102, productId: 8, name: 'Gorra Clásica Aura', quantity: 1, unitPrice: 299.00, totalPrice: 299.00 }
          ]
        });
      } else {
        const data = await this.portalService.getOrderById(orderId);
        this.order.set(data);
      }
    }
    
    this.isLoading.set(false);
  }

  // Helper de badge copiado de OrderHistory (En un App real esto puede ir en un Pipe o Servicio)
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

  getOrderStatusText(stateId: string): string {
    switch (stateId) {
      case '5': return 'Entregado';
      case '4': return 'En Tránsito';
      case '6': return 'Cancelado / Error';
      case '3': 
      case '2': return 'En Proceso';
      default: return 'En Proceso';
    }
  }

  // Genera un arreglo lógico para dibujar el termómetro de progreso según el current_state
  getTimelineStages(stateId: string) {
    const isProcessing = ['2','3'].includes(stateId);
    const isTransit = stateId === '4';
    const isDelivered = stateId === '5';

    return [
      { step: 'Aprobado', done: true, current: isProcessing },
      { step: 'Enviado', done: isTransit || isDelivered, current: isTransit },
      { step: 'Entregado', done: isDelivered, current: isDelivered }
    ];
  }
}