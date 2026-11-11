import { StatusBadge } from "../../../components/ui/StatusBadge";
import {
  formatCurrency,
  formatNumber,
  formatSupplyCode,
  getSupplyStatus,
} from "../services/inventoryService";
import type { SupplyItem } from "../types";

export interface InventoryRowProps {
  supply: SupplyItem;
  isSelected: boolean;
  canEdit: boolean;
  onSelect: (supply: SupplyItem) => void;
  onOpenMovement: (supply: SupplyItem) => void;
  onOpenEdit: (supply: SupplyItem) => void;
}

export function InventoryRow({
  supply,
  isSelected,
  canEdit,
  onSelect,
  onOpenMovement,
  onOpenEdit,
}: InventoryRowProps) {
  const status = getSupplyStatus(supply.stock_actual, supply.stock_minimo);

  return (
    <tr
      className={
        isSelected ? "inventory-row selected bg-[#E9F1FF]" : "inventory-row"
      }
      onClick={() => onSelect(supply)}
    >
      <td className="font-mono tabular-nums code-cell">
        {formatSupplyCode(supply.id)}
      </td>
      <td>
        <strong className="insumo-row-name text-[#17233D]">
          {supply.nombre}
        </strong>
        <small className="insumo-row-meta text-[#75819A]">
          {supply.categoria} · {supply.unidad}
        </small>
      </td>
      <td className="num-col font-mono tabular-nums">
        <strong>{formatNumber(supply.stock_actual)}</strong>{" "}
        <span className="unit-label">{supply.unidad}</span>
      </td>
      <td className="num-col font-mono tabular-nums text-[#75819A]">
        {formatNumber(supply.stock_minimo)}{" "}
        <span className="unit-label">{supply.unidad}</span>
      </td>
      <td className="num-col font-mono tabular-nums">
        {formatCurrency(supply.costo_unitario)}
      </td>
      <td>
        <StatusBadge status={status} />
      </td>
      <td
        className="row-actions-cell"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="row-action-btn"
          onClick={() => onOpenMovement(supply)}
          title="Registrar movimiento de Kardex"
        >
          ⇄ Kardex
        </button>
        {canEdit && (
          <button
            type="button"
            className="row-action-btn"
            onClick={() => onOpenEdit(supply)}
            title="Editar insumo"
          >
            ✎
          </button>
        )}
      </td>
    </tr>
  );
}
