import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import {
  fetchSupplies,
  getReferentialSupplier,
} from "../../inventory/services/inventoryService";
import type { SupplyItem } from "../../inventory/types";
import { createMovement, fetchMovements } from "../services/movementService";
import type {
  MovementHistoryItem,
  MovementRequest,
  MovementType,
} from "../types";

export const EXCEEDED_STOCK_WARNING =
  "Cantidad ingresada supera el stock disponible en taller";

export function useKardexMovement() {
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const querySupplyIdParam = searchParams.get("insumo_id");

  const [supplies, setSupplies] = useState<SupplyItem[]>([]);
  const [movements, setMovements] = useState<MovementHistoryItem[]>([]);
  const [selectedSupplyId, setSelectedSupplyId] = useState<number | null>(
    () => {
      const parsed = Number(querySupplyIdParam);
      return querySupplyIdParam && !Number.isNaN(parsed) && parsed > 0
        ? parsed
        : null;
    },
  );

  const [movementType, setMovementType] = useState<MovementType>("SALIDA");
  const [quantityInput, setQuantityInput] = useState<string>("");
  const [reason, setReason] = useState<string>(
    "Despacho a taller para Orden de Trabajo",
  );
  const [referenceDocument, setReferenceDocument] = useState<string>("");
  const [supplier, setSupplier] = useState<string>("");
  const [observations, setObservations] = useState<string>("");

  const [isLoadingSupplies, setIsLoadingSupplies] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string>("");

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    window.setTimeout(() => {
      setToastMessage((current) => (current === message ? "" : current));
    }, 3800);
  }, []);

  const loadSuppliesAndHistory = useCallback(
    async (preferredSupplyId?: number) => {
      if (!token) {
        setSupplies([]);
        setMovements([]);
        setIsLoadingSupplies(false);
        return;
      }

      setIsLoadingSupplies(true);
      try {
        const [suppliesData, movementsData] = await Promise.all([
          fetchSupplies(token),
          fetchMovements(token).catch(() => [] as MovementHistoryItem[]),
        ]);
        setSupplies(suppliesData);
        setMovements(movementsData);

        if (suppliesData.length > 0) {
          const urlId = Number(searchParams.get("insumo_id"));
          const candidateId =
            preferredSupplyId ??
            (!Number.isNaN(urlId) && urlId > 0 ? urlId : null);

          setSelectedSupplyId((previousId) => {
            const targetId = candidateId ?? previousId;
            if (targetId !== null) {
              const matched = suppliesData.find((item) => item.id === targetId);
              if (matched) return matched.id;
            }
            return suppliesData[0].id;
          });
        }
      } catch (err: unknown) {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "No se pudo cargar el catálogo de insumos para el Kardex.",
        );
      } finally {
        setIsLoadingSupplies(false);
      }
    },
    [token, searchParams],
  );

  useEffect(() => {
    void loadSuppliesAndHistory();
  }, [loadSuppliesAndHistory]);

  useEffect(() => {
    if (!querySupplyIdParam) return;
    const parsed = Number(querySupplyIdParam);
    if (!Number.isNaN(parsed) && parsed > 0) {
      setSelectedSupplyId(parsed);
    }
  }, [querySupplyIdParam]);

  const selectedSupply = useMemo<SupplyItem | null>(() => {
    if (supplies.length === 0) return null;
    return (
      supplies.find((item) => item.id === selectedSupplyId) ??
      supplies[0] ??
      null
    );
  }, [supplies, selectedSupplyId]);

  useEffect(() => {
    if (movementType === "SALIDA") {
      setReason("Despacho a taller para Orden de Trabajo");
    } else {
      setReason("Ingreso por orden de compra programada");
      if (selectedSupply) {
        setSupplier(getReferentialSupplier(selectedSupply.categoria));
      }
    }
    setErrorMessage("");
  }, [movementType, selectedSupply]);

  function handleSelectSupply(supplyId: number) {
    setSelectedSupplyId(supplyId);
    setSearchParams({ insumo_id: String(supplyId) }, { replace: true });
    setErrorMessage("");
  }

  const parsedQuantity = Number(quantityInput);
  const isPositiveQuantity =
    quantityInput.trim() !== "" &&
    !Number.isNaN(parsedQuantity) &&
    parsedQuantity > 0;

  const currentStock = selectedSupply?.stock_actual ?? 0;
  const minimumStock = selectedSupply?.stock_minimo ?? 0;

  const isInvalidSalida =
    movementType === "SALIDA" &&
    selectedSupply !== null &&
    isPositiveQuantity &&
    parsedQuantity > currentStock;

  const estimatedStock = selectedSupply
    ? movementType === "ENTRADA"
      ? currentStock + (isPositiveQuantity ? parsedQuantity : 0)
      : currentStock - (isPositiveQuantity ? parsedQuantity : 0)
    : 0;

  const isSubmitDisabled =
    !selectedSupply ||
    !isPositiveQuantity ||
    isInvalidSalida ||
    !reason.trim() ||
    isSubmitting;

  function resetFormFields() {
    setQuantityInput("");
    setReferenceDocument("");
    setObservations("");
    setErrorMessage("");
  }

  async function handleSubmitMovement(event: FormEvent) {
    event.preventDefault();
    if (!token || !selectedSupply || isSubmitDisabled) return;

    setErrorMessage("");
    setIsSubmitting(true);

    const payload: MovementRequest = {
      insumo_id: selectedSupply.id,
      tipo: movementType,
      cantidad: parsedQuantity,
      motivo: reason.trim(),
      documento_referencia: referenceDocument.trim() || undefined,
      proveedor:
        movementType === "ENTRADA" && supplier.trim()
          ? supplier.trim()
          : undefined,
      observaciones: observations.trim() || undefined,
      fecha_operacion: new Date().toISOString(),
    };

    try {
      const response = await createMovement(payload, token);
      resetFormFields();
      await loadSuppliesAndHistory(selectedSupply.id);
      showToast(
        `${response.tipo === "ENTRADA" ? "Entrada" : "Salida"} registrada para "${selectedSupply.nombre}". Saldo resultante: ${response.saldo_resultante} ${selectedSupply.unidad}.`,
      );
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Error al registrar el movimiento en el Kardex.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    supplies,
    movements,
    selectedSupply,
    movementType,
    quantityInput,
    parsedQuantity,
    isPositiveQuantity,
    reason,
    referenceDocument,
    supplier,
    observations,
    currentStock,
    minimumStock,
    estimatedStock,
    isInvalidSalida,
    isSubmitDisabled,
    isLoadingSupplies,
    isSubmitting,
    errorMessage,
    toastMessage,
    warningMessage: isInvalidSalida ? EXCEEDED_STOCK_WARNING : "",
    setMovementType,
    setQuantityInput,
    setReason,
    setReferenceDocument,
    setSupplier,
    setObservations,
    handleSelectSupply,
    handleSubmitMovement,
    resetFormFields,
  };
}
