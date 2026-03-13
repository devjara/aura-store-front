import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TenantService } from '@aura-store-front/core';
@Component({
  imports: [ RouterModule],
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
