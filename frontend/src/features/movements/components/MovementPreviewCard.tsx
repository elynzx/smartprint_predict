import { StatusBadge } from "../../../components/ui/StatusBadge";
import {
  formatNumber,
  formatSupplyCode,
  getSupplyStatus,
} from "../../inventory/services/inventoryService";
import type { SupplyItem } from "../../inventory/types";
import type { MovementType } from "../types";

export interface MovementPreviewCardProps {
  supply: SupplyItem | null;
  movementType: MovementType;
  quantity: number;
  isPositiveQuantity: boolean;
  estimatedStock: number;
  isInvalidSalida: boolean;
}

export function MovementPreviewCard({
  supply,
  movementType,
  quantity,
  isPositiveQuantity,
  estimatedStock,
  isInvalidSalida,
}: MovementPreviewCardProps) {
  if (!supply) {
    return (
      <aside className="movement-preview-column bg-white border border-[#E8EDF5] rounded-[12px]">
        <div className="detail-empty">
          Selecciona un insumo para visualizar el impacto proyectado en tiempo
          real.
        </div>
      </aside>
    );
  }

  const currentStatus = getSupplyStatus(
    supply.stock_actual,
    supply.stock_minimo,
  );
  const projectedStatus = isInvalidSalida
    ? "Crítico"
    : getSupplyStatus(Math.max(0, estimatedStock), supply.stock_minimo);

  const deltaAmount = isPositiveQuantity ? quantity : 0;

  return (
    <aside className="movement-preview-column bg-white border border-[#E8EDF5] rounded-[12px]">
      <div className="detail-card-header">
        <div>
          <span className="detail-code font-mono tabular-nums">
            {formatSupplyCode(supply.id)}
          </span>
          <h2 className="detail-title text-[#17233D]">{supply.nombre}</h2>
          <small className="muted text-[#75819A]">
            {supply.categoria} · Umbral mínimo:{" "}
            <span className="font-mono tabular-nums">
              {formatNumber(supply.stock_minimo)} {supply.unidad}
            </span>
          </small>
        </div>
        <StatusBadge status={currentStatus} />
      </div>

      <div className="preview-flow-card">
        <span className="metric-label">Tendencia de flujo proyectada</span>
        <div className="preview-flow-numbers font-mono tabular-nums">
          <div className="flow-step">
            <small>Stock actual</small>
            <strong className="text-[#17233D]">
              {formatNumber(supply.stock_actual)}
            </strong>
          </div>

          <span
            className={
              isInvalidSalida
                ? "flow-arrow text-[#EF4444]"
                : movementType === "ENTRADA"
                  ? "flow-arrow text-[#10B981]"
                  : "flow-arrow text-[#0F52BA]"
            }
            aria-hidden="true"
          >
            ➔
          </span>

          <div className="flow-step">
            <small>Stock estimado</small>
            <strong
              className={
                isInvalidSalida
                  ? "text-[#EF4444]"
                  : movementType === "ENTRADA"
                    ? "text-[#10B981]"
                    : "text-[#0F52BA]"
              }
            >
              {formatNumber(estimatedStock)}
            </strong>
          </div>
        </div>

        <p className="flow-summary-line font-mono tabular-nums">
          {formatNumber(supply.stock_actual)} ➔ {formatNumber(estimatedStock)}{" "}
          {supply.unidad} ({movementType === "ENTRADA" ? "+" : "-"}
          {formatNumber(deltaAmount)} {supply.unidad})
        </p>
      </div>

      <div
        className={
          isInvalidSalida
            ? "preview-diagnostic-box diagnostic-danger bg-[#FFF0F0] text-[#EF4444] border border-[#FECACA]"
            : "preview-diagnostic-box diagnostic-safe bg-[#E9FBF5] text-[#10B981] border border-[#A7F3D0]"
        }
      >
        <div className="diagnostic-header">
          <strong>
            {isInvalidSalida
              ? "Diagnóstico: Salida Excedida (Bloqueada)"
              : movementType === "ENTRADA"
                ? "Diagnóstico: Abastecimiento Válido"
                : "Diagnóstico: Salida Operativa Segura"}
          </strong>
          <StatusBadge status={projectedStatus} />
        </div>
        <p>
          {isInvalidSalida
            ? "Cantidad ingresada supera el stock disponible en taller. El freno antinegativo impide saldos menores a cero."
            : movementType === "ENTRADA"
              ? `El ingreso incrementará la disponibilidad física a ${formatNumber(estimatedStock)} ${supply.unidad} (${projectedStatus}).`
              : `Despacho factible. Quedarán ${formatNumber(estimatedStock)} ${supply.unidad} disponibles en almacén (${projectedStatus}).`}
        </p>
      </div>
    </aside>
  );
}
