/**
 * Diccionario Universal de Endpoints para Aura Store Front
 * Evita el hardcoding en los servicios core aislando los paths a un único origen de verdad.
 */
export const API_ENDPOINTS = {
  PRODUCTS: '/products',
  CATEGORIES: '/categories',
  STOCK: '/stock_availables',
} as const;
