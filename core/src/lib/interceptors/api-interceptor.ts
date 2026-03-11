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

  if(req.url.startsWith(environment.apiUrl)) {
    const currentTenant = tenantService.tenant();
    if(!currentTenant || !currentTenant.apiKey) {
      logger.error('Seguridad: Intento de petición a PrestaShop sin API Key. Petición bloqueada.', req.url);
      return throwError(() => new Error('Falta API Key del Iniquilino'))
    }

    const modifiedReq = req.clone({
      setParams: {
        ws_key: currentTenant.apiKey,
        output_format: 'JSON'
      }
    });
    return next(modifiedReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if(error.status === 401) {
          logger.error('PrestaShop rechazoó la petición por falta de autenticación. Verifica la API Key del tenant.', error.message);
        } else if(error.status === 0 || error.status >= 500) {
          logger.error('Error en la petición a PrestaShop.', error.message);
          // TODO : Implementa un signal global para mostrar un mensaje de error
        }
        return throwError(() => error);
      })
    );
  }
  return next(req);
};
