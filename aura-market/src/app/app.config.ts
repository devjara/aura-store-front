import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideHttpClient, withFetch } from '@angular/common/http';

//Importamos el servicio de Tenant
import { TenantService } from '@aura-store-front/core'

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes),
    provideHttpClient(withFetch()), 
    
    {
      provide: 'APP_INITIALIZER',
      useFactory: (tenantService: TenantService) => () => tenantService.loadTenantConfig(),
      deps: [TenantService], // Inyectamos el servicio a la funcion de inicialización
      multi: true // Importante: Para que Angular no sobreescriba otros inicializadores internos
    }

  ],
};
