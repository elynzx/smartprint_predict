import { Link } from "react-router-dom";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import {
  formatNumber,
  formatSupplyCode,
} from "../inventory/services/inventoryService";
import { PredictionAiCard } from "./components/PredictionAiCard";
import { PredictionChart } from "./components/PredictionChart";
import { PredictionMetrics } from "./components/PredictionMetrics";
import {
  INSUFFICIENT_CONSUMPTION_MESSAGE,
  usePredictions,
} from "./hooks/usePredictions";
import type { PredictionHorizon } from "./types";

const HORIZON_OPTIONS: PredictionHorizon[] = [30, 60, 90];

export function PredictionsPage() {
  const {
    supplies,
    selectedSupply,
    horizon,
    prediction,
    loading,
    error,
    hasInsufficientData,
    toastMessage,
    setSelectedSupplyId,
    setHorizon,
    notifyToast,
  } = usePredictions();

  return (
    <div className="inventory-view">
      {toastMessage && (
        <div className="toast-notification" role="status" aria-live="polite">
          <span className="toast-dot" />
          <span>{toastMessage}</span>
        </div>
      )}

      <header className="inventory-header">
        <div>
          <span className="availability-eyebrow">
            MOTOR PREDICTIVO SCIKIT-LEARN
          </span>
          <h1 className="text-[#17233D]">Predicción de Consumo IA</h1>
          <p className="muted text-[#75819A]">
            Proyección de demanda mediante Regresión Lineal, estimación de
            cobertura y diagnóstico de reposición para compras.
          </p>
        </div>

        <div className="prediction-controls-bar">
          <select
            className="movimiento-select prediction-supply-select"
            value={selectedSupply?.id ?? ""}
            onChange={(event) =>
              setSelectedSupplyId(Number(event.target.value))
            }
            aria-label="Seleccionar insumo a proyectar"
          >
            {supplies.map((supply) => (
              <option key={supply.id} value={supply.id}>
                {formatSupplyCode(supply.id)} — {supply.nombre} (
                {formatNumber(supply.stock_actual)} {supply.unidad})
              </option>
            ))}
          </select>

          <div
            className="inventory-category-pills"
            role="group"
            aria-label="Horizonte de proyección"
          >
            {HORIZON_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                className={
                  horizon === option ? "category-pill active" : "category-pill"
                }
                onClick={() => setHorizon(option)}
              >
                {option} días
              </button>
            ))}
          </div>
        </div>
      </header>

      {loading ? (
        <LoadingSpinner label="Ejecutando modelo de Regresión Lineal y calculando cobertura..." />
      ) : hasInsufficientData || !selectedSupply || !prediction ? (
        <section
          className="prediction-insufficient-card bg-[#FFF8E7] border border-[#FDE68A] rounded-[12px]"
          role="status"
        >
          <div className="insufficient-card-badge bg-[#E9F1FF] text-[#0F52BA]">
            DIAGNÓSTICO DE ENTRENAMIENTO ML
          </div>
          <h2 className="detail-title text-[#17233D]">
            {selectedSupply
              ? `${selectedSupply.nombre} (${formatSupplyCode(selectedSupply.id)})`
              : "Insumo sin historial de salidas"}
          </h2>
          <p className="insufficient-card-text text-[#17233D]">
            {INSUFFICIENT_CONSUMPTION_MESSAGE}
          </p>
          {error && error !== INSUFFICIENT_CONSUMPTION_MESSAGE && (
            <small className="muted text-[#75819A]">
              Respuesta del servidor: {error}
            </small>
          )}
          {selectedSupply && (
            <div className="insufficient-card-actions">
              <Link
                to={`/app/movements?insumo_id=${selectedSupply.id}`}
                className="btn-primary bg-[#0F52BA] link-btn"
              >
                Registrar salidas en almacén →
              </Link>
            </div>
          )}
        </section>
      ) : (
        <>
          <PredictionMetrics
            prediction={prediction}
            unit={selectedSupply.unidad}
            horizon={horizon}
          />

          <div className="prediction-workspace-grid">
            <PredictionChart
              prediction={prediction}
              unit={selectedSupply.unidad}
              horizon={horizon}
              error={error}
            />

            <PredictionAiCard
              supply={selectedSupply}
              prediction={prediction}
              horizon={horizon}
              onCreatePurchaseOrder={(supply, suggestedQty) => {
                notifyToast(
                  `Orden de compra sugerida para "${supply.nombre}" (${suggestedQty} ${supply.unidad}).`,
                );
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
