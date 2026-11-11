export type MovementType = "ENTRADA" | "SALIDA";

export interface MovementRequest {
  insumo_id: number;
  tipo: MovementType;
  cantidad: number;
  motivo: string;
  documento_referencia?: string;
  observaciones?: string;
  proveedor?: string;
  fecha_operacion?: string;
}

export interface MovementResponse {
  id: number;
  insumo_id: number;
  tipo: MovementType;
  cantidad: number;
  saldo_resultante: number;
  fecha_operacion: string;
  usuario_id: number;
}

export interface MovementHistoryItem {
  id: number;
  insumo_id: number;
  insumo_nombre: string;
  unidad: string;
  tipo: MovementType;
  cantidad: number;
  motivo: string;
  proveedor?: string | null;
  documento_referencia?: string | null;
  observaciones?: string | null;
  fecha_operacion: string;
  usuario_id: number;
  usuario_nombre: string;
}
