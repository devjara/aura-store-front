import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Navbar} from 'shared-ui';

@Component({
  selector: 'aura-navbar-layout',
  imports: [CommonModule, Navbar],
  standalone: true,
  templateUrl: './navbar-layout.component.html',
  styleUrl: './navbar-layout.component.scss',
})
export class NavbarLayoutComponent {
  public storeConfig = {
    name: 'AURA',
    announcement: 'Accede a ofertas exclusivas, lanzamientos y más. No te lo pierdas.',
    announcementLink: 'Ingresa para tus ofertas',
    menu: [
      { label: 'Women', url: '/women' },
      { label: 'Men', url: '/men' },
      { label: 'Catálogo', url: '/catalogo' },
      { label: 'About', url: '/about' }
    ]
  };
}
