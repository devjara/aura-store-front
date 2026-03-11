import { Injectable, signal, inject,  PLATFORM_ID } from '@angular/core';
import { TenantConfig } from '../../models/tenant.model';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})

export class TenantService {
  public tenant = signal<TenantConfig | null>(null);
  
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID); 

  constructor() {
    console.log('2️⃣ [TenantService] Servicio instanciado en memoria.');
  }

  async loadTenantConfig(): Promise<void> {
    const isBrowser = isPlatformBrowser(this.platformId);
    console.log(`3️⃣ [TenantService] Entrando a loadTenantConfig. ¿Es navegador?: ${isBrowser}`);

    if (!isBrowser) {
      console.log('🛑 [TenantService] Detenido por SSR (Ejecución en servidor).');
      return; 
    }
    
    try {
      console.log('4️⃣ [TenantService] Intentando descargar /tenants.json...');
      const currentDomain = window.location.hostname;
      const directory = await firstValueFrom(
        this.http.get<Record<string, TenantConfig>>(`/tenants.json`)
      );

      console.log('5️⃣ [TenantService] JSON descargado con éxito:', directory);

      const activeTenant = directory[currentDomain] || directory['localhost'];
      
      if(activeTenant) {
        this.tenant.set(activeTenant);
        console.log(`✅ [TenantService] Cliente configurado: ${activeTenant.tenantId}`); 
      } else {
        console.warn('⚠️ [TenantService] Dominio no registrado.');
      }
    } catch (error) { 
      console.error('🚨 [TenantService] Falla catastrófica al descargar JSON:', error);
    }
  }

  getApiKey(): string {
    const config = this.tenant();
    return config ? config.apiKey : '';
  }
}