import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fallbackImage',
  standalone: true
})
export class FallbackImagePipe implements PipeTransform {
  transform(imageUrl: string | null | undefined, fallbackPath: string = 'assets/images/no-image.webp'): string {
    if (!imageUrl || imageUrl.trim() === '') {
      return fallbackPath;
    }
    return imageUrl;
  }
}
