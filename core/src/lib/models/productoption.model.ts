// core/models/product-option.model.ts
export interface ProductOption {
  id: number;
  name: string;
  publicName: string;
}

// core/models/product-option-value.model.ts
export interface ProductOptionValue {
  id: number;
  attributeGroupId: number;
  name: string;
}

