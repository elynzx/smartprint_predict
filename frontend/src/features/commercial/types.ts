export type CommercialAvailabilityStatus = "Disponible" | "Stock Limitado";

export interface CommercialSupplyItem {
  insumo_id: number;
  nombre: string;
  categoria?: string;
  unidad: string;
  estado_disponibilidad: CommercialAvailabilityStatus;
  observacion_comercial: string;
}
