// core/dto/ps-auth.dto.ts

/**
 * DTO de request al endpoint auth.php
 * Credenciales enviadas para autenticación
 */
export interface PsLoginRequestDto {
  email: string;
  passwd: string;
}

/**
 * DTO de request para registro al endpoint auth.php
 */
export interface PsRegisterRequestDto {
  firstname?: string;
  email: string;
  passwd: string;
}

/**
 * DTO de response del endpoint auth.php
 * Refleja exactamente lo que devuelve el PHP
 */
export interface PsLoginResponseDto {
  success: boolean;
  id: number;
  email: string;
  firstname: string;
  lastname: string;
}

/**
 * DTO de error del endpoint auth.php
 * Cuando HTTP status es 400, 401, 429 o 500
 */
export interface PsAuthErrorDto {
  error: string;
}
