import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Navbar, Footer } from '@aura-store-front/shared-ui';
import { TenantService } from '@aura-store-front/core';
@Component({
  imports: [ RouterModule, Navbar, Footer],
  selector: 'aura-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',  
})
export class App implements OnInit {
  public tenantService = inject(TenantService);

  ngOnInit(): void {
    this.tenantService.loadTenantConfig();
  }

}
