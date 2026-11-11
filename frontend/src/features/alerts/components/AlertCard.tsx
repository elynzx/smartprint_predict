import { useNavigate } from "react-router-dom";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import {
  formatNumber,
  getReferentialSupplier,
} from "../../inventory/services/inventoryService";
import type { AlertItem } from "../types";

export interface AlertCardProps {
  alert: AlertItem;
}

export function AlertCard({ alert }: AlertCardProps) {
  const navigate = useNavigate();
  const isCritical = alert.estado_alerta === "critico";
  const unitLabel = alert.unidad ?? "und";

  const borderClasses = isCritical
    ? "border-l-4 border-l-[#EF4444] alert-card-critical"
    : "border-l-4 border-l-[#F59E0B] alert-card-review";

  const statusBadgeVariant = isCritical ? "Crítico" : "Revisión";

  const depletionLabel =
    alert.dias_agotamiento !== null
      ? `${alert.dias_agotamiento} días estimados para agotamiento`
      : "Monitoreo preventivo activo";

  function handleGenerateReplenishment() {
    const replenishQty =
      alert.deficit > 0 ? Math.ceil(alert.deficit) : Math.ceil(alert.stock_minimo);
    navigate(
      `/app/movements?insumo_id=${alert.insumo_id}&type=ENTRADA&quantity=${replenishQty}`,
    );
  }

  return (
    <article
      className={`alert-item-card bg-white border border-[#E8EDF5] rounded-[12px] ${borderClasses}`}
    >
      <div className="alert-item-main">
        <div className="alert-item-top">
          <span className="detail-code font-mono tabular-nums">
            {alert.codigo}
          </span>
          <span className="availability-meta-chip">{alert.categoria}</span>
          <StatusBadge status={statusBadgeVariant} />
        </div>

        <h2 className="detail-title text-[#17233D]">{alert.nombre}</h2>

        <p className="alert-deficit-text text-[#17233D]">
          Déficit actual de{" "}
          <strong
            className={
              isCritical
                ? "font-mono tabular-nums text-[#EF4444]"
                : "font-mono tabular-nums text-[#F59E0B]"
            }
          >
            {formatNumber(alert.deficit)} {unitLabel}
          </strong>{" "}
          frente al mínimo de{" "}
          <strong className="font-mono tabular-nums">
            {formatNumber(alert.stock_minimo)} {unitLabel}
          </strong>{" "}
          (Stock en almacén:{" "}
          <span className="font-mono tabular-nums">
            {formatNumber(alert.stock_actual)} {unitLabel}
          </span>
          ).
        </p>

        <div className="alert-meta-row">
          <span className="alert-depletion-chip font-mono tabular-nums">
            ⏱ {depletionLabel}
          </span>
          <span className="muted text-[#75819A]">
            Proveedor sugerido: {getReferentialSupplier(alert.categoria)}
          </span>
        </div>
      </div>

      <div className="alert-item-actions">
        <button
          type="button"
          className="btn-primary bg-[#0F52BA]"
          onClick={handleGenerateReplenishment}
        >
          Generar Reposición
        </button>
      </div>
    </article>
  );
}
