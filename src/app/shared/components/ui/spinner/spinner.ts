import { Component,input, computed } from '@angular/core';

@Component({
  selector: 'app-spinner',
  imports: [],
  templateUrl: './spinner.html',
  styleUrl: './spinner.scss',
  standalone: true
})
export class Spinner {
  size = input<'sm' | 'md' | 'lg'>('md');

  sizeClass = computed(() => {
    switch(this.size()) {
      case 'sm': return 'h-4 w-4 mr-2';
      case 'lg': return 'h-8 w-8 mr-3';
      default: return 'h-5 w-5 mr-2';
    }
  });
}
