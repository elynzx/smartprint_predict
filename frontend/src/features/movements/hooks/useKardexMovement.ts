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

export const DEFAULT_MOVEMENTS_PAGE_LIMIT = 10;

export function useKardexMovement() {
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const querySupplyIdParam = searchParams.get("insumo_id");
  const queryTypeParam = searchParams.get("type");
  const queryQuantityParam = searchParams.get("quantity");

  const [supplies, setSupplies] = useState<SupplyItem[]>([]);
  const [movements, setMovements] = useState<MovementHistoryItem[]>([]);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(DEFAULT_MOVEMENTS_PAGE_LIMIT);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoadingMovements, setIsLoadingMovements] = useState<boolean>(false);

  const [selectedSupplyId, setSelectedSupplyId] = useState<number | null>(
    () => {
      const parsed = Number(querySupplyIdParam);
      return querySupplyIdParam && !Number.isNaN(parsed) && parsed > 0
        ? parsed
        : null;
    },
  );

  const [movementType, setMovementType] = useState<MovementType>(() => {
    const normalizedType = (queryTypeParam ?? "").toUpperCase();
    return normalizedType === "ENTRADA" || normalizedType === "SALIDA"
      ? normalizedType
      : "SALIDA";
  });
  const [quantityInput, setQuantityInput] = useState<string>(() => {
    const parsedQty = Number(queryQuantityParam);
    return queryQuantityParam && !Number.isNaN(parsedQty) && parsedQty > 0
      ? String(parsedQty)
      : "";
  });
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

  const loadPaginatedMovements = useCallback(
    async (targetPage = page, targetLimit = limit) => {
      if (!token) {
        setMovements([]);
        setTotalRecords(0);
        setTotalPages(1);
        setIsLoadingMovements(false);
        return;
      }

      setIsLoadingMovements(true);
      try {
        const paginated = await fetchMovements(token, {
          page: targetPage,
          limit: targetLimit,
        });
        setMovements(paginated.items);
        setTotalRecords(paginated.total);
        setPage(paginated.page);
        setLimit(paginated.limit);
        setTotalPages(Math.max(1, paginated.total_pages));
      } catch {
        setMovements([]);
      } finally {
        setIsLoadingMovements(false);
      }
    },
    [token, page, limit],
  );

  const loadSuppliesCatalog = useCallback(
    async (preferredSupplyId?: number) => {
      if (!token) {
        setSupplies([]);
        setIsLoadingSupplies(false);
        return;
      }

      setIsLoadingSupplies(true);
      try {
        const suppliesData = await fetchSupplies(token);
        setSupplies(suppliesData);

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
    void loadSuppliesCatalog();
  }, [loadSuppliesCatalog]);

  useEffect(() => {
    void loadPaginatedMovements(page, limit);
  }, [loadPaginatedMovements, page, limit]);

  useEffect(() => {
    if (querySupplyIdParam) {
      const parsed = Number(querySupplyIdParam);
      if (!Number.isNaN(parsed) && parsed > 0) {
        setSelectedSupplyId(parsed);
      }
    }
    if (queryTypeParam) {
      const normalizedType = queryTypeParam.toUpperCase();
      if (normalizedType === "ENTRADA" || normalizedType === "SALIDA") {
        setMovementType(normalizedType);
      }
    }
    if (queryQuantityParam) {
      const parsedQty = Number(queryQuantityParam);
      if (!Number.isNaN(parsedQty) && parsedQty > 0) {
        setQuantityInput(String(parsedQty));
      }
    }
  }, [querySupplyIdParam, queryTypeParam, queryQuantityParam]);

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
        setSupplier(
          selectedSupply.proveedor ||
            selectedSupply.proveedor_referencial ||
            getReferentialSupplier(selectedSupply.categoria),
        );
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
      setPage(1);
      await Promise.all([
        loadSuppliesCatalog(selectedSupply.id),
        loadPaginatedMovements(1, limit),
      ]);
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
    page,
    limit,
    totalRecords,
    totalPages,
    isLoadingMovements,
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
    setPage,
    setLimit,
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
