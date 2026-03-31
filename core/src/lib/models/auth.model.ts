// core/models/auth.model.ts

/**
 * Usuario autenticado — modelo de dominio interno
 * No depende de la estructura de Prestashop
 */
export interface AuthUser {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
}


/**
 * Request de login — modelo de dominio
 */
export interface LoginRequest {
  email: string;
  password: string; // ← "password" en dominio, se mapea a "passwd" en el DTO
}
