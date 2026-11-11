import { Modal } from "../../../components/ui/Modal";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { useKardexMovement } from "../hooks/useKardexMovement";
import {
  formatNumber,
  formatSupplyCode,
  getSupplyStatus,
} from "../services/inventoryService";
import type { MovementType, SupplyItem } from "../types";

export interface MovementModalProps {
  isOpen: boolean;
  supply: SupplyItem | null;
  supplies?: SupplyItem[];
  onSelectSupply?: (supply: SupplyItem) => void;
  onClose: () => void;
  onMovementCreated: (
    movementType: MovementType,
    supplyName: string,
  ) => Promise<void> | void;
}

export function MovementModal({
  isOpen,
  supply,
  supplies = [],
  onSelectSupply,
  onClose,
  onMovementCreated,
}: MovementModalProps) {
  const {
    movementType,
    quantityInput,
    parsedQuantity,
    reason,
    referenceDocument,
    supplier,
    notes,
    availableStock,
    projectedStock,
    exceedsAvailableStock,
    isSubmitDisabled,
    isSubmitting,
    error,
    setMovementType,
    setQuantityInput,
    setReason,
    setReferenceDocument,
    setSupplier,
    setNotes,
    submitMovement,
  } = useKardexMovement({
    supply,
    onSuccess: async (type, name) => {
      await onMovementCreated(type, name);
      onClose();
    },
  });

  if (!supply) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Movimiento de Kardex (${formatSupplyCode(supply.id)})`}
    >
      <div
        className="movimiento-tabs"
        role="tablist"
        aria-label="Tipo de movimiento"
      >
        <button
          type="button"
          role="tab"
          aria-selected={movementType === "ENTRADA"}
          className={
            movementType === "ENTRADA"
              ? "movimiento-tab active-entrada"
              : "movimiento-tab"
          }
          onClick={() => setMovementType("ENTRADA")}
        >
          <span className="status-dot dot-good" /> Entrada
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={movementType === "SALIDA"}
          className={
            movementType === "SALIDA"
              ? "movimiento-tab active-salida"
              : "movimiento-tab"
          }
          onClick={() => setMovementType("SALIDA")}
        >
          <span className="status-dot dot-warning" /> Salida
        </button>
      </div>

      <form onSubmit={submitMovement}>
        {supplies.length > 1 && onSelectSupply ? (
          <label>
            Insumo seleccionado
            <select
              className="movimiento-select"
              value={supply.id}
              onChange={(event) => {
                const chosen = supplies.find(
                  (item) => item.id === Number(event.target.value),
                );
                if (chosen) onSelectSupply(chosen);
              }}
            >
              {supplies.map((item) => (
                <option key={item.id} value={item.id}>
                  {formatSupplyCode(item.id)} — {item.nombre} (
                  {formatNumber(item.stock_actual)} {item.unidad})
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="selected-supply-summary">
            <strong>{supply.nombre}</strong>
            <span>
              {supply.categoria} · {supply.unidad}
            </span>
          </div>
        )}

        <div className="movimiento-stock-banner">
          <div>
            <span className="metric-label">Stock disponible</span>
            <strong className="font-mono tabular-nums text-[#17233D]">
              {formatNumber(availableStock)} <small>{supply.unidad}</small>
            </strong>
          </div>
          <div>
            <span className="metric-label">Saldo proyectado</span>
            <strong
              className={
                exceedsAvailableStock
                  ? "font-mono tabular-nums text-[#EF4444]"
                  : "font-mono tabular-nums text-[#0F52BA]"
              }
            >
              {exceedsAvailableStock
                ? "Inválido (< 0)"
                : `${formatNumber(projectedStock)} ${supply.unidad}`}
            </strong>
          </div>
          <StatusBadge
            status={getSupplyStatus(supply.stock_actual, supply.stock_minimo)}
          />
        </div>

        <label>
          Cantidad ({supply.unidad})
          <input
            type="number"
            min="0.01"
            step="any"
            placeholder={`Ingrese cantidad en ${supply.unidad}`}
            className={
              exceedsAvailableStock
                ? "font-mono tabular-nums input-error border-[#EF4444] bg-[#FFF0F0] text-[#EF4444]"
                : "font-mono tabular-nums"
            }
            value={quantityInput}
            onChange={(event) => setQuantityInput(event.target.value)}
            aria-invalid={exceedsAvailableStock}
            required
          />
        </label>

        {exceedsAvailableStock && (
          <div
            className="error bg-[#FFF0F0] text-[#EF4444] border border-[#FECACA]"
            role="alert"
          >
            <strong>Freno antinegativo:</strong> La cantidad digitada (
            <span className="font-mono tabular-nums">
              {formatNumber(parsedQuantity)} {supply.unidad}
            </span>
            ) supera el stock disponible (
            <span className="font-mono tabular-nums">
              {formatNumber(availableStock)} {supply.unidad}
            </span>
            ).
          </div>
        )}

        <div className="modal-row-2">
          <label>
            Documento de referencia
            <input
              type="text"
              placeholder={
                movementType === "SALIDA" ? "Ej. OT-4820" : "Ej. OC-2026-045"
              }
              value={referenceDocument}
              onChange={(event) => setReferenceDocument(event.target.value)}
            />
          </label>
          {movementType === "ENTRADA" ? (
            <label>
              Proveedor
              <input
                type="text"
                placeholder="Ej. Papelera Andina S.A."
                value={supplier}
                onChange={(event) => setSupplier(event.target.value)}
              />
            </label>
          ) : (
            <label>
              Destino operativo
              <input type="text" value="Taller de Prensa Offset" disabled />
            </label>
          )}
        </div>

        <label>
          Motivo del movimiento
          <input
            type="text"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            required
          />
        </label>

        <label>
          Observaciones
          <input
            type="text"
            placeholder="Notas opcionales del turno..."
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>

        {error && <div className="error">{error}</div>}

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-primary bg-[#0F52BA]"
            disabled={isSubmitDisabled}
          >
            {isSubmitting ? "Registrando..." : "Registrar movimiento"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
