/**
 * @file sanitizer.util.ts
 * @description Funciones de sanitización de strings para Aura Market.
 *
 * Purifica cadenas de texto provenientes de inputs de usuario antes de
 * enviarlas al Backend (PrestaShop API). Actúa como última muralla antes
 * de que los datos salgan del navegador.
 *
 * Alineado con: OWASP A03 (Injection) / CONDUSEF / PCI-DSS v4.0.
 */

import { SECURITY_PATTERNS } from './security.constants';

/**
 * Decodifica entidades HTML comunes en texto plano.
 * Ejemplo: `&amp;` → `&`, `&lt;` → `<`, `&#x27;` → `'`
 */
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, '/')
    .replace(/&nbsp;/gi, ' ');
}

/**
 * Elimina cualquier tag HTML del string (strip).
 * Ejemplo: `<b>Hola</b>` → `Hola`
 */
function stripHtmlTags(str: string): string {
  return str.replace(/<[^>]*>/g, '');
}

/**
 * Escapa caracteres peligrosos para evitar que sean interpretados
 * como HTML o código por el servidor.
 * @public Exportada para uso directo si se requiere un string escapado para outputs HTML.
 */
export function escapeSpecialChars(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Sanitizador Principal de Aura Market.
 *
 * Pipeline de limpieza:
 * 1. Decodifica entidades HTML doble-encodeadas
 * 2. Elimina tags HTML
 * 3. Elimina patrones de XSS conocidos
 * 4. Elimina caracteres de control invisibles (zero-width spaces, etc.)
 * 5. Normaliza espacios múltiples
 * 6. Recorta espacios al inicio y al final
 *
 * @param value - String crudo del usuario
 * @returns String limpio y seguro para enviar al backend
 */
export function sanitizeInput(value: string): string {
  if (!value || typeof value !== 'string') return '';

  let clean = value;

  // Paso 1: Decode de entidades HTML
  clean = decodeHtmlEntities(clean);

  // Paso 2: Strip de tags HTML
  clean = stripHtmlTags(clean);

  // Paso 3: Eliminar patrones XSS explícitos residuales
  clean = clean.replace(SECURITY_PATTERNS.XSS_DETECT, '');

  // Paso 4: Eliminar caracteres de control Unicode invisibles
  // Usa constructor RegExp para evitar advertencias del linter con rangos de control.
  // Incluye zero-width spaces (\u200B-\u200D), BOM (\uFEFF), direction overrides (\u202A-\u202E)
  // eslint-disable-next-line no-control-regex
  clean = clean.replace(new RegExp('[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF\u202A-\u202E]', 'g'), '');

  // Paso 5: Normalizar espacios múltiples a uno solo
  clean = clean.replace(/\s{2,}/g, ' ');

  // Paso 6: Trim
  clean = clean.trim();

  return clean;
}

/**
 * Sanitiza un objeto completo de formulario, aplicando `sanitizeInput`
 * a todas las propiedades de tipo `string`.
 *
 * Uso: `const safePayload = sanitizeFormPayload(this.shippingForm.value);`
 *
 * @param formValue - Valor crudo del formulario (Record de strings)
 * @returns Objeto con todos los strings sanitizados
 */
export function sanitizeFormPayload<T extends Record<string, unknown>>(formValue: T): T {
  const sanitized: Record<string, unknown> = {};

  for (const key of Object.keys(formValue)) {
    const value = formValue[key];
    sanitized[key] = typeof value === 'string' ? sanitizeInput(value) : value;
  }

  return sanitized as T;
}

/**
 * Sanitiza específicamente un email: lowercase + trim.
 * Los emails nunca deben tener mayúsculas ni espacios.
 */
export function sanitizeEmail(email: string): string {
  return sanitizeInput(email).toLowerCase();
}
