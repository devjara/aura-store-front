import { CommonModule } from '@angular/common';
import { Component, input, output, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavLink } from '../../models/navigation.model';

@Component({
  selector: 'aura-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  public storeName = input<string>('TIENDA');
  public announcementText = input<string>('');
  public announcementLinkText = input<string>('');
  public links = input<NavLink[]>([]);
  public cartItemCount = input<number>(0);
  public containerClass = input<string>('');

  public isMobileMenuOpen = signal<boolean>(false);

  toggleMobileMenu() {
    this.isMobileMenuOpen.update((isOpen) => !isOpen);
  }

  cartClick = output<void>();
  userClick = output<void>();

}
