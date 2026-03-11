import { Injectable, signal, inject,  PLATFORM_ID } from '@angular/core';
import { TenantConfig } from '../../models/tenant.model';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { LoggerService } from '../logger/logger.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})

export class TenantService {
  //Signals
  public tenant = signal<TenantConfig | null>(null);
  
  //Inyecciones
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID); 
  private logger = inject(LoggerService);
  private router = inject(Router);

  async loadTenantConfig(): Promise<void> {
    const isBrowser = isPlatformBrowser(this.platformId);
    console.log(`3️⃣ [TenantService] Entrando a loadTenantConfig. ¿Es navegador?: ${isBrowser}`);

    if (!isBrowser) {
      console.log('🛑 [TenantService] Detenido por SSR (Ejecución en servidor).');
      return; 
    }
    
    try {
      const currentDomain = window.location.hostname;
      const directory = await firstValueFrom(
        this.http.get<Record<string, TenantConfig>>(`/tenants.json`)
      );


      const activeTenant = directory[currentDomain];
      
      if(activeTenant) {
        this.tenant.set(activeTenant);
        this.logger.log(`Cliente autenticado: ${activeTenant.tenantId}`);
      } else {
        this.logger.error(`Dominio intruso o no configurado: ${currentDomain}`);
        this.router.navigate(['/no-found']); // TODO: Crear una página de error específica para tenant no encontrado, en lugar de un genérico 404.
      }
    } catch (error) { 
     this.logger.error('Error al cargar la configuración del tenant:', error);
    }
  }

  getApiKey(): string {
    const config = this.tenant();
    return config ? config.apiKey : '';
  }
}