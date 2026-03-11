import { HttpInterceptorFn } from '@angular/common/http';
import { TenantService } from '../services/tenant/tenant.service';
import { environment } from '../../../../src/environments/environment.development';
import { inject } from '@angular/core';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const tenantService = inject(TenantService);

  if(req.url.startsWith(environment.apiUrl)) {
    const currentApiKey = tenantService.getApiKey();
    const modifiedReq = req.clone({
      setParams: {
        ws_key: currentApiKey,
        output_format: 'JSON'
      }
    });
    return next(modifiedReq);
  }
  return next(req);
};
