import { useNavigate } from "react-router-dom";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import {
  formatNumber,
  getReferentialSupplier,
} from "../../inventory/services/inventoryService";
import type { SupplyItem } from "../../inventory/types";
import { buildManagerialRecommendation } from "../services/predictionService";
import type { PredictionHorizon, PredictionResponse } from "../types";

export interface PredictionAiCardProps {
  supply: SupplyItem;
  prediction: PredictionResponse;
  horizon: PredictionHorizon;
  onCreatePurchaseOrder: (supply: SupplyItem, suggestedQty: number) => void;
}

export function PredictionAiCard({
  supply,
  prediction,
  horizon,
  onCreatePurchaseOrder,
}: PredictionAiCardProps) {
  const navigate = useNavigate();

  const projectedDemand = Math.round(
    prediction.consumo_estimado ?? prediction.consumo_estimado_30d ?? 0,
  );
  const availableStock = supply.stock_actual;
  const rawDifference = availableStock - projectedDemand;
  const deficitAmount = Math.max(0, projectedDemand - availableStock);
  const hasDeficit = rawDifference < 0;

  const suggestedOrderQty =
    deficitAmount > 0
      ? Math.round(deficitAmount + supply.stock_minimo * 0.5)
      : Math.round(supply.stock_minimo);

  const recommendationText = buildManagerialRecommendation(
    prediction,
    supply.unidad,
    horizon,
  );

  return (
    <aside className="prediction-ai-card bg-white border border-[#E8EDF5] rounded-[12px]">
      <div className="ai-card-header">
        <div>
          <span className="ai-badge-pill">
            <i className="status-dot dot-good" /> SMARTPRINT AI
          </span>
          <h2 className="detail-title text-[#17233D]">
            Diagnóstico Inteligente
          </h2>
        </div>
        <StatusBadge status={prediction.prioridad} />
      </div>

      <div className="ai-metrics-stack">
        <div className="ai-metric-row">
          <span>Demanda proyectada ({horizon}d)</span>
          <strong className="font-mono tabular-nums text-[#17233D]">
            {formatNumber(projectedDemand)} {supply.unidad}
          </strong>
        </div>

        <div className="ai-metric-row">
          <span>Stock disponible actual</span>
          <strong className="font-mono tabular-nums text-[#17233D]">
            {formatNumber(availableStock)} {supply.unidad}
          </strong>
        </div>

        <div className="ai-metric-row ai-deficit-row">
          <span>Déficit estimado</span>
          <strong
            className={
              hasDeficit
                ? "font-mono tabular-nums text-[#EF4444]"
                : "font-mono tabular-nums text-[#10B981]"
            }
          >
            {hasDeficit
              ? `-${formatNumber(deficitAmount)} ${supply.unidad}`
              : `0 ${supply.unidad} (Cubierto)`}
          </strong>
        </div>

        <div className="ai-metric-row">
          <span>Proveedor sugerido</span>
          <strong>{getReferentialSupplier(supply.categoria)}</strong>
        </div>
      </div>

      <div
        className={
          prediction.prioridad === "Alta" || hasDeficit
            ? "availability-note note-critical"
            : prediction.prioridad === "Media"
              ? "availability-note note-warning"
              : "availability-note note-good"
        }
      >
        <span className="availability-note-label">Acción recomendada</span>
        <p>{recommendationText}</p>
      </div>

      <div className="ai-card-actions">
        <button
          type="button"
          className="btn-primary w-full bg-[#0F52BA]"
          onClick={() => {
            onCreatePurchaseOrder(supply, suggestedOrderQty);
            navigate(`/app/movements?insumo_id=${supply.id}`);
          }}
        >
          Crear orden de compra ({formatNumber(suggestedOrderQty)}{" "}
          {supply.unidad})
        </button>
      </div>
    </aside>
  );
}
