import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import {
  createKardexMovement,
  getReferentialSupplier,
} from "../services/inventoryService";
import type { MovementRequest, MovementType, SupplyItem } from "../types";

export interface UseKardexMovementOptions {
  supply: SupplyItem | null;
  initialType?: MovementType;
  onSuccess: (movementType: MovementType, supplyName: string) => Promise<void> | void;
}

export function useKardexMovement({
  supply,
  initialType = "SALIDA",
  onSuccess,
}: UseKardexMovementOptions) {
  const { token } = useAuth();
  const [movementType, setMovementType] = useState<MovementType>(initialType);
  const [quantityInput, setQuantityInput] = useState<string>("");
  const [reason, setReason] = useState<string>(
    "Despacho a taller para Orden de Trabajo",
  );
  const [referenceDocument, setReferenceDocument] = useState<string>("");
  const [supplier, setSupplier] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    setMovementType(initialType);
  }, [initialType]);

  useEffect(() => {
    if (movementType === "SALIDA") {
      setReason("Despacho a taller para Orden de Trabajo");
    } else {
      setReason("Ingreso por orden de compra programada");
      if (supply) {
        setSupplier(getReferentialSupplier(supply.categoria));
      }
    }
    setError("");
  }, [movementType, supply]);

  const parsedQuantity = Number(quantityInput);
  const isPositiveQuantity =
    quantityInput.trim() !== "" &&
    !Number.isNaN(parsedQuantity) &&
    parsedQuantity > 0;

  const availableStock = supply?.stock_actual ?? 0;
  const exceedsAvailableStock =
    movementType === "SALIDA" &&
    supply !== null &&
    isPositiveQuantity &&
    parsedQuantity > availableStock;

  const projectedStock = supply
    ? movementType === "ENTRADA"
      ? availableStock + (isPositiveQuantity ? parsedQuantity : 0)
      : Math.max(0, availableStock - (isPositiveQuantity ? parsedQuantity : 0))
    : 0;

  const isSubmitDisabled =
    !supply ||
    !isPositiveQuantity ||
    exceedsAvailableStock ||
    !reason.trim() ||
    isSubmitting;

  function resetForm() {
    setQuantityInput("");
    setReferenceDocument("");
    setNotes("");
    setError("");
  }

  async function submitMovement(event: FormEvent) {
    event.preventDefault();
    if (!token || !supply || isSubmitDisabled) return;

    setError("");
    setIsSubmitting(true);

    const payload: MovementRequest = {
      insumo_id: supply.id,
      tipo: movementType,
      cantidad: parsedQuantity,
      motivo: reason.trim(),
      documento_referencia: referenceDocument.trim() || undefined,
      proveedor:
        movementType === "ENTRADA" && supplier.trim()
          ? supplier.trim()
          : undefined,
      observaciones: notes.trim() || undefined,
    };

    try {
      await createKardexMovement(token, payload);
      resetForm();
      await onSuccess(movementType, supply.nombre);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo registrar el movimiento en el Kardex.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
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
    resetForm,
    submitMovement,
  };
}
