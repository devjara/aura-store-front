import { Injectable, signal, inject,  PLATFORM_ID } from '@angular/core';
import { TenantConfig } from '../../models/tenant.model';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { LoggerService } from '../logger/logger.service';
import { Router } from '@angular/router';


/**
 * TenantService — Servicio central de multi-tenancy.
 *
 * Responsabilidad única: identificar qué tienda está activa basándose en el
 * dominio actual y cargar su configuración desde `tenants.json`.
 *
 * Este servicio es el punto de entrada para cualquier dato específico del tenant
 * (URL del API, apiKey, shopId). Ningún otro servicio debe leer `environment`
 * directamente — todo pasa por aquí.
 *
 * Ciclo de vida:
 * 1. La app llama a `loadTenantConfig()` en el bootstrap (APP_INITIALIZER).
 * 2. Se lee el dominio actual del navegador.
 * 3. Se busca ese dominio en `tenants.json`.
 * 4. Si existe, se carga la config en el signal `tenant`.
 * 5. Si no existe, se redirige a `/no-found`.
 *
 * ⚠️ Solo se ejecuta en el navegador — en SSR se detiene inmediatamente
 * para evitar errores por ausencia de `window`.
 */
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

  /**
   * Retorna la API Key del tenant activo para autenticación con Prestashop.
   * Retorna string vacío si el tenant aún no ha cargado.
   */
  getApiKey(): string {
    const config = this.tenant();
    return config ? config.apiKey : '';
  }

  /**
   * Retorna la URL base del API de Prestashop del tenant activo.
   * Ej: "https://aura-market.com/api"
   * Retorna string vacío si el tenant aún no ha cargado.
   */
  getApiUrl(): string {
    return this.tenant()?.apiUrl ?? '';
  }

  /**
   * Retorna el ID de la tienda en Prestashop del tenant activo.
   * Prestashop puede manejar múltiples tiendas bajo una misma instalación (multistore).
   * Retorna 1 como default si el tenant aún no ha cargado.
   */

  getShopApi(): number {
    return this.tenant()?.shopId ?? 1;
  }
}