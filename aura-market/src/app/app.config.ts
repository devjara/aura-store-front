import { appRoutes } from './app.routes';
import { provideRouter } from '@angular/router';
import { ApplicationConfig, provideAppInitializer, inject } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  TenantService,
  AuthService, AUTH_CONTRACT,
  OrderService, ORDER_CONTRACT,
  apiInterceptor, securityInterceptor
} from '@aura-store-front/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes),
    provideHttpClient(withFetch(), withInterceptors([securityInterceptor, apiInterceptor])),

    provideAppInitializer(() => {
      const tenantService = inject(TenantService);
      return tenantService.loadTenantConfig();
    }),

    { provide: AUTH_CONTRACT,  useClass: AuthService  },
    { provide: ORDER_CONTRACT, useClass: OrderService },
  ],
};
