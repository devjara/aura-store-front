/**
 * AuthBreaker — Implementación del patrón Circuit Breaker para el servicio de autenticación.
 *
 * ─── ¿Por qué se llama AuthBreaker? ────────────────────────────────────────
 * El nombre refleja su propósito específico: "romper" el circuito de autenticación
 * cuando detecta fallos repetidos. No es un Circuit Breaker genérico — está
 * diseñado exclusivamente para proteger el flujo de login/auth en un sistema
 * multi-tenant donde un fallo en un servicio de auth NO debe propagar errores
 * a otras tiendas ni degradar la experiencia del usuario con llamadas infinitas
 * a un servidor que ya sabemos que está caído.
 *
 * ─── ¿Por qué aplicamos el patrón Circuit Breaker? ──────────────────────────
 * En un sistema multi-tenant (N tiendas sobre la misma base), si el endpoint
 * auth.php falla, sin este patrón cada intento de login haría una llamada HTTP
 * que también fallará — generando cascada de errores, timeouts y mala UX.
 * El Circuit Breaker detecta el fallo, "abre el circuito" y retorna error
 * inmediato sin hacer más llamadas hasta que el servicio se recupere.
 *
 * ─── ¿Por qué aplicamos el principio Abierto/Cerrado (OCP)? ─────────────────
 * AuthBreaker está cerrado para modificación — sus reglas internas (threshold,
 * timeout, estados) no cambian. Pero está abierto para extensión — si mañana
 * necesitas un breaker con lógica diferente (ej: por tenant, por IP, con
 * notificaciones) creas una subclase sin tocar esta implementación.
 * Esto garantiza que cambiar el comportamiento del breaker en una tienda
 * no afecta a las otras N tiendas del sistema.
 *
 * ─── Estados del circuito ───────────────────────────────────────────────────
 * CLOSED     → circuito cerrado, llamadas permitidas. Estado normal de operación.
 * OPEN       → circuito abierto, llamadas bloqueadas. Se activa tras N fallos
 *              consecutivos. Retorna error inmediato sin llamar al servidor.
 * HALF-OPEN  → circuito semi-abierto, permite UN intento de recuperación.
 *              Si tiene éxito → vuelve a CLOSED. Si falla → vuelve a OPEN.
 *
 *  CLOSED ──(N fallos)──▶ OPEN ──(timeout)──▶ HALF-OPEN
 *    ▲                                              │
 *    └──────────────(éxito)────────────────────────┘
 */

export class AuthBreaker {
  /** Contador de fallos consecutivos desde el ultimo exito */
  private failures = 0;

  /** Timestamp del ultimo fallo registrado - usado para calcular el timeout */
  private lastFailure = 0;

  /** Estado actual del circuito */
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  /**
   * @param threshold Número de fallos consecutivos antes de abrir el circuito.
   *                  Default: 3 — tras 3 fallos el circuito se abre.
   * @param timeout   Milisegundos antes de intentar recuperación (half-open).
   *                  Default: 60000ms (1 minuto) — tiempo de espera entre
   *                  intentos de recuperación.
   */
  constructor(
    private readonly threshold = 3, // Número de fallos para abrir el circuito
    private readonly timeout = 60000, // Tiempo en ms para intentar cerrar el circuito
  ) {}

  /**
   * Verifica si el circuito está abierto — es decir, si las llamadas
   * deben ser bloqueadas.
   *
   * Si el circuito está OPEN pero ya pasó el timeout, transiciona a
   * HALF-OPEN para permitir un intento de recuperación.
   *
   * @returns `true` si el circuito está abierto y debe bloquearse la llamada.
   *          `false` si el circuito permite la llamada (CLOSED o HALF-OPEN).
   */
  isOpen(): boolean {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailure > this.timeout) {
        this.state = 'half-open';
        return false; // Permitir un intento de recuperación
      }
      return true; // Circuito abierto, bloquear llamadas
    }
    return false; // Circuito cerrado, permitir llamadas
  }

  /**
   * Registra un intento exitoso.
   * Resetea el contador de fallos y cierra el circuito.
   * Llamar después de un login/auth exitoso.
   */
  recordSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  /**
   * Registra un fallo en el servicio de auth.
   * Si los fallos acumulados alcanzan el threshold, abre el circuito.
   * Llamar en el catch de cada llamada fallida a auth.php.
   */
  recordFailure(): void {
    this.failures++;
    this.lastFailure = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }
}
