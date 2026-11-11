import type { AlertFilterOption } from "../types";

export interface AlertFilterBarProps {
  activeFilter: AlertFilterOption;
  totalCount: number;
  criticalCount: number;
  reviewCount: number;
  onSelectFilter: (filter: AlertFilterOption) => void;
}

export function AlertFilterBar({
  activeFilter,
  totalCount,
  criticalCount,
  reviewCount,
  onSelectFilter,
}: AlertFilterBarProps) {
  return (
    <div
      className="alerts-filter-bar"
      role="group"
      aria-label="Filtrar alertas por severidad"
    >
      <button
        type="button"
        className={
          activeFilter === "all" ? "category-pill active" : "category-pill"
        }
        onClick={() => onSelectFilter("all")}
      >
        Todas las alertas ({totalCount})
      </button>

      <button
        type="button"
        className={
          activeFilter === "critico" ? "category-pill active" : "category-pill"
        }
        onClick={() => onSelectFilter("critico")}
      >
        <i className="status-dot dot-critical" /> Críticas (Rojo) (
        {criticalCount})
      </button>

      <button
        type="button"
        className={
          activeFilter === "revision" ? "category-pill active" : "category-pill"
        }
        onClick={() => onSelectFilter("revision")}
      >
        <i className="status-dot dot-warning" /> En Revisión (Ámbar) (
        {reviewCount})
      </button>
    </div>
  );
}
