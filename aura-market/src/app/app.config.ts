import { appRoutes } from './app.routes';
import { provideRouter } from '@angular/router';
import { ApplicationConfig, provideAppInitializer, inject } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { TenantService, AuthService, AUTH_CONTRACT, apiInterceptor } from '@aura-store-front/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes),
    provideHttpClient(withFetch(), withInterceptors([apiInterceptor])),

    provideAppInitializer(() => {
      const tenantService = inject(TenantService);
      return tenantService.loadTenantConfig();
    }),

    {
      provide: AUTH_CONTRACT,
      useClass: AuthService,
    },
  ],
};
