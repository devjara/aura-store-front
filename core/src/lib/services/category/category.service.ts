// core/services/category/category.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, filter } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { TenantService } from '../tenant/tenant.service';
import { Category } from '../../models/category.model';
import { CacheUtil } from '../../utils/cache.util';
import { PsApiResponseDTO } from '../../dto/ps-api-response.dto';
import { PsCategoryDto } from '../../dto/ps-category.dto';
import { PsLanguageStringDto } from '../../dto/ps-language-string.dto';

@Injectable({ providedIn: 'root' })
export class CategoryService {

  //Inyecciones
  private http = inject(HttpClient);
  private tenantService = inject(TenantService);
  private tenant$ = toObservable(this.tenantService.tenant);

  //Cache
  private cache = new CacheUtil<Category[]>();


  //Espera del tenant
  private async waitForTenant(): Promise<void> {
    await firstValueFrom(this.tenant$.pipe(filter((t) => t !== null)));
  }

  /**
   * Retorna todas las categorias activas del catalog
   * Usa cache de 5 minutos - en navegaciones posteriores retorna
   * inmediato sin llamar a prestashop
   * @returns
   */

  async getCategories(): Promise<Category[]> {
    const cached = this.cache.get();
    if(cached) return cached;
    await this.waitForTenant();


    try {
      const apiUrl = this.tenantService.getApiUrl();
      const apiKey = this.tenantService.getApiKey();


      const response = await firstValueFrom(
        this.http.get<PsApiResponseDTO<PsCategoryDto>>(`${apiUrl}/categories`, {
          params: { display: 'full', output_format: 'JSON' },
        }),
      );

      const categories: Category[] = (response.categories ?? [])
        .filter((cat: PsCategoryDto) => cat.active === '1' && cat.id_parent !== '0')
        .map((cat: PsCategoryDto) => ({
          id:          parseInt(cat.id.toString()),
          parentId:    parseInt(cat.id_parent),
          name:        this.extractText(cat.name),
          slug:        this.extractText(cat.link_rewrite),
          description: this.extractText(cat.description),
          active:      true,
          imageUrl:    `${apiUrl}/images/categories/${cat.id}?ws_key=${apiKey}`,
        }));

        this.cache.set(categories);
        return categories;
    } catch (error) {
      console.error('🚨 Error descargando categorías de Prestashop:', error);
      return this.cache.getStale() ?? [];
    }
  }

  /**
   * Invalida el cache manualmente
   * LLamar cuando se detecte un cambio en las categorias
   */
  invalidateCache(): void {
    this.cache.invalidate();
  }

  /**
   *
   * @param field Para el manejo multilenguaje
   * @returns
   */
  private extractText(field: string | PsLanguageStringDto[] ): string {
    if (Array.isArray(field)) return field[0].value;
    return field ?? '';
  }
}
