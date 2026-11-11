export type AlertSeverity = "critico" | "revision";

export type AlertFilterOption = "all" | "critico" | "revision";

export interface AlertItem {
  id?: number;
  insumo_id: number;
  nombre: string;
  codigo: string;
  categoria: string;
  unidad?: string;
  stock_actual: number;
  stock_minimo: number;
  deficit: number;
  dias_agotamiento: number | null;
  estado_alerta: AlertSeverity;
  prioridad?: string;
}

export interface IncidentTimelineItem {
  id: string;
  timeLabel: string;
  title: string;
  detail: string;
  severity: AlertSeverity | "info";
  supplyCode?: string;
}
