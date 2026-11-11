import { FormEvent } from "react";
import {
  formatNumber,
  formatSupplyCode,
} from "../../inventory/services/inventoryService";
import type { SupplyItem } from "../../inventory/types";
import type { MovementType } from "../types";

export interface MovementFormProps {
  supplies: SupplyItem[];
  selectedSupply: SupplyItem | null;
  movementType: MovementType;
  quantityInput: string;
  reason: string;
  referenceDocument: string;
  supplier: string;
  observations: string;
  isInvalidSalida: boolean;
  isSubmitDisabled: boolean;
  isSubmitting: boolean;
  warningMessage: string;
  errorMessage: string;
  onMovementTypeChange: (type: MovementType) => void;
  onSelectSupply: (supplyId: number) => void;
  onQuantityChange: (value: string) => void;
  onReasonChange: (value: string) => void;
  onReferenceDocumentChange: (value: string) => void;
  onSupplierChange: (value: string) => void;
  onObservationsChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  onReset: () => void;
}

export function MovementForm({
  supplies,
  selectedSupply,
  movementType,
  quantityInput,
  reason,
  referenceDocument,
  supplier,
  observations,
  isInvalidSalida,
  isSubmitDisabled,
  isSubmitting,
  warningMessage,
  errorMessage,
  onMovementTypeChange,
  onSelectSupply,
  onQuantityChange,
  onReasonChange,
  onReferenceDocumentChange,
  onSupplierChange,
  onObservationsChange,
  onSubmit,
  onReset,
}: MovementFormProps) {
  const unitLabel = selectedSupply?.unidad ?? "unidades";

  return (
    <section className="movement-form-column bg-white border border-[#E8EDF5] rounded-[12px]">
      <div
        className="movimiento-tabs"
        role="tablist"
        aria-label="Selector de tipo de movimiento"
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
          onClick={() => onMovementTypeChange("ENTRADA")}
        >
          <span className="status-dot dot-good" />
          Entrada a Almacén (Ingreso)
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
          onClick={() => onMovementTypeChange("SALIDA")}
        >
          <span className="status-dot dot-warning" />
          Salida a Taller (Consumo)
        </button>
      </div>

      <form className="movement-form-body" onSubmit={onSubmit}>
        <div className="modal-row-2">
          <label>
            Insumo de imprenta
            <select
              className="movimiento-select"
              value={selectedSupply?.id ?? ""}
              onChange={(event) => onSelectSupply(Number(event.target.value))}
              required
            >
              {supplies.map((supply) => (
                <option key={supply.id} value={supply.id}>
                  {formatSupplyCode(supply.id)} — {supply.nombre} (Stock:{" "}
                  {formatNumber(supply.stock_actual)} {supply.unidad})
                </option>
              ))}
            </select>
          </label>

          <label>
            Cantidad ({unitLabel})
            <input
              type="number"
              min="0.01"
              step="any"
              placeholder={`Ej. 50 (${unitLabel})`}
              className={
                isInvalidSalida
                  ? "font-mono tabular-nums input-error border-[#EF4444] bg-[#FFF0F0] text-[#EF4444]"
                  : "font-mono tabular-nums"
              }
              value={quantityInput}
              onChange={(event) => onQuantityChange(event.target.value)}
              aria-invalid={isInvalidSalida}
              required
            />
          </label>
        </div>

        {isInvalidSalida && (
          <div
            className="error bg-[#FFF0F0] text-[#EF4444] border border-[#FECACA]"
            role="alert"
          >
            <strong>Freno Antinegativo Activo:</strong> {warningMessage} (Stock
            disponible:{" "}
            <span className="font-mono tabular-nums">
              {formatNumber(selectedSupply?.stock_actual ?? 0)} {unitLabel}
            </span>
            ).
          </div>
        )}

        <div className="modal-row-2">
          <label>
            Documento de referencia ({movementType === "ENTRADA" ? "OC" : "OT"})
            <input
              type="text"
              placeholder={
                movementType === "ENTRADA" ? "Ej. OC-2026-045" : "Ej. OT-4820"
              }
              value={referenceDocument}
              onChange={(event) =>
                onReferenceDocumentChange(event.target.value)
              }
            />
          </label>

          <label>
            Proveedor / Origen-Destino
            <input
              type="text"
              placeholder={
                movementType === "ENTRADA"
                  ? "Ej. Papelera Andina S.A."
                  : "Prensa Offset / Taller de Producción"
              }
              value={
                movementType === "ENTRADA"
                  ? supplier
                  : supplier || "Prensa Offset / Taller de Producción"
              }
              onChange={(event) => onSupplierChange(event.target.value)}
              disabled={movementType === "SALIDA"}
            />
          </label>
        </div>

        <label>
          Motivo operativo
          <input
            type="text"
            placeholder="Ej. Despacho a taller para Orden de Trabajo OT-4820"
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
            required
          />
        </label>

        <label>
          Observaciones
          <input
            type="text"
            placeholder="Ej. Impresión de afiches corporativos / Lote verificado..."
            value={observations}
            onChange={(event) => onObservationsChange(event.target.value)}
          />
        </label>

        {errorMessage && (
          <div
            className="error bg-[#FFF0F0] text-[#EF4444] border border-[#FECACA]"
            role="alert"
          >
            {errorMessage}
          </div>
        )}

        <div className="movement-form-actions">
          <button type="button" className="btn-secondary" onClick={onReset}>
            Limpiar campos
          </button>
          <button
            type="submit"
            className="btn-primary bg-[#0F52BA]"
            disabled={isSubmitDisabled}
          >
            {isSubmitting ? "Registrando en Kardex..." : "Registrar movimiento"}
          </button>
        </div>
      </form>
    </section>
  );
}
