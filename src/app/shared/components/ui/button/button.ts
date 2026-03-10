import { Component, input, output, computed } from '@angular/core';
import { Spinner } from '../spinner/spinner';

@Component({
  selector: 'app-button',
  imports: [Spinner],
  templateUrl: './button.html',
  styleUrl: './button.scss',
})

export class Button {
  variant = input<'primary' | 'secondary' | 'outline' | 'danger' | 'action'>('primary');
  type = input<'button' | 'submit' | 'reset'>('button');
  disabled = input<boolean>(false);
  isLoading = input<boolean>(false);
  
  onClick = output<MouseEvent>();

  computedClasses = computed(() => {
    const baseClasses = 'inline-flex justify-center items-center rounded-full px-6 py-2.5 text-sm font-bold transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed hover:disabled:scale-100 cursor-pointer';    
    
    switch (this.variant()) {
      case 'primary': 
        return `${baseClasses} bg-brand-primary text-white hover:bg-brand-primary-hover`;
      case 'action': 
        return `${baseClasses} bg-brand-action text-white hover:bg-brand-action-hover`;
      case 'danger': 
        return `${baseClasses} bg-brand-danger text-white hover:bg-red-700`;
      case 'secondary': 
        return `${baseClasses} bg-gray-200 text-gray-800 hover:bg-gray-300`;
      // 2. Variante Outline 
      case 'outline': 
        return `${baseClasses} border-2 border-gray-300 text-gray-800 hover:border-gray-900 hover:bg-gray-50`;
      default: 
        return baseClasses;
    }
  });
}
