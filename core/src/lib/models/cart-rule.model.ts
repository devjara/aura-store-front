/**
 * Modelo de dominio para las reglas de carrito (Cupones / Recompensas).
 * Representa la estructura limpia y tipada que consume el Frontend (UI).
 */
export interface CartRule {
  id: number;
  customerId: number;
  code: string;
  description: string;
  dateFrom: Date;
  dateTo: Date;
  minimumAmount: number;
  reductionPercent: number;
  reductionAmount: number;
  isActive: boolean;
}
