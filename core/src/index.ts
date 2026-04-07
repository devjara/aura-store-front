//Exportamos los modelos
export * from './lib/models/product.model';
export * from './lib/models/category.model';
export * from './lib/models/customer.model';
export * from './lib/models/filter.state';
export * from './lib/models/tenant.model';
export * from './lib/models/order.model';
export * from './lib/models/cart-rule.model';
export * from './lib/models/address.model';
export * from './lib/models/checkout-payload.model';

//Exportamos los DTOs
export * from './lib/dto/ps-cart.dto';
export * from './lib/dto/ps-product.dto';
export * from './lib/dto/ps-api-response.dto';
export * from './lib/dto/ps-language-string.dto';
export * from './lib/dto/ps-order.dto';
export * from './lib/dto/ps-cart-rule.dto';

//Exportamos los servicios y utilidades
export * from './lib/services/prestashop-api';
export * from './lib/interceptors/api-interceptor';
export * from './lib/utils/prestashop-mapper.util';
export * from './lib/utils/console-protection.util';
export * from './lib/utils/security.constants';
export * from './lib/utils/security.validators';
export * from './lib/utils/sanitizer.util';
export * from './lib/interceptors/security.interceptor';
export * from './lib/hooks/use-catalog-filter';

// Exportamos los servicios principales y el estado global
export * from './lib/services/tenant/tenant.service';
export * from './lib/services/product/product.service';
export * from './lib/services/cart/cart.service';
export * from './lib/services/category/category.service';
export * from './lib/contracts/portal.contract';
export * from './lib/services/portal/portal.service';
export * from './lib/contracts/auth.contract';
export * from './lib/services/auth/auth.service';
export * from './lib/guards/auth.guard';
export * from './lib/contracts/order.contract';
export * from './lib/services/order/order.service';
export * from './lib/services/stock/stock.service';
export * from './lib/models/stock-available.model';
export * from './lib/dto/ps-stock-available.dto';

export type { FilterConfig, FilterOption, FilterState, FilterType } from './lib/models/filter.model';
export type { CartItemView, CartItemVariation, Cart } from './lib/models/cart.model';
export type { AuthContract  } from './lib/contracts/auth.contract';
export { AUTH_CONTRACT } from './lib/contracts/auth.contract';
export type { OrderContract } from './lib/contracts/order.contract';
export { ORDER_CONTRACT } from './lib/contracts/order.contract';
