import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AUTH_CONTRACT } from '@aura-store-front/core';

@Component({
  selector: 'aura-order-confirmation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-confirmation.component.html',
})
export class OrderConfirmationComponent implements OnInit {
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private auth   = inject(AUTH_CONTRACT);

  public isLoggedIn = this.auth.isLoggedIn;
  public reference  = signal<string>('');
  public paymentMethod = signal<string>('');

  ngOnInit(): void {
    const ref = this.route.snapshot.paramMap.get('reference');
    if (!ref) {
      this.router.navigate(['/']);
      return;
    }
    this.reference.set(ref);

    // Recuperar método de pago del state de navegación (pasado por el checkout)
    const nav = this.router.getCurrentNavigation();
    const method = nav?.extras?.state?.['paymentMethod'] ?? '';
    this.paymentMethod.set(method);
  }

  get isCash(): boolean {
    return this.paymentMethod() === 'CASH';
  }

  get isCard(): boolean {
    return this.paymentMethod() === 'CARD';
  }

  get isPayPal(): boolean {
    return this.paymentMethod() === 'PAYPAL';
  }

  goToCatalog(): void {
    this.router.navigate(['/catalogo']);
  }

  goToOrders(): void {
    this.router.navigate(['/my-account/orders']);
  }
}
