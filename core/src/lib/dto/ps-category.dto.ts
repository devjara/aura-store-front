import { PsLanguageStringDto } from "./ps-language-string.dto";

export interface PsCategoryDto
{
    id: number;
    id_parent: string;
    name: string | PsLanguageStringDto[];
    description: string | PsLanguageStringDto[];
    link_rewrite: string | PsLanguageStringDto[];
    imageUrl?:string;
    active: string;
}
