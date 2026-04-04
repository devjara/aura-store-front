import { computed, InjectionToken, Signal } from "@angular/core";
import { AuthUser, LoginRequest, RegisterRequest } from "../models/auth.model";

/**
 * AuthContract — Contrato abstracto del servicio de autenticación.
 *
 * ─── ¿Por qué existe este contrato? ─────────────────────────────────────────
 * En un sistema multi-tenant con N tiendas, cada tienda puede requerir
 * una implementación diferente de autenticación:
 *
 *   aura-market  → AuthService       (auth.php + Prestashop)
 *   tienda2      → AuthNetService    (API .NET futura)
 *   tienda3      → AuthFirebaseService (Firebase Auth)
 *
 * Sin este contrato, cada componente dependería de una implementación
 * concreta — si cambias el servicio, rompes todos los componentes que
 * lo usan. Con el contrato, los componentes dependen de la abstracción
 * y nunca saben qué implementación están usando.
 *
 * ─── Principio Abierto/Cerrado (OCP) ────────────────────────────────────────
 * AuthContract está CERRADO para modificación — el contrato no cambia,
 * los componentes que lo consumen no se tocan.
 * Está ABIERTO para extensión — agregar una nueva implementación de auth
 * es crear una nueva clase que extiende AuthContract, sin modificar nada
 * de lo que ya existe y funciona.
 *
 * ─── Principio de Inversión de Dependencias (DIP) ────────────────────────────
 * Los componentes no dependen de AuthService directamente — dependen de
 * AuthContract. La implementación concreta se inyecta en app.config.ts
 * de cada tienda:
 *
 * // aura-market/app.config.ts
 * { provide: AuthContract, useClass: AuthService }
 *
 * // tienda2/app.config.ts
 * { provide: AuthContract, useClass: AuthNetService }
 *
 * ─── Principio de Segregación de Interfaces (ISP) ────────────────────────────
 * El contrato solo expone lo mínimo necesario — login, logout y estado.
 * No expone detalles de implementación como DTOs, mappers o circuit breaker.
 */

export abstract class AuthContract {
  /**
   * Autentica al usuario con email y password.
   * Cada implementación define cómo valida las credenciales.
   *
   * @param request Credenciales de dominio — email y password
   * @returns Usuario autenticado
   * @throws Error con código específico:
   *   - `AUTH_INVALID_CREDENTIALS` — credenciales incorrectas
   *   - `AUTH_SERVICE_UNAVAILABLE` — circuit breaker abierto
   *   - `AUTH_TOO_MANY_ATTEMPTS`   — rate limiting activado
   *   - `AUTH_ERROR`               — error genérico del servidor
   */
  abstract login(request: LoginRequest): Promise<AuthUser>;

  /**
   * Cierra la sesión del usuario actual.
   * Limpia el estado y el almacenamiento local.
   */
  abstract logout(): void;

  /**
   * Usuario autenticado actualmente.
   * `null` si no hay sesión activa.
   * Signal reactivo — los componentes se actualizan automáticamente.
   */
  abstract currentUser: Signal<AuthUser | null>;

  /**
   * Indica si hay un usuario autenticado.
   * Computed derivado de `currentUser`.
   */
  abstract isLoggedIn: Signal<boolean> | ReturnType<typeof computed>;

  /**
   * Registra un nuevo usuario con email, password y nombre.
   * Cada implementación define cómo crea la cuenta.
   * @param request
   */
  abstract register(request: RegisterRequest): Promise<AuthUser>;
}

export const AUTH_CONTRACT = new InjectionToken<AuthContract>('AUTH_CONTRACT');
