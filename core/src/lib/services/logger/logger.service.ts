import { Injectable } from '@angular/core';
import { environment } from '../../../../../src/environments/environment';

@Injectable({
  providedIn: 'root',
})

export class LoggerService {
  log(message: string, data?: any) {
    if (!(environment as any).production) {
      console.log(`🔵 [AURA INFO]: ${message}`, data || '');
    }
  }

  warn(message: string, data?: any) {
    if (!(environment as any).production) {
      console.warn(`🟠 [AURA WARN]: ${message}`, data || '');
    }
  }

  error(message: string, error?: any) {
    // Los errores sí los queremos ver incluso en producción, o mandarlos a un servicio como Sentry
    console.error(`🔴 [AURA CRÍTICO]: ${message}`, error || '');
  }
}
