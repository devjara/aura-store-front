/**
 * Modelo de stock disponible
 */
export interface StockAvailable {
    id: number;
    idProduct: number;
    idProductAttribute: number;
    idShop: number;
    idShopGroup: number;
    quantity: number;
    dependsOnStock: boolean;
    outOfStock: number;
    location: string;
}

/**
 * Comportamiento cuando el stock es 0
 */
export enum OutOfStockBehavior {
  Deny    = 0,  // No se puede comprar sin stock
  Allow   = 1,  // Se puede comprar sin stock
  Default = 2,  // Usa configuración global de la tienda
}