import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NxWelcome } from './nx-welcome';
import { Navbar, Footer } from '@aura-store-front/shared-ui';

@Component({
  imports: [NxWelcome, RouterModule],
  selector: 'aura-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
  template: `
    <aura-navbar [cartItemCount]="0"></aura-navbar>
    
    <main class="min-h-screen">
      <router-outlet></router-outlet> 
    </main>

    <aura-footer></aura-footer>
  `,
  
})
export class App {
  protected title = 'aura-market';
}
