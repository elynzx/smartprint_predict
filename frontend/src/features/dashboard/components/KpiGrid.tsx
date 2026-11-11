import { formatNumber } from "../../inventory/services/inventoryService";

export interface KpiGridProps {
  totalInsumos: number;
  stockCriticoCount: number;
  alertasActivasCount: number;
  prediccionSemanalTotal: number;
}

export function KpiGrid({
  totalInsumos,
  stockCriticoCount,
  alertasActivasCount,
  prediccionSemanalTotal,
}: KpiGridProps) {
  return (
    <div className="kpi-grid">
      <article className="kpi-card bg-white border border-[#E8EDF5] rounded-[12px]">
        <div className="kpi-card-top">
          <span className="metric-label">Insumos registrados</span>
          <span className="kpi-tag tag-blue">Catálogo activo</span>
        </div>
        <strong className="kpi-value font-mono tabular-nums text-[#17233D]">
          {formatNumber(totalInsumos)}
        </strong>
        <small className="muted text-[#75819A]">
          Materiales habilitados en almacén de planta
        </small>
      </article>

      <article className="kpi-card bg-white border border-[#E8EDF5] rounded-[12px]">
        <div className="kpi-card-top">
          <span className="metric-label">Stock crítico</span>
          <span className="kpi-tag tag-red">Prioridad alta</span>
        </div>
        <strong className="kpi-value font-mono tabular-nums text-[#EF4444]">
          {formatNumber(stockCriticoCount)}
        </strong>
        <small className="muted text-[#75819A]">
          Insumos por debajo del 60% del mínimo
        </small>
      </article>

      <article className="kpi-card bg-white border border-[#E8EDF5] rounded-[12px]">
        <div className="kpi-card-top">
          <span className="metric-label">Alertas activas</span>
          <span className="kpi-tag tag-amber">En seguimiento</span>
        </div>
        <strong className="kpi-value font-mono tabular-nums text-[#F59E0B]">
          {formatNumber(alertasActivasCount)}
        </strong>
        <small className="muted text-[#75819A]">
          Materiales que requieren reposición
        </small>
      </article>

      <article className="kpi-card bg-white border border-[#E8EDF5] rounded-[12px]">
        <div className="kpi-card-top">
          <span className="metric-label">Predicción semanal</span>
          <span className="kpi-tag tag-cyan">Modelo IA</span>
        </div>
        <strong className="kpi-value font-mono tabular-nums text-[#00A4E4]">
          {formatNumber(prediccionSemanalTotal)}{" "}
          <span className="unit-label">und.</span>
        </strong>
        <small className="muted text-[#75819A]">
          Consumo global estimado próximos 7 días
        </small>
      </article>
    </div>
  );
}
