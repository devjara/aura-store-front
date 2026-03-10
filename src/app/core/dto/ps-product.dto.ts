import { PsLanguageStringDto } from "./ps-language-string.dto";

export interface PsProductDto
{
    id: number;
    name : string | PsLanguageStringDto[];
    description_short: string;
    price: string;
    id_default_image: string;
    id_category_default: string;
    quantity: string;
    active: string;
}