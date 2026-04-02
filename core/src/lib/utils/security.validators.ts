/**
 * @file security.validators.ts
 * @description Fábrica de Validadores Angulares para Aura Market.
 *
 * Cada validador estático retorna una función compatible con la firma
 * `ValidatorFn` de `@angular/forms`, lista para usarse directamente en
 * FormBuilders o directivas de template.
 *
 * Alineado con: PCI-DSS v4.0 / CONDUSEF / OWASP Top 10 (A03: Injection).
 * @see https://owasp.org/Top10/A03_2021-Injection/
 */

import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { SECURITY_LIMITS, SECURITY_PATTERNS } from './security.constants';

export class AuraValidators {

  /**
   * Valida que el campo no contenga patrones de SQL Injection.
   * Mitiga: OWASP A03 — Injection.
   */
  static sqlSafe: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const isSuspicious = SECURITY_PATTERNS.SQL_INJECTION_DETECT.test(control.value);
    return isSuspicious ? { sqlInjection: { value: control.value } } : null;
  };

  /**
   * Valida que el campo no contenga patrones de Cross-Site Scripting (XSS).
   * Mitiga: OWASP A03 — XSS / Script Injection.
   */
  static xssSafe: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const isSuspicious = SECURITY_PATTERNS.XSS_DETECT.test(control.value);
    return isSuspicious ? { xssInjection: { value: control.value } } : null;
  };

  /**
   * Valida que el campo solo contenga caracteres propios de un nombre humano:
   * Letras (incluyendo acentos y ñ), espacios y guiones.
   * Bloquea números, paréntesis, corchetes, signos de puntuación especiales.
   */
  static humanName: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const isValid = SECURITY_PATTERNS.HUMAN_NAME.test(control.value);
    return isValid ? null : { invalidName: { value: control.value } };
  };

  /**
   * Valida teléfono mexicano de exactamente 10 dígitos.
   * No acepta espacios, guiones ni indicativos internacionales.
   */
  static strictPhone: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const isValid = SECURITY_PATTERNS.PHONE_MX.test(control.value);
    return isValid ? null : { invalidPhone: { value: control.value } };
  };

  /**
   * Valida Código Postal mexicano de exactamente 5 dígitos.
   */
  static strictZip: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const isValid = SECURITY_PATTERNS.ZIP_MX.test(control.value);
    return isValid ? null : { invalidZip: { value: control.value } };
  };

  /**
   * Valida formato de correo electrónico compatible con RFC 5322.
   */
  static strictEmail: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const isValid = SECURITY_PATTERNS.EMAIL.test(control.value);
    return isValid ? null : { invalidEmail: { value: control.value } };
  };

  /**
   * Combinación todo-en-uno para campos de texto de dirección:
   * Anti-SQLi + Anti-XSS + MaxLength corporativo.
   */
  static safeAddress: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;

    if (SECURITY_PATTERNS.SQL_INJECTION_DETECT.test(control.value)) {
      return { sqlInjection: true };
    }
    if (SECURITY_PATTERNS.XSS_DETECT.test(control.value)) {
      return { xssInjection: true };
    }
    if (control.value.length > SECURITY_LIMITS.MAX_ADDRESS_LEN) {
      return { maxlength: { requiredLength: SECURITY_LIMITS.MAX_ADDRESS_LEN, actualLength: control.value.length } };
    }
    return null;
  };

  /**
   * Valida que el campo no exceda el límite corporativo de longitud para nombres.
   * A diferencia de Validators.maxLength, este retorna un error descriptivo de Aura.
   */
  static maxNameLength: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    return control.value.length > SECURITY_LIMITS.MAX_NAME_LEN
      ? { auraMaxLength: { field: 'name', limit: SECURITY_LIMITS.MAX_NAME_LEN } }
      : null;
  };
}
