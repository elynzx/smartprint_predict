export type SupplyStatus = "Crítico" | "En Riesgo" | "Estable";

export interface SupplyItem {
  id: number;
  nombre: string;
  unidad: string;
  stock_actual: number;
  stock_minimo: number;
  costo_unitario: number;
  categoria: string;
  proveedor?: string;
  proveedor_referencial?: string;
}

export interface CreateSupplyPayload {
  nombre: string;
  unidad: string;
  stock_actual: number;
  stock_minimo: number;
  costo_unitario: number;
  categoria: string;
  proveedor?: string;
  proveedor_referencial?: string;
}

export interface UpdateSupplyPayload {
  nombre?: string;
  unidad?: string;
  stock_minimo?: number;
  costo_unitario?: number;
  categoria?: string;
  proveedor?: string;
  proveedor_referencial?: string;
}

export type MovementType = "ENTRADA" | "SALIDA";

export interface MovementRequest {
  insumo_id: number;
  tipo: MovementType;
  cantidad: number;
  motivo: string;
  proveedor?: string;
  documento_referencia?: string;
  observaciones?: string;
}

export interface MovementRecord {
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

export interface MovementCreatedResponse {
  id: number;
  insumo_id: number;
  tipo: MovementType;
}
