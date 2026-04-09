import { Pipe, PipeTransform } from '@angular/core';

/**
 * Recibe un string con etiquetas HTML escapadas (típico de WYSIWYG)
 * y lo devuelve como texto plano limpio.
 * 
 * Útil para descripciones previas o extractos en tarjetas.
 */
@Pipe({
  name: 'stripHtml',
  standalone: true
})
export class StripHtmlPipe implements PipeTransform {
  transform(value: string | undefined | null): string {
    if (!value) return '';
    
    // Remueve todo lo que se parezca a una etiqueta HTML
    let text = value.replace(/<[^>]*>?/gm, '');
    
    // Transforma entidades html comunes en espacios
    text = text.replace(/&nbsp;/g, ' ').trim();
    
    return text;
  }
}
