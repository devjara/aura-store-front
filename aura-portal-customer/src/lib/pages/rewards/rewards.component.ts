import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AUTH_CONTRACT, PortalService, CartRule } from 'core';

@Component({
  selector: 'aura-rewards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rewards.component.html',
  styleUrl: './rewards.component.scss',
})
export class RewardsComponent implements OnInit {
  private portalService = inject(PortalService);
  private authService = inject(AUTH_CONTRACT);

  rewards = signal<CartRule[]>([]);
  isLoading = signal(true);
  copiedCode = signal<string | null>(null);

  async ngOnInit() {
    this.isLoading.set(true);
    const user = this.authService.currentUser();
    
    if (user?.id) {
      const data = await this.portalService.getActiveRewards(user.id.toString());
      
      // -- FAKE INJECTOR PARA LA DEMO UI SI LA CUENTA NO TIENE CUPONES PREVIOS --
      if (data.length === 0) {
        this.rewards.set([
          {
            id: 1,
            customerId: user.id as number,
            code: 'AURA-WELCOME-20',
            description: 'Bono de Bienvenida Aura Members',
            dateFrom: new Date(),
            dateTo: new Date(new Date().setMonth(new Date().getMonth() + 1)),
            minimumAmount: 1500,
            reductionPercent: 20,
            reductionAmount: 0,
            isActive: true
          },
          {
            id: 2,
            customerId: user.id as number,
            code: 'COMPENSA-500',
            description: 'Vale de Lealtad (Atención al cliente)',
            dateFrom: new Date(),
            dateTo: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            minimumAmount: 0,
            reductionPercent: 0,
            reductionAmount: 500,
            isActive: true
          }
        ]);
      } else {
        this.rewards.set(data);
      }
    }
    this.isLoading.set(false);
  }

  async copyToClipboard(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      this.copiedCode.set(code);
      // Ocultar feedback tras 2.5 seg
      setTimeout(() => {
        if (this.copiedCode() === code) {
          this.copiedCode.set(null);
        }
      }, 2500);
    } catch (err) {
      console.error('Error copiando al portapapeles: ', err);
    }
  }
}
