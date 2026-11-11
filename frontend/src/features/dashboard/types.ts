export type PrioritySupplyStatus =
  | "Crítico"
  | "Alerta"
  | "Estable"
  | "Revisión";

export interface PrioritySupplyItem {
  id: number;
  codigo: string;
  nombre: string;
  categoria: string;
  unidad: string;
  stock_actual: number;
  stock_minimo: number;
  estado: PrioritySupplyStatus;
}

export interface RecentDashboardMovement {
  id: number;
  insumo_id: number;
  insumo_nombre: string;
  unidad: string;
  tipo: "ENTRADA" | "SALIDA";
  cantidad: number;
  documento_referencia?: string | null;
  fecha_operacion: string;
  usuario_nombre: string;
}

export interface CategoryDistributionItem {
  categoria: string;
  porcentaje: number;
  color: string;
}

export interface WeeklyTrendPoint {
  week: string;
  realConsumption: number | null;
  projectedConsumption: number;
}

export interface DashboardSummary {
  total_insumos: number;
  stock_critico_count: number;
  alertas_activas_count: number;
  prediccion_semanal_total: number;
  insumos_prioritarios: PrioritySupplyItem[];
  movimientos_recientes: RecentDashboardMovement[];
  distribucion_categorias: CategoryDistributionItem[];
  tendencia_semanal?: WeeklyTrendPoint[];
}
