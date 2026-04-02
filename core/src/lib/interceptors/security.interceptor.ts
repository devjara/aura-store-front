/**
 * @file security.interceptor.ts
 * @description Interceptor HTTP de Seguridad para Aura Market.
 *
 * Bloquea cualquier petición HTTP saliente que NO use el protocolo
 * HTTPS cifrado, previniendo fugas accidentales de tokens o datos
 * de pago en ambientes sin certificado SSL activo.
 *
 * También inyecta headers de seguridad adicionales en cada petición
 * hacia el Backend (PrestaShop API).
 *
 * Alineado con: CONDUSEF (SSL obligatorio) / PCI-DSS v4.0 Req. 4.2.1
 * (cifrado de PAN en tránsito) / OWASP MITM Mitigation.
 */

import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { throwError } from 'rxjs';
import { isDevMode } from '@angular/core';

/**
 * Dominios de terceros exentos de la comprobación HTTPS
 * (SDKs de pago que ya manejan su propio cifrado)
 */
const EXEMPT_DOMAINS = [
  'sdk.mercadopago.com',
  'www.paypal.com',
  'www.sandbox.paypal.com',
  'fonts.googleapis.com',
];

/**
 * Verifica si la URL pertenece a un dominio exento.
 */
function isExemptDomain(url: string): boolean {
  return EXEMPT_DOMAINS.some(domain => url.includes(domain));
}

/**
 * Interceptor funcional de seguridad HTTPS.
 *
 * En producción: bloquea peticiones a URLs `http://` no cifradas.
 * En desarrollo:  permite `localhost` y `0.0.0.0` sin HTTPS.
 */
export const securityInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const url = req.url;
  const isLocalhost = url.includes('localhost') || url.includes('0.0.0.0') || url.includes('127.0.0.1');
  const isHttpOnly = url.startsWith('http://') && !url.startsWith('https://');

  // Bloqueo estricto en producción: solo HTTPS
  if (!isDevMode() && isHttpOnly && !isExemptDomain(url)) {
    console.error(`🔒 AURA SECURITY: Petición bloqueada — "${url}" no usa HTTPS. Riesgo MITM detectado.`);
    return throwError(() => new Error(
      'AURA_SECURITY_HTTPS_REQUIRED: La petición fue bloqueada por no usar una conexión cifrada (HTTPS). ' +
      'Contacta al administrador del sistema.'
    ));
  }

  // En dev, permitir localhost sin HTTPS pero advertir al desarrollador
  if (isDevMode() && isHttpOnly && !isLocalhost && !isExemptDomain(url)) {
    console.warn(`⚠️ AURA SECURITY [DEV]: La petición "${url}" no usa HTTPS. En producción sería bloqueada.`);
  }

  // Clonar la petición agregando headers de seguridad adicionales
  const secureReq = req.clone({
    setHeaders: {
      // Indica al servidor que no cachee respuestas con datos sensibles
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      // Previene que el navegador infiera tipos de contenido
      'X-Content-Type-Options': 'nosniff',
    }
  });

  return next(secureReq);
};
