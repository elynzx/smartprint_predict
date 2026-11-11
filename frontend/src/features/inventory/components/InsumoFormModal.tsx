import { FormEvent, useEffect, useState } from "react";
import { Modal } from "../../../components/ui/Modal";
import { useAuth } from "../../auth/hooks/useAuth";
import {
  createSupply,
  formatSupplyCode,
  getReferentialSupplier,
  updateSupply,
} from "../services/inventoryService";
import type { CreateSupplyPayload, SupplyItem } from "../types";

export const SUPPLY_CATEGORIES = [
  "Papel",
  "Tintas",
  "Planchas",
  "Químicos",
  "Otros",
] as const;

export const SUPPLY_UNITS = [
  "resmas",
  "litros",
  "unidades",
  "pliegos",
  "kg",
] as const;

export interface InsumoFormModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  supply: SupplyItem | null;
  onClose: () => void;
  onSaved: (saved: SupplyItem, mode: "create" | "edit") => Promise<void> | void;
}

const DEFAULT_FORM_STATE: CreateSupplyPayload = {
  nombre: "",
  categoria: "Papel",
  unidad: "resmas",
  stock_actual: 0,
  stock_minimo: 100,
  costo_unitario: 50,
  proveedor: "Papelera Andina S.A.",
  proveedor_referencial: "Papelera Andina S.A.",
};

export function InsumoFormModal({
  isOpen,
  mode,
  supply,
  onClose,
  onSaved,
}: InsumoFormModalProps) {
  const { token } = useAuth();
  const [formState, setFormState] =
    useState<CreateSupplyPayload>(DEFAULT_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    if (mode === "edit" && supply) {
      const currentSupplier =
        supply.proveedor ||
        supply.proveedor_referencial ||
        getReferentialSupplier(supply.categoria);
      setFormState({
        nombre: supply.nombre,
        categoria: supply.categoria || "Papel",
        unidad: supply.unidad || "resmas",
        stock_actual: supply.stock_actual,
        stock_minimo: supply.stock_minimo,
        costo_unitario: supply.costo_unitario,
        proveedor: currentSupplier,
        proveedor_referencial: currentSupplier,
      });
    } else {
      setFormState(DEFAULT_FORM_STATE);
    }
  }, [isOpen, mode, supply]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;

    setError("");
    setIsSubmitting(true);

    const trimmedSupplier =
      (formState.proveedor ?? formState.proveedor_referencial ?? "").trim() ||
      getReferentialSupplier(formState.categoria);

    try {
      if (mode === "edit" && supply) {
        const updated = await updateSupply(token, supply.id, {
          nombre: formState.nombre.trim(),
          categoria: formState.categoria.trim(),
          unidad: formState.unidad.trim(),
          stock_minimo: Number(formState.stock_minimo),
          costo_unitario: Number(formState.costo_unitario),
          proveedor: trimmedSupplier,
          proveedor_referencial: trimmedSupplier,
        });
        await onSaved(updated, "edit");
      } else {
        const created = await createSupply(token, {
          nombre: formState.nombre.trim(),
          categoria: formState.categoria.trim(),
          unidad: formState.unidad.trim(),
          stock_actual: Number(formState.stock_actual),
          stock_minimo: Number(formState.stock_minimo),
          costo_unitario: Number(formState.costo_unitario),
          proveedor: trimmedSupplier,
          proveedor_referencial: trimmedSupplier,
        });
        await onSaved(created, "create");
      }
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo guardar la información del insumo.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const modalTitle =
    mode === "edit" && supply
      ? `Editar insumo (${formatSupplyCode(supply.id)})`
      : "Nuevo insumo";

  const categoryOptions = Array.from(
    new Set([
      ...SUPPLY_CATEGORIES,
      ...(formState.categoria ? [formState.categoria] : []),
    ]),
  );

  const unitOptions = Array.from(
    new Set([...SUPPLY_UNITS, ...(formState.unidad ? [formState.unidad] : [])]),
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
      <form onSubmit={handleSubmit}>
        <label>
          Nombre del insumo
          <input
            type="text"
            placeholder="Ej. Papel couché 150g - A3"
            value={formState.nombre}
            onChange={(event) =>
              setFormState({ ...formState, nombre: event.target.value })
            }
            required
          />
        </label>

        <div className="modal-row-2">
          <label>
            Categoría
            <select
              className="movimiento-select"
              value={formState.categoria}
              onChange={(event) => {
                const nextCategory = event.target.value;
                setFormState((prev) => ({
                  ...prev,
                  categoria: nextCategory,
                  proveedor:
                    !prev.proveedor ||
                    prev.proveedor === getReferentialSupplier(prev.categoria)
                      ? getReferentialSupplier(nextCategory)
                      : prev.proveedor,
                  proveedor_referencial:
                    !prev.proveedor_referencial ||
                    prev.proveedor_referencial ===
                      getReferentialSupplier(prev.categoria)
                      ? getReferentialSupplier(nextCategory)
                      : prev.proveedor_referencial,
                }));
              }}
              required
            >
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label>
            Unidad de medida
            <select
              className="movimiento-select"
              value={formState.unidad}
              onChange={(event) =>
                setFormState({ ...formState, unidad: event.target.value })
              }
              required
            >
              {unitOptions.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label>
          Proveedor referencial
          <input
            type="text"
            placeholder="Ej. Papelera Andina S.A. / Distribuidora Gráfica Peruana"
            value={formState.proveedor ?? ""}
            onChange={(event) =>
              setFormState({
                ...formState,
                proveedor: event.target.value,
                proveedor_referencial: event.target.value,
              })
            }
            required
          />
        </label>

        <div className={mode === "create" ? "modal-row-3" : "modal-row-2"}>
          {mode === "create" && (
            <label>
              Stock inicial
              <input
                type="number"
                min="0"
                step="any"
                className="font-mono tabular-nums"
                value={formState.stock_actual}
                onChange={(event) =>
                  setFormState({
                    ...formState,
                    stock_actual: Number(event.target.value),
                  })
                }
                required
              />
            </label>
          )}
          <label>
            Stock mínimo
            <input
              type="number"
              min="0"
              step="any"
              className="font-mono tabular-nums"
              value={formState.stock_minimo}
              onChange={(event) =>
                setFormState({
                  ...formState,
                  stock_minimo: Number(event.target.value),
                })
              }
              required
            />
          </label>
          <label>
            Costo unitario (S/)
            <input
              type="number"
              min="0"
              step="0.01"
              className="font-mono tabular-nums"
              value={formState.costo_unitario}
              onChange={(event) =>
                setFormState({
                  ...formState,
                  costo_unitario: Number(event.target.value),
                })
              }
              required
            />
          </label>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-primary bg-[#0F52BA]"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Guardando..."
              : mode === "edit"
                ? "Guardar cambios"
                : "Crear insumo"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
