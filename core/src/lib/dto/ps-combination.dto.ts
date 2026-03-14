export interface PsCombinationDTO {
  id: number;
  id_product: string;
  reference: string;
  price: string;
  quantity: string;
  associations?: {
    product_option_values?: {
      id: string;
    }[];
  };
}