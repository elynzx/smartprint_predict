import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import {
  formatCurrency,
  formatNumber,
  formatSupplyCode,
  getReferentialSupplier,
  getSupplyStatus,
} from "../services/inventoryService";
import type { SupplyItem, SupplyStatus } from "../types";
import { InventoryRow } from "./InventoryRow";

export interface InventoryTableProps {
  supplies: SupplyItem[];
  selectedSupply: SupplyItem | null;
  categories: string[];
  searchQuery: string;
  categoryFilter: string;
  isLoading: boolean;
  canEdit: boolean;
  onSearchChange: (query: string) => void;
  onCategoryChange: (category: string) => void;
  onSelectSupply: (supply: SupplyItem) => void;
  onOpenEdit: (supply: SupplyItem) => void;
  onOpenMovement: (supply: SupplyItem) => void;
}

function getProgressBarClass(status: SupplyStatus): string {
  if (status === "Crítico") return "progress-fill fill-critical bg-[#EF4444]";
  if (status === "En Riesgo") return "progress-fill fill-warning bg-[#F59E0B]";
  return "progress-fill fill-good bg-[#10B981]";
}

export function InventoryTable({
  supplies,
  selectedSupply,
  categories,
  searchQuery,
  categoryFilter,
  isLoading,
  canEdit,
  onSearchChange,
  onCategoryChange,
  onSelectSupply,
  onOpenEdit,
  onOpenMovement,
}: InventoryTableProps) {
  const detailStatus = selectedSupply
    ? getSupplyStatus(selectedSupply.stock_actual, selectedSupply.stock_minimo)
    : null;

  const availabilityPercentage = selectedSupply
    ? selectedSupply.stock_minimo > 0
      ? Math.round(
          (selectedSupply.stock_actual / selectedSupply.stock_minimo) * 100,
        )
      : 100
    : 0;

  const progressBarWidth = Math.max(0, Math.min(100, availabilityPercentage));
  const stockDeficit =
    selectedSupply && selectedSupply.stock_actual < selectedSupply.stock_minimo
      ? Math.max(0, selectedSupply.stock_minimo - selectedSupply.stock_actual)
      : 0;

  return (
    <>
      <div className="inventory-filters">
        <div className="inventory-search-wrapper">
          <input
            type="search"
            className="availability-search-input"
            placeholder="Filtrar por código, nombre o categoría..."
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            aria-label="Filtrar insumos"
          />
        </div>
        <div className="inventory-category-pills">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={
                categoryFilter === category
                  ? "category-pill active"
                  : "category-pill"
              }
              onClick={() => onCategoryChange(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="inventory-layout grid grid-cols-4 gap-6">
        <div className="inventory-table-panel col-span-3 bg-white border border-[#E8EDF5] rounded-[12px]">
          {isLoading ? (
            <LoadingSpinner label="Cargando catálogo de insumos..." />
          ) : supplies.length === 0 ? (
            <div className="availability-empty">
              No se encontraron insumos con los criterios seleccionados.
            </div>
          ) : (
            <div className="table-scroll">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Insumo / Categoría</th>
                    <th className="num-col">Stock Actual</th>
                    <th className="num-col">Stock Mínimo</th>
                    <th className="num-col">Costo Unit.</th>
                    <th>Estado</th>
                    <th className="num-col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {supplies.map((supply) => (
                    <InventoryRow
                      key={supply.id}
                      supply={supply}
                      isSelected={selectedSupply?.id === supply.id}
                      canEdit={canEdit}
                      onSelect={onSelectSupply}
                      onOpenMovement={onOpenMovement}
                      onOpenEdit={onOpenEdit}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside className="inventory-detail-card col-span-1 bg-white border border-[#E8EDF5] rounded-[12px]">
          {selectedSupply && detailStatus ? (
            <>
              <div className="detail-card-header">
                <div>
                  <span className="detail-code font-mono tabular-nums">
                    {formatSupplyCode(selectedSupply.id)}
                  </span>
                  <h2 className="detail-title text-[#17233D]">
                    {selectedSupply.nombre}
                  </h2>
                </div>
                <StatusBadge status={detailStatus} />
              </div>

              <div className="detail-meta-list">
                <div className="detail-meta-row">
                  <span>Categoría</span>
                  <strong>{selectedSupply.categoria}</strong>
                </div>
                <div className="detail-meta-row">
                  <span>Proveedor referencial</span>
                  <strong>
                    {selectedSupply.proveedor ??
                      selectedSupply.proveedor_referencial ??
                      getReferentialSupplier(selectedSupply.categoria)}
                  </strong>
                </div>
                <div className="detail-meta-row">
                  <span>Unidad de medida</span>
                  <strong>{selectedSupply.unidad}</strong>
                </div>
                <div className="detail-meta-row">
                  <span>Costo unitario</span>
                  <strong className="font-mono tabular-nums">
                    {formatCurrency(selectedSupply.costo_unitario)}
                  </strong>
                </div>
              </div>

              <div className="detail-stock-box">
                <div className="detail-stock-metrics">
                  <div>
                    <span className="metric-label">Stock actual</span>
                    <strong className="metric-value font-mono tabular-nums text-[#17233D]">
                      {formatNumber(selectedSupply.stock_actual)}{" "}
                      <small>{selectedSupply.unidad}</small>
                    </strong>
                  </div>
                  <div>
                    <span className="metric-label">Stock mínimo</span>
                    <strong className="metric-value font-mono tabular-nums text-[#75819A]">
                      {formatNumber(selectedSupply.stock_minimo)}{" "}
                      <small>{selectedSupply.unidad}</small>
                    </strong>
                  </div>
                </div>

                <div className="detail-progress-section">
                  <div className="detail-progress-labels">
                    <span>Nivel frente al mínimo</span>
                    <strong className="font-mono tabular-nums">
                      {availabilityPercentage}%
                    </strong>
                  </div>
                  <div
                    className="progress-track"
                    role="progressbar"
                    aria-valuenow={availabilityPercentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className={getProgressBarClass(detailStatus)}
                      style={{ width: `${progressBarWidth}%` }}
                    />
                  </div>
                </div>

                {stockDeficit > 0 && (
                  <div
                    className={
                      detailStatus === "Crítico"
                        ? "detail-warning-box critical-box bg-[#FFF0F0] text-[#EF4444]"
                        : "detail-warning-box warning-box bg-[#FFF8E7] text-[#F59E0B]"
                    }
                  >
                    <strong>Atención de reposición:</strong>{" "}
                    <span className="font-mono tabular-nums">
                      {formatNumber(stockDeficit)} {selectedSupply.unidad}
                    </span>{" "}
                    por debajo del mínimo
                  </div>
                )}
              </div>

              <div className="detail-card-actions">
                <button
                  type="button"
                  className="btn-secondary w-full"
                  onClick={() => onOpenMovement(selectedSupply)}
                >
                  ⇄ Registrar movimiento
                </button>
                {canEdit && (
                  <button
                    type="button"
                    className="btn-outline-primary"
                    onClick={() => onOpenEdit(selectedSupply)}
                  >
                    Editar insumo
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="detail-empty">
              Selecciona un insumo de la tabla para inspeccionar su estado y
              métricas de cobertura física.
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
