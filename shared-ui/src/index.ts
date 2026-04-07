// (Nota: Esta primera línea la genera Nx por defecto. Si no tienes nada adentro de ese archivo, puedes borrar la línea sin problema).
// export { SharedUi } from './lib/shared-ui/shared-ui'; 

// --- EXPORTAMOS LOS COMPONENTES ---
export { ProductDetail } from './lib/components/product-detail/product-detail';
export { ProductCard } from './lib/components/product-card/product-card';
export { Filter } from './lib/components/filter/filter';
export { CartDrawer } from './lib/components/cart-drawer/cart-drawer';

export { Button } from './lib/components/ui/button/button';
export { Navbar } from './lib/components/navbar/navbar';
export { Footer } from './lib/components/footer/footer';
export { Pagination } from './lib/components/pagination/pagination';

export { MetricCardComponent } from './lib/components/metric-card/metric-card.component';
export { StatusBadgeComponent } from './lib/components/status-badge/status-badge.component';



// --- EXPORTAMOS LOS PIPES ---
export { FallbackImagePipe } from './lib/pipes/fallback-image-pipe';
export { FormatPricePipe } from './lib/pipes/format-price-pipe';
export { StockBadgePipe } from './lib/pipes/stock-badge-pipe';
export { SafeHtmlPipe } from './lib/pipes/safe-html-pipe';


// --- EXPORTAMOS LOS MODELOS ---
export * from './lib/models/navigation.model';