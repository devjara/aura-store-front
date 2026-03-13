import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../src/environments/environment.development';
import { TenantService } from '../tenant/tenant.service';
import { Product } from '../../models/product.model'; // Ajusta la ruta a tu modelo

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  private tenantService = inject(TenantService);

  async getProducts(): Promise<Product[]> {
    try {
      // 1️⃣ PRIMERO: Descargamos el "Diccionario" de Categorías
      const catResponse = await firstValueFrom(
        this.http.get<any>(`${environment.apiUrl}/categories`, {
          params: { display: 'full', output_format: 'JSON' }
        })
      );

      // Armamos un mapa rápido: { "3": "Clothes", "4": "Accessories", ... }
      const categoryMap = new Map<string, string>();
      if (catResponse && catResponse.categories) {
        catResponse.categories.forEach((cat: any) => {
          categoryMap.set(cat.id.toString(), this.extractText(cat.name));
        });
      }

      // 2️⃣ SEGUNDO: Descargamos los Productos
      const prodResponse = await firstValueFrom(
        this.http.get<any>(`${environment.apiUrl}/products`, {
          params: { display: 'full', output_format: 'JSON' }
        })
      );

      if (!prodResponse || !prodResponse.products) {
        return [];
      }

      // 3️⃣ TERCERO: Traducimos y limpiamos cada producto
      return prodResponse.products.map((item: any) => this.mapToProduct(item, categoryMap));
    } catch (error) {
      console.error('🚨 Error descargando catálogo de PrestaShop:', error);
      return [];
    }
  }

  // 🛠️ Función Helper para extraer textos (Manejando multi-idioma de PrestaShop)
  private extractText(field: any): string {
    if (Array.isArray(field)) return field[0].value;
    if (typeof field === 'object' && field !== null) return field.value || '';
    return field || '';
  }

  // 🛠️ El Patrón Adapter
  private mapToProduct(item: any, categoryMap: Map<string, string>): Product {
    const apiKey = this.tenantService.getApiKey();
    const imageId = item.id_default_image;
    const imageUrl = imageId 
      ? `${environment.apiUrl}/images/products/${item.id}/${imageId}?ws_key=${apiKey}`
      : 'assets/images/placeholder.png';

    // ¡AQUÍ OCURRE LA MAGIA! Buscamos el ID en el diccionario
    const categoryId = item.id_category_default?.toString();
    const categoryName = categoryMap.get(categoryId) || 'General'; // Si no lo encuentra, usa General

    return {
      id: parseInt(item.id, 10),
      name: this.extractText(item.name),
      description: this.extractText(item.description_short),
      price: parseFloat(item.price) || 0,
      imageUrl: imageUrl,
      category: categoryName, // 👈 Ahora inyectamos el nombre real
      stock: parseInt(item.quantity, 10) || 0,
      active: item.active === '1'
    };
  }
}