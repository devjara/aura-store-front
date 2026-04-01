import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'aura-metric-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './metric-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetricCardComponent {
  /** El título gris en mayúsculas (ej: ACTIVE ORDERS) */
  @Input({ required: true }) title!: string;
  
  /** El valor numérico principal grande (ej: 24) */
  @Input({ required: true }) value!: string | number;
  
  /** Texto opcional para la esquina superior derecha (ej: +12%) */
  @Input() trendBadge?: string;
  
  /** Clases CSS para colorear el recuadro del icono (ej: 'bg-blue-100 text-blue-600') */
  @Input() iconBoxClass = 'bg-gray-100 text-gray-600';
}
