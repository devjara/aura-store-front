import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { filter, firstValueFrom } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { TenantService } from '../tenant/tenant.service';
import { Product } from '../../models/product.model';
import { CacheUtil } from '../../utils/cache.util';
import { PsApiResponseDTO } from '../../dto/ps-api-response.dto';
import { PsCategoryDto } from '../../dto/ps-category.dto';
import { PsProductDto } from '../../dto/ps-product.dto';
import { PsLanguageStringDto } from '../../dto/ps-language-string.dto';
import { API_ENDPOINTS } from '../../config/api-endpoints.config';

@Injectable({
  providedIn: 'root',
})
export class ProductService {

  //Inyecciones
  private http = inject(HttpClient);
  private tenantService = inject(TenantService);
  private tenant$ = toObservable(this.tenantService.tenant);

  //Cache
  private cache = new CacheUtil<Product[]>();

  //Espera al tenant
  private async waitForTenant(): Promise<void> {
    return firstValueFrom(this.tenant$.pipe(filter((t) => t !== null))).then(() => void 0);
  }

  /**
   * Retorna todos los productos del catalogo
   * Usa cache de 5 min = en navegaciones posteriores retorn
   * inmediato sin llamar a prestashop
   * @returns
   */
  async getProducts(): Promise<Product[]> {
    // Cache valido - return sin llamar a la API
    const cached = this.cache.get();
    if (cached) return cached;
    await this.waitForTenant();

    try {
      const apiUrl = this.tenantService.getApiUrl();
      const apiKey = this.tenantService.getApiKey();

      // 1️⃣ PRIMERO: Descargamos el "Diccionario" de Categorías
      const catResponse = await firstValueFrom(this.http.get<PsApiResponseDTO<PsCategoryDto>>(`${apiUrl}${API_ENDPOINTS.CATEGORIES}`, {
          params: { display: 'full', output_format: 'JSON' },
        }),
      );

      const categoryMap = new Map<string, string>();
      if (catResponse && catResponse.categories) {catResponse.categories.forEach((cat: PsCategoryDto) => {
          categoryMap.set(cat.id.toString(), this.extractText(cat.name));
        });
      }

      // 2️⃣ SEGUNDO: Descargamos los Productos
      const prodResponse = await firstValueFrom(this.http.get<PsApiResponseDTO<PsProductDto>>(`${apiUrl}${API_ENDPOINTS.PRODUCTS}`, {
          params: { display: 'full', output_format: 'JSON' },
        }),
      );

      if (!prodResponse || !prodResponse.products) return [];

      const products = prodResponse.products.map((item: PsProductDto) =>
        this.mapToProduct(item, categoryMap, apiUrl, apiKey),
      );

      this.cache.set(products);
      return products;
    } catch (error) {
      console.error('🚨 Error descargando catálogo de PrestaShop:', error);
      return [];
    }
  }

  /**
   *
   * Filtra productos por nombre de categoria
   * Reutiliza el cache de getProducts()
   *
   * */
  async getProductsByCategory(category: string): Promise<Product[]> {
    const all = await this.getProducts();
    return all.filter((p) => p.category.toLowerCase() === category.toLowerCase());
  }

  /**
   * Invalida el cache manualmente
   * Llamar cuando se detecte un cambio en el catalogo
   */
  invalidateCache(): void {
    this.cache.invalidate();
  }


  // Función Helper para extraer textos (Manejando multi-idioma de PrestaShop)
  private extractText(field: string | PsLanguageStringDto[]): string {
    if (Array.isArray(field)) return field[0]?.value ?? '';
    return field || '';
  }

  // 🛠️ El Patrón Adapter
  private mapToProduct(
    item: PsProductDto,
    categoryMap: Map<string, string>,
    apiUrl: string,
    apiKey: string,
  ): Product {
      const imageUrl = item.id_default_image
        ? `${apiUrl}/images/products/${item.id}/${item.id_default_image}?ws_key=${apiKey}`
        : 'assets/images/placeholder.png';

    const categoryName = categoryMap.get(item.id_category_default?.toString()) || 'General'; // Si no lo encuentra, usa General

    return {
      id:           item.id,
      name:         this.extractText(item.name),
      description:  this.extractText(item.description_short),
      longDescription: this.extractText(item.description),
      price:        parseFloat(item.price) || 0,
      imageUrl:     imageUrl,
      category:     categoryName,
      stock:        parseInt(item.quantity, 10) || 0,
      active:       item.active === '1',
    };
  }
}
