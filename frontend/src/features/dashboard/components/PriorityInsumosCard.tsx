import { Link } from "react-router-dom";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { formatNumber } from "../../inventory/services/inventoryService";
import type { PrioritySupplyItem, PrioritySupplyStatus } from "../types";

export interface PriorityInsumosCardProps {
  items: PrioritySupplyItem[];
}

const FILTER_TABS: Array<"Todos" | PrioritySupplyStatus> = [
  "Todos",
  "Crítico",
  "Alerta",
  "Revisión",
  "Estable",
];

import { useState } from "react";

export function PriorityInsumosCard({ items }: PriorityInsumosCardProps) {
  const [statusFilter, setStatusFilter] = useState<
    "Todos" | PrioritySupplyStatus
  >("Todos");

  const filteredItems =
    statusFilter === "Todos"
      ? items
      : items.filter((item) => item.estado === statusFilter);

  return (
    <section className="dashboard-priority-card bg-white border border-[#E8EDF5] rounded-[12px]">
      <div className="dashboard-card-header">
        <div>
          <h2 className="detail-title text-[#17233D]">
            Insumos Prioritarios por Estado
          </h2>
          <small className="muted text-[#75819A]">
            Clasificación operativa según cobertura frente al stock mínimo.
          </small>
        </div>

        <Link to="/app/inventory" className="btn-secondary link-btn">
          Ver catálogo →
        </Link>
      </div>

      <div className="inventory-category-pills priority-filter-bar">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={
              statusFilter === tab ? "category-pill active" : "category-pill"
            }
            onClick={() => setStatusFilter(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <div className="availability-empty">
          No existen insumos en el estado "{statusFilter}".
        </div>
      ) : (
        <div className="priority-list">
          {filteredItems.map((item) => {
            const coveragePercent =
              item.stock_minimo > 0
                ? Math.min(
                    100,
                    Math.round((item.stock_actual / item.stock_minimo) * 100),
                  )
                : 100;

            return (
              <div key={item.id} className="priority-item-row">
                <div className="priority-item-info">
                  <div className="priority-item-title-line">
                    <span className="detail-code font-mono tabular-nums">
                      {item.codigo}
                    </span>
                    <strong className="text-[#17233D]">{item.nombre}</strong>
                  </div>
                  <small className="muted text-[#75819A]">
                    {item.categoria} · Stock:{" "}
                    <span className="font-mono tabular-nums text-[#17233D]">
                      {formatNumber(item.stock_actual)} /{" "}
                      {formatNumber(item.stock_minimo)} {item.unidad}
                    </span>{" "}
                    ({coveragePercent}%)
                  </small>
                </div>

                <div className="priority-item-actions">
                  <StatusBadge status={item.estado} />
                  <Link
                    to={`/app/movements?insumo_id=${item.id}`}
                    className="row-action-btn link-btn"
                  >
                    ⇄ Kardex
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
