import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../../src/environments/environment.development';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  if(req.url.startsWith(environment.apiUrl)) {
    const modifiedReq = req.clone({
      setParams: {
        ws_key: environment.apiKey,
        output_format: 'JSON'
      }
    });
    return next(modifiedReq);
  }
  //Si la peticion va a otro lado (ej. api externa), la dejamos  pasar normal
  return next(req);
};
