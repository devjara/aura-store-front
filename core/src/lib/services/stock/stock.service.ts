import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable, filter, switchMap, take, map } from "rxjs";
import { TenantService } from "../tenant/tenant.service";
import { toObservable } from '@angular/core/rxjs-interop';
import { StockAvailable, OutOfStockBehavior } from "../../models/stock-available.model";
import { StockAvailableResponseDto, StockAvailableListResponseDto, PsStockAvailableDto } from "../../dto/ps-stock-available.dto";

@Injectable({ providedIn: 'root' })
export class StockService {

  private http         = inject(HttpClient);
  private tenantService = inject(TenantService);
  private tenant$      = toObservable(this.tenantService.tenant);

  // ─── Helpers privados ──────────────────────────────────────

  private waitForTenant() {
    return this.tenant$.pipe(
      filter(t => !!t),
      take(1)
    );
  }

  private headers(apiKey: string): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Basic ${btoa(apiKey + ':')}`,
    });
  }

  private mapOne(dto: PsStockAvailableDto): StockAvailable {
    return {
      id:                 dto.id,
      idProduct:          dto.id_product,
      idProductAttribute: dto.id_product_attribute,
      idShop:             dto.id_shop,
      idShopGroup:        dto.id_shop_group,
      quantity:           dto.quantity,
      dependsOnStock:     dto.depends_on_stock === '1',
      outOfStock:         parseInt(dto.out_of_stock) as OutOfStockBehavior,
      location:           dto.location ?? '',
    };
  }

  // ─── API pública ───────────────────────────────────────────

  /** Stock de un producto por su stock_available id */
  getById(stockId: number): Observable<StockAvailable> {
    return this.waitForTenant().pipe(
      switchMap(tenant => {
        if (!tenant) throw new Error('Tenant is required');
        return this.http.get<StockAvailableResponseDto>(
          `${tenant.apiUrl}/stock_availables/${stockId}`,
          {
            headers: this.headers(tenant.apiKey),
            params: { output_format: 'JSON' }
          }
        );
      }),
      map(res => this.mapOne(res.stock_available))
    );
  }

  /** Stock de un producto directamente por id_product */
  getByProductId(productId: number): Observable<StockAvailable> {
    return this.waitForTenant().pipe(
      switchMap(tenant => {
        if (!tenant) throw new Error('Tenant is required');
        return this.http.get<StockAvailableListResponseDto>(
          `${tenant.apiUrl}/stock_availables`,
          {
            headers: this.headers(tenant.apiKey),
            params: {
              output_format: 'JSON',
              display: 'full',
              'filter[id_product]': productId.toString()
            }
          }
        );
      }),
      map(res => this.mapOne(res.stock_availables[0]))
    );
  }

  /** Stocks de múltiples productos en una sola llamada (evita N+1) */
  getByProductIds(productIds: number[]): Observable<Map<number, StockAvailable>> {
    const filter = `[${productIds.join('|')}]`;

    return this.waitForTenant().pipe(
      switchMap(tenant => {
        if (!tenant) throw new Error('Tenant is required');
        return this.http.get<StockAvailableListResponseDto>(
          `${tenant.apiUrl}/stock_availables`,
          {
            headers: this.headers(tenant.apiKey),
            params: {
              output_format: 'JSON',
              display: 'full',
              'filter[id_product]': filter
            }
          }
        );
      }),
      map(res => {
        const stockMap = new Map<number, StockAvailable>();
        for (const dto of res.stock_availables) {
          // Solo productos simples (id_product_attribute = 0)
          if (dto.id_product_attribute === 0) {
            stockMap.set(dto.id_product, this.mapOne(dto));
          }
        }
        return stockMap;
      })
    );
  }
}