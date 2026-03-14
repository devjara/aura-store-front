import { PsLanguageStringDto } from "./ps-language-string.dto";


// core/dto/ps-product-option.dto.ts
export interface PsProductOptionDTO {
  id: number;
  name: string | PsLanguageStringDto[];
  public_name: string | PsLanguageStringDto[];
}

// core/dto/ps-product-option-value.dto.ts
export interface PsProductOptionValueDTO {
  id: number;
  id_attribute_group: string;
  name: string | PsLanguageStringDto[];
}

