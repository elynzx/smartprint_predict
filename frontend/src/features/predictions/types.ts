import type { SupplyStatus } from "../inventory/types";

export type PredictionHorizon = 30 | 60 | 90;

export type PredictionPriority = "Alta" | "Media" | "Baja";

export interface PredictionErrorMetrics {
  mae: number;
  rmse: number;
}

export interface PredictionChartDataPoint {
  label: string;
  historico: number | null;
  estimacion: number | null;
}

export interface PredictionResponse {
  insumo_id: number;
  nombre: string;
  tasa_consumo_diaria: number;
  dias_cobertura: number | null;
  consumo_estimado: number;
  consumo_estimado_30d: number;
  prioridad: PredictionPriority;
  estado_fisico: SupplyStatus;
  metricas_error: PredictionErrorMetrics;
  observacion?: string | null;
  historico_chart_data: PredictionChartDataPoint[];
  estimacion_chart_data: PredictionChartDataPoint[];
}

export type SupplyPrediction = PredictionResponse;
