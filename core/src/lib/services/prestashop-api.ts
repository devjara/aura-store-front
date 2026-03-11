import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { PsApiResponseDTO } from '../dto/ps-api-response.dto';
import { PsProductDto } from '../dto/ps-product.dto';
import { Product } from '../models/product.model';
import { PrestashopMapper } from '../utils/prestashop-mapper.util';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../src/environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class PrestashopApi {
  //Inyectamos el HttpClient para hacer las peticiones
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getProducts(): Observable<Product[]> {
    return this.http.get<PsApiResponseDTO<PsProductDto>>(`${this.apiUrl}/products?display=full`).pipe(
      map(response => this.mapToProducts(response.products || []))
    );
  }

  private mapToProducts(psProducts: PsProductDto[]): Product[] {
    return psProducts.map(p => ({
      id: p.id,
      name: PrestashopMapper.parseString(p.name),
      description: PrestashopMapper.parseString(p.description_short),
      price: PrestashopMapper.parsePrice(p.price),
      imageUrl: p.id_default_image ? `${this.apiUrl}/images/products/${p.id}/${p.id_default_image}` : '',
      category: String(p.id_category_default || 'General'),
      stock: PrestashopMapper.parseNumber(p.quantity),
      active: PrestashopMapper.parseBoolean(p.active)
    }));
  }
}
