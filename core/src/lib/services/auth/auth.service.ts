import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthUser, LoginRequest, RegisterRequest } from '../../models/auth.model';
import { PsLoginRequestDto, PsLoginResponseDto } from '../../dto/ps-auth.dto';
import { AuthBreaker } from '../../utils/auth.breaker';
import { AuthContract } from '../../contracts/auth.contract';
import { isPlatformBrowser } from '@angular/common';



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
  private platform = inject(PLATFORM_ID);

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
    if (!isPlatformBrowser(this.platform)) {
        throw new Error('AUTH_SERVICE_UNAVAILABLE');
    }
    // Evitar acceso a localStorage en SSR
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
   * Registra un nuevo usuario basado en el endpoint auth.php de Prestashop.
   */

  override async register(request: RegisterRequest): Promise<AuthUser> {
    if (!isPlatformBrowser(this.platform)) {
      throw new Error('AUTH_SERVICE_UNAVAILABLE');
    }

    if(this.breaker.isOpen()) {
      throw new Error('AUTH_SERVICE_UNAVAILABLE');
    }

    try
    {
      const xml = this.buildRegisterXml(request);
      const response = await firstValueFrom(
        this.http.post<any>('/api/customers', xml, {
          headers: { 'Content-Type': 'application/xml' }
        })
      );

      // 🚨 TRAMPA DE PRESTASHOP: Devuelve 201 Created en la cabecera, pero con "errors" en el JSON
      if (response && (response.errors || response.prestashop?.errors)) {
        const errorStr = JSON.stringify(response);
        if (errorStr.includes('"code":140') || errorStr.includes('"code":"140"')) {
          throw new Error('AUTH_EMAIL_ALREADY_EXISTS');
        }
        throw new Error('AUTH_ERROR');
      }

      this.breaker.recordSuccess();
      return await this.login({ email: request.email, password: request.password });
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
    if (!isPlatformBrowser(this.platform)) return;
    this.currentUser.set(null);
    localStorage.removeItem('aura_user');
  }

  // Restaurar sesion desde localStorage al iniciar la app
  private restoreSession(): void {
    if(!isPlatformBrowser(this.platform)) return; // Evitar acceso a localStorage en SSR
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
      
      // 🚨 TRAMPA DE PRESTASHOP: Lanza un estricto HTTP 500 cuando truena la validación (Email duplicado)
      const errorBody = typeof error.error === 'object' ? JSON.stringify(error.error) : String(error.error || '');
      if (errorBody.includes('140') && errorBody.toLowerCase().includes('correo')) {
        return new Error('AUTH_EMAIL_ALREADY_EXISTS');
      }

      switch (error.status) {
        case 400:
          return new Error('AUTH_EMAIL_ALREADY_EXISTS');
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

  private buildRegisterXml(request: RegisterRequest) : string {
    const firstName = request.firstName?.trim() || 'Cliente';
    return `<?xml version="1.0" encoding="UTF-8"?>
  <prestashop>
    <customer>
      <firstname><![CDATA[${firstName}]]></firstname>
      <lastname><![CDATA[Aura]]></lastname>
      <email><![CDATA[${request.email}]]></email>
      <passwd><![CDATA[${request.password}]]></passwd>
      <id_gender>0</id_gender>
      <newsletter>0</newsletter>
      <optin>0</optin>
      <active>1</active>
    </customer>
  </prestashop>`;
  }
}
