import { StatusBadge } from "../../../components/ui/StatusBadge";
import {
  formatNumber,
  formatSupplyCode,
} from "../../inventory/services/inventoryService";
import type { SupplyItem } from "../../inventory/types";
import { buildManagerialRecommendation } from "../services/predictionService";
import type { PredictionHorizon, SupplyPrediction } from "../types";

export interface PredictionCardProps {
  supply: SupplyItem;
  prediction: SupplyPrediction;
  horizon: PredictionHorizon;
}

export function PredictionCard({
  supply,
  prediction,
  horizon,
}: PredictionCardProps) {
  const recommendation = buildManagerialRecommendation(
    prediction,
    supply.unidad,
    horizon,
  );

  const coverageDisplay =
    prediction.dias_cobertura !== null
      ? `${prediction.dias_cobertura} días`
      : "Sin consumo";

  return (
    <article className="prediction-card bg-white border border-[#E8EDF5] rounded-[12px]">
      <div className="prediction-card-header">
        <div>
          <span className="detail-code font-mono tabular-nums">
            {formatSupplyCode(prediction.insumo_id)}
          </span>
          <h2 className="detail-title text-[#17233D]">{prediction.nombre}</h2>
          <small className="muted text-[#75819A]">
            {supply.categoria} · Stock actual:{" "}
            <strong className="font-mono tabular-nums text-[#17233D]">
              {formatNumber(supply.stock_actual)} {supply.unidad}
            </strong>
          </small>
        </div>

        <div className="prediction-badges">
          <StatusBadge status={prediction.prioridad} />
          <StatusBadge status={prediction.estado_fisico} />
        </div>
      </div>

      <div className="prediction-metrics-grid">
        <div className="prediction-metric-box">
          <span className="metric-label">Tasa de consumo diaria</span>
          <strong className="metric-value font-mono tabular-nums text-[#17233D]">
            {prediction.tasa_consumo_diaria > 0
              ? `${prediction.tasa_consumo_diaria.toFixed(2)} ${supply.unidad}/día`
              : "Sin consumo"}
          </strong>
        </div>

        <div className="prediction-metric-box">
          <span className="metric-label">Cobertura estimada IA</span>
          <strong className="metric-value font-mono tabular-nums text-[#0F52BA]">
            {coverageDisplay}
          </strong>
        </div>

        <div className="prediction-metric-box">
          <span className="metric-label">Consumo proyectado ({horizon}d)</span>
          <strong className="metric-value font-mono tabular-nums text-[#00A4E4]">
            {formatNumber(
              prediction.consumo_estimado ??
                prediction.consumo_estimado_30d ??
                0,
            )}{" "}
            <small>{supply.unidad}</small>
          </strong>
        </div>

        <div className="prediction-metric-box">
          <span className="metric-label">Error del modelo (MAE / RMSE)</span>
          <strong className="metric-value font-mono tabular-nums text-[#75819A]">
            {prediction.metricas_error.mae.toFixed(2)} /{" "}
            {prediction.metricas_error.rmse.toFixed(2)}
          </strong>
        </div>
      </div>

      <div className="prediction-chart-box">
        <div className="prediction-chart-legend">
          <span>
            <i className="chart-line-real" /> Curva real histórica (Azul Real)
          </span>
          <span>
            <i className="chart-line-forecast" /> Proyección Regresión Lineal
            (Cian)
          </span>
        </div>
        <svg
          className="prediction-svg"
          viewBox="0 0 420 92"
          role="img"
          aria-label={`Proyección de consumo para ${prediction.nombre}`}
        >
          <line
            x1="12"
            y1="78"
            x2="408"
            y2="78"
            stroke="#E8EDF5"
            strokeWidth="1"
          />
          <polyline
            fill="none"
            stroke="#0F52BA"
            strokeWidth="2.6"
            points="16,72 80,62 144,51 208,39 250,31"
          />
          <polyline
            fill="none"
            stroke="#00A4E4"
            strokeWidth="2.6"
            strokeDasharray="6 4"
            points="250,31 328,19 404,10"
          />
          <circle cx="250" cy="31" r="4" fill="#0F52BA" />
          <circle cx="404" cy="10" r="4" fill="#00A4E4" />
        </svg>
      </div>

      <div
        className={
          prediction.prioridad === "Alta"
            ? "availability-note note-critical"
            : prediction.prioridad === "Media"
              ? "availability-note note-warning"
              : "availability-note note-good"
        }
      >
        <span className="availability-note-label">
          Recomendación gerencial (Prioridad {prediction.prioridad})
        </span>
        <p>{recommendation}</p>
      </div>
    </article>
  );
}
