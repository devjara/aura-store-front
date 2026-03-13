import { inject } from '@angular/core';
import { throwError, catchError } from 'rxjs';
import { HttpInterceptorFn } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { TenantService } from '../services/tenant/tenant.service';
import { LoggerService } from '../services/logger/logger.service';
import { environment } from '../../../../src/environments/environment.development';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const tenantService = inject(TenantService);
  const logger = inject(LoggerService)

  if (req.url.includes('/api/')) {
    const currentTenant = tenantService.tenant();
    
    if (!currentTenant || !currentTenant.apiKey) {
      logger.error('Seguridad: Intento de petición a PrestaShop sin API Key. Petición bloqueada.', req.url);
      return throwError(() => new Error('Falta API Key del Inquilino'));
    }

    const modifiedReq = req.clone({
      setParams: {
        ws_key: currentTenant.apiKey,
        output_format: 'JSON'
      }
    });

    // 3️⃣ LOG DE ÉXITO: Confirmamos que Angular armó bien la URL con la llave.
    // Usamos 'urlWithParams' porque ahí es donde Angular concatena los setParams.
    logger.log(`✅ [Interceptor] Llave inyectada. URL final enviada: ${modifiedReq.urlWithParams}`);

    return next(modifiedReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          logger.error('PrestaShop rechazó la petición (401). Verifica que la API Key sea correcta y tenga permisos GET en PrestaShop.', error.message);
        } else if (error.status === 0 || error.status >= 500) {
          logger.error('Error en la petición a PrestaShop (Puede ser CORS o servidor caído).', error.message);
          // TODO : Implementa un signal global para mostrar un mensaje de error
        }
        return throwError(() => error);
      })
    );
  }
  return next(req);
};
