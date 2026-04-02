/**
 * @file security.constants.ts
 * @description Constantes corporativas de seguridad para Aura Market.
 * Define los límites máximos de longitud en inputs de usuario para prevenir
 * ataques de Buffer Overflow y denegación de servicio (DoS) a nivel de formularios.
 *
 * Alineado con: PCI-DSS v4.0 / CONDUSEF Medidas de Seguridad en Comercio Electrónico.
 */

/**
 * Límites de longitud máxima permitidos por campo.
 * `Object.freeze` previene mutaciones accidentales en runtime.
 */
export const SECURITY_LIMITS = Object.freeze({
  /** Longitud máxima para correos electrónicos (RFC 5321) */
  MAX_EMAIL_LEN: 100,

  /** Longitud máxima para nombres y apellidos */
  MAX_NAME_LEN: 50,

  /** Longitud máxima para líneas de dirección */
  MAX_ADDRESS_LEN: 120,

  /** Longitud exacta para Código Postal (México) */
  EXACT_ZIP_LEN: 5,

  /** Longitud exacta para números telefónicos (México, 10 dígitos LADA) */
  EXACT_PHONE_LEN: 10,

  /** Longitud máxima para el nombre del titular en tarjeta (ISO 7813) */
  MAX_CARD_HOLDER_LEN: 26,

  /** Longitud máxima para ciudades y estados */
  MAX_CITY_LEN: 60,

  /** Longitud máxima para nombres de colonias / barrios */
  MAX_NEIGHBORHOOD_LEN: 80,

  /** Longitud máxima para comentarios de pedido */
  MAX_COMMENT_LEN: 300,
});

/**
 * Patrones Regex de seguridad reutilizables.
 * Uso: Importar en AuraValidators o usarlos directamente en Validators.pattern()
 */
export const SECURITY_PATTERNS = Object.freeze({
  /** Solo letras (incluyendo acentos/ñ), espacios y guiones. Sin números ni caracteres especiales. */
  HUMAN_NAME: /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s-]+$/,

  /** Teléfono mexicano de exactamente 10 dígitos numéricos */
  PHONE_MX: /^[0-9]{10}$/,

  /** Código Postal mexicano de exactamente 5 dígitos */
  ZIP_MX: /^[0-9]{5}$/,

  /** Email básico compatible con RFC 5322 */
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,

  /**
   * Detecta patrones comunes de SQL Injection.
   * Si este regex MATCH en un input, el valor es SOSPECHOSO.
   */
  SQL_INJECTION_DETECT: /('|"|;|--|\bSELECT\b|\bDROP\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bUNION\b|\bEXEC\b|\bXP_\b|\/\*|\*\/)/i,

  /**
   * Detecta patrones comunes de Cross-Site Scripting (XSS).
   * Si este regex MATCH en un input, el valor es SOSPECHOSO.
   */
  XSS_DETECT: /(<script[\s\S]*?>[\s\S]*?<\/script>|javascript:|onerror\s*=|onload\s*=|onclick\s*=|<iframe|<img[^>]+src\s*=|eval\s*\(|document\.cookie)/i,

  /** Solo dígitos numéricos */
  NUMERIC_ONLY: /^[0-9]+$/,

  /** Texto alfanumérico sin caracteres de inyección */
  SAFE_TEXT: /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9\s.,#-]+$/,
});
