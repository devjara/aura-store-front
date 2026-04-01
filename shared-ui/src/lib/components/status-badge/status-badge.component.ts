import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export type StatusType = 'transit' | 'delivered' | 'processing' | 'hold' | 'default';

@Component({
  selector: 'aura-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-badge.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadgeComponent {
  /** El tipo de estado que define los colores y el icono/punto */
  @Input({ required: true }) set status(val: StatusType | string) {
    this._status.set(val as StatusType);
  }

  /** Texto opcional para sobrescribir el texto por defecto del badge */
  @Input() text?: string;

  private _status = signal<StatusType>('default');

  // Computed configuration based on the status
  config = computed(() => {
    switch (this._status()) {
      case 'transit':
        return {
          label: 'In Transit',
          cssClass: 'bg-blue-50 text-blue-600',
          dot: true,
          dotClass: 'bg-blue-600'
        };
      case 'delivered':
        return {
          label: 'Delivered',
          cssClass: 'bg-emerald-50 text-emerald-600',
          dot: true,
          dotClass: 'bg-emerald-600'
        };
      case 'processing':
        return {
          label: 'Processing',
          cssClass: 'bg-gray-100 text-gray-500',
          dot: true,
          dotClass: 'bg-gray-400'
        };
      case 'hold':
        return {
          label: 'On Hold',
          cssClass: 'bg-red-50 text-red-600',
          dot: true,
          dotClass: 'bg-red-600'
        };
      default:
        return {
          label: 'Unknown',
          cssClass: 'bg-gray-50 text-gray-600',
          dot: false,
          dotClass: ''
        };
    }
  });
}
