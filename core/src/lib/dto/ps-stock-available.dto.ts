export interface PsStockAvailableDto {
    id: number;
    id_product: number;
    id_product_attribute:number;
    id_shop:number;
    id_shop_group:number;
    quantity:number;
    depends_on_stock:string;
    out_of_stock:string;
    location: string;
}

export interface StockAvailableResponseDto {
    stock_available: PsStockAvailableDto;
}

export interface StockAvailableListResponseDto {
    stock_availables: PsStockAvailableDto[];
}