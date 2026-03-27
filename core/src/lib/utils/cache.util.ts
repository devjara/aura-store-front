/**
 * CacheUtil<T> - Cache generico con TTL (Time to Live)
 *
 * Permite almacenar cualquier tipo de dato en memoria con expiración
 * automática. Útil para evitar peticiones repetidas a APIs externas
 * como Prestashop, donde los datos cambian con poca frecuencia.
 *
 * * Uso básico:
 * ```ts
 * private cache = new CacheUtil<Product[]>(); // TTL default: 5 min
 * private cache = new CacheUtil<Product[]>(10 * 60 * 1000); // TTL: 10 min
 * ```
 *
 */

export class CacheUtil<T>{
  /** Datos almacenados en memoria */
  private data        :T | null = null;

  /** Timestamp en ms de cuando se guardaran los datos */
  private timestamp   :number | null = null;

  constructor(private readonly ttl: number = 5 * 60 * 1000) {}

  /**
   * Verifica si el cache tiene datos validos y no ha expirado
   * @returns `true` si hay datos y el TTL no ha vencido
   */
  isValid():boolean {
    if(!this.timestamp || !this.data) return false;
    return Date.now() - this.timestamp < this.ttl;
  }

  /**
   * Retorna los datos si el cache es valido o null si expiro
   * Usar en la entrada de cada metodo async antes de llamar a la API
   * @returns
   */
  get(): T | null {
    return this.isValid() ? this.data : null;
  }


  /**
   * Guarda datos en la cache y registra el timestamp actual.
   * LLamar despues de recibir respuesta exitosa de la API
   * @param data
   */
  set(data: T) : void {
    this.data       = data;
    this.timestamp  = Date.now();
  }

  /**
   * Retorna los datos aunque el TTL haya expirado.
   * Usar como fallback cuando la API falla
   * @returns
   */
  getStale(): T | null {
    return this.data;
  }

  /**
   * Limpia el cache manualmente - fuerza una nueva peticion
   * en el siguiente get(). Util cuando detectamos un cambio
   * en el catalogo o se necesita forzar una recarga
   */
  invalidate(): void {
    this.data       = null;
    this.timestamp  = null;
  }

}
