import { formatNumber } from "../../inventory/services/inventoryService";
import type { PredictionHorizon, PredictionResponse } from "../types";

export interface PredictionMetricsProps {
  prediction: PredictionResponse;
  unit: string;
  horizon: PredictionHorizon;
}

export function PredictionMetrics({
  prediction,
  unit,
  horizon,
}: PredictionMetricsProps) {
  const monthlyConsumption = Math.round(prediction.tasa_consumo_diaria * 30);
  const rawEstimated =
    prediction.consumo_estimado ?? prediction.consumo_estimado_30d ?? 0;
  const estimatedConsumption = Math.round(rawEstimated);

  const baselineForHorizon =
    prediction.tasa_consumo_diaria > 0
      ? prediction.tasa_consumo_diaria * horizon * 0.92
      : 0;
  const variationPercentage =
    baselineForHorizon > 0
      ? ((rawEstimated - baselineForHorizon) / baselineForHorizon) * 100
      : 0;

  const coverageDisplay =
    prediction.dias_cobertura !== null
      ? `${prediction.dias_cobertura} días`
      : "Sin consumo";

  return (
    <div className="kpi-grid">
      <article className="kpi-card bg-white border border-[#E8EDF5] rounded-[12px]">
        <div className="kpi-card-top">
          <span className="metric-label">Consumo mensual</span>
          <span className="kpi-tag tag-blue">Base 30d</span>
        </div>
        <strong className="kpi-value font-mono tabular-nums text-[#17233D]">
          {formatNumber(monthlyConsumption)}{" "}
          <span className="unit-label">{unit}</span>
        </strong>
        <small className="muted text-[#75819A]">
          Tasa diaria: {prediction.tasa_consumo_diaria.toFixed(2)} {unit}/día
        </small>
      </article>

      <article className="kpi-card bg-white border border-[#E8EDF5] rounded-[12px]">
        <div className="kpi-card-top">
          <span className="metric-label">Consumo estimado</span>
          <span className="kpi-tag tag-cyan">Horizonte {horizon}d</span>
        </div>
        <strong className="kpi-value font-mono tabular-nums text-[#00A4E4]">
          {formatNumber(estimatedConsumption)}{" "}
          <span className="unit-label">{unit}</span>
        </strong>
        <small className="muted text-[#75819A]">
          Demanda proyectada para los próximos {horizon} días
        </small>
      </article>

      <article className="kpi-card bg-white border border-[#E8EDF5] rounded-[12px]">
        <div className="kpi-card-top">
          <span className="metric-label">Variación prevista %</span>
          <span className="kpi-tag tag-amber">Tendencia</span>
        </div>
        <strong className="kpi-value font-mono tabular-nums text-[#F59E0B]">
          {variationPercentage >= 0 ? "+" : ""}
          {variationPercentage.toFixed(1)}%
        </strong>
        <small className="muted text-[#75819A]">
          Respecto al promedio móvil del bimestre
        </small>
      </article>

      <article className="kpi-card bg-white border border-[#E8EDF5] rounded-[12px]">
        <div className="kpi-card-top">
          <span className="metric-label">Cobertura actual en días</span>
          <span
            className={
              prediction.prioridad === "Alta"
                ? "kpi-tag tag-red"
                : "kpi-tag tag-blue"
            }
          >
            Prioridad {prediction.prioridad}
          </span>
        </div>
        <strong
          className={
            prediction.prioridad === "Alta"
              ? "kpi-value font-mono tabular-nums text-[#EF4444]"
              : "kpi-value font-mono tabular-nums text-[#0F52BA]"
          }
        >
          {coverageDisplay}
        </strong>
        <small className="muted text-[#75819A]">
          Autonomía física antes de quiebre de stock
        </small>
      </article>
    </div>
  );
}
