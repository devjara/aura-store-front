import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthUser, LoginRequest } from '../../models/auth.model';
import { PsLoginRequestDto, PsLoginResponseDto } from '../../dto/ps-auth.dto';
import { AuthBreaker } from '../../utils/auth.breaker';
import { AuthContract } from './auth.contract';


/**
 * AuthService — Implementación de AuthContract para Prestashop.
 *
 * Usa auth.php como endpoint de autenticación y AuthBreaker como
 * Circuit Breaker para proteger el sistema multi-tenant de fallos
 * en cascada. Si auth.php falla 3 veces consecutivas, el circuito
 * se abre y retorna error inmediato sin hacer más llamadas HTTP
 * hasta que el servicio se recupere (60 segundos).
 *
 * Registrar en app.config.ts de cada tienda:
 * { provide: AuthContract, useClass: AuthService }
 */

@Injectable({ providedIn: 'root' })
export class AuthService extends AuthContract {
  private http = inject(HttpClient);

  // Circuit Breaker - 3 Fallos abren el circuito, 60 segundos de timeout
  private breaker = new AuthBreaker(3, 60000); // Threshold: 3 fallos, Timeout: 60 segundos

  // Estado global
  public currentUser = signal<AuthUser | null>(null);
  public isLoggedIn = computed(() => this.currentUser() !== null);

  constructor() {
    super();
    this.restoreSession();
  }

  /**
   * Autentica al usuario contra auth.php de Prestashop.
   * Aplica Circuit Breaker — si el circuito está abierto lanza
   * AUTH_SERVICE_UNAVAILABLE sin hacer la llamada HTTP.
   *
   * @throws `AUTH_SERVICE_UNAVAILABLE` — circuit breaker abierto
   * @throws `AUTH_TOO_MANY_ATTEMPTS`   — rate limiting del servidor (429)
   * @throws `AUTH_INVALID_CREDENTIALS` — credenciales incorrectas (401)
   * @throws `AUTH_ERROR`               — error genérico del servidor (500)
   */
  override async login(request: LoginRequest): Promise<AuthUser> {
    if (this.breaker.isOpen()) {
      throw new Error('AUTH_SERVICE_UNAVAILABLE');
    }
    try {
      const dto = this.toLoginDto(request);
      const response = await firstValueFrom(this.http.post<PsLoginResponseDto>('/auth.php', dto));

      this.breaker.recordSuccess();

      const user = this.toAuthUser(response);
      this.currentUser.set(user);
      localStorage.setItem('aura_user', JSON.stringify(user));
      return user;
    } catch (error) {
      this.breaker.recordFailure();
      throw this.handleError(error);
    }
  }

  /**
   * Cierra la sesión del usuario actual.
   * Limpia el signal y el localStorage.
   */
  override logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem('aura_user');
  }

  // Restaurar sesion desde localStorage al iniciar la app
  private restoreSession(): void {
    try {
      const stored = localStorage.getItem('aura_user');
      if (stored) {
        this.currentUser.set(JSON.parse(stored));
      }
    } catch {
      localStorage.removeItem('aura_user');
    }
  }

  // Mappers entre dominio y DTOs

  /** Dominio → DTO — mapea "password" a "passwd" que espera el PHP */
  private toLoginDto(request: LoginRequest): PsLoginRequestDto {
    return {
      email: request.email,
      passwd: request.password,
    };
  }

  /** DTO → Dominio — transforma la respuesta del PHP al modelo interno */
  private toAuthUser(dto: PsLoginResponseDto): AuthUser {
    return {
      id: dto.id,
      email: dto.email,
      firstname: dto.firstname,
      lastname: dto.lastname,
    };
  }

  // ─── Manejo de errores HTTP → errores de dominio ──────────────────────────
  private handleError(error: unknown): Error {
    if (error instanceof HttpErrorResponse) {
      switch (error.status) {
        case 401:
          return new Error('AUTH_INVALID_CREDENTIALS');
        case 429:
          return new Error('AUTH_TOO_MANY_ATTEMPTS');
        case 500:
          return new Error('AUTH_ERROR');
        default:
          return new Error('AUTH_ERROR');
      }
    }
    return new Error('AUTH_ERROR');
  }
}
