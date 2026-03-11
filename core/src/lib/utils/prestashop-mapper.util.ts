import { PsLanguageStringDto } from "../dto/ps-language-string.dto";

export class PrestashopMapper 
{

    //Limpia string multi-idioma
    static parseString(value : string | PsLanguageStringDto[] | undefined): string 
    {
        if(!value) return '';
        return Array.isArray(value) ? (value[0]?.value || '') : value;
    }

    // Limpia precios 
    static parsePrice(value: string | number | undefined): number
    {
        if(value === undefined) return 0;
        return Number(parseFloat(String(value)).toFixed(2));
    }

    // Limpia cantidades y numeros enteros
    static parseNumber(value: string | number | undefined): number
    {
        if(value === undefined) return 0;
        return Number(value);
    }

    // Convierte el "1" o "0" de prestashop a booleanos estrictos
    static parseBoolean(value: string | number | undefined): boolean 
    {
        return value === '1' || value === 1;
    }
}