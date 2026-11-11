import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import { fetchSupplies } from "../../inventory/services/inventoryService";
import type { SupplyItem } from "../../inventory/types";
import { getPrediction } from "../services/predictionService";
import type { PredictionHorizon, PredictionResponse } from "../types";

export const INSUFFICIENT_CONSUMPTION_MESSAGE =
  "Insuficientes datos de consumo: Este insumo no cuenta con movimientos de SALIDA registrados en el taller para calcular una proyección predictiva de IA. Registra salidas en almacén para entrenar el modelo.";

export function usePredictions() {
  const { token } = useAuth();
  const [supplies, setSupplies] = useState<SupplyItem[]>([]);
  const [selectedSupplyId, setSelectedSupplyId] = useState<number | null>(null);
  const [horizon, setHorizon] = useState<PredictionHorizon>(30);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);

  const [isLoadingSupplies, setIsLoadingSupplies] = useState<boolean>(true);
  const [isLoadingPrediction, setIsLoadingPrediction] =
    useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string>("");

  const notifyToast = useCallback((message: string) => {
    setToastMessage(message);
    window.setTimeout(() => {
      setToastMessage((current) => (current === message ? "" : current));
    }, 3800);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadSupplies() {
      if (!token) {
        if (isMounted) {
          setSupplies([]);
          setIsLoadingSupplies(false);
        }
        return;
      }

      setIsLoadingSupplies(true);
      setError("");

      try {
        const list = await fetchSupplies(token);
        if (!isMounted) return;
        setSupplies(list);
        if (list.length > 0) {
          setSelectedSupplyId((prev) => prev ?? list[0].id);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudo cargar el catálogo de insumos para predicción.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingSupplies(false);
        }
      }
    }

    void loadSupplies();

    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    let isCancelled = false;

    async function loadPredictionForSupply() {
      if (!token || selectedSupplyId === null || selectedSupplyId <= 0) {
        if (!isCancelled) {
          setPrediction(null);
          setIsLoadingPrediction(false);
        }
        return;
      }

      setIsLoadingPrediction(true);
      setError("");

      try {
        const result = await getPrediction(selectedSupplyId, horizon, token);
        if (isCancelled) return;
        setPrediction(result);
        const obs = (result.observacion ?? "").toLowerCase();
        if (
          obs.includes("sin consumo") ||
          result.tasa_consumo_diaria <= 0 ||
          result.dias_cobertura === null
        ) {
          setError(INSUFFICIENT_CONSUMPTION_MESSAGE);
        }
      } catch (err: unknown) {
        if (isCancelled) return;
        setPrediction(null);
        const detail =
          err instanceof Error ? err.message : INSUFFICIENT_CONSUMPTION_MESSAGE;
        setError(detail || INSUFFICIENT_CONSUMPTION_MESSAGE);
      } finally {
        if (!isCancelled) {
          setIsLoadingPrediction(false);
        }
      }
    }

    void loadPredictionForSupply();

    return () => {
      isCancelled = true;
    };
  }, [token, selectedSupplyId, horizon]);

  const selectedSupply = useMemo<SupplyItem | null>(() => {
    if (supplies.length === 0) return null;
    return (
      supplies.find((item) => item.id === selectedSupplyId) ??
      supplies[0] ??
      null
    );
  }, [supplies, selectedSupplyId]);

  const loading = isLoadingSupplies || isLoadingPrediction;

  const hasInsufficientData =
    !loading &&
    (Boolean(error) ||
      !prediction ||
      prediction.tasa_consumo_diaria <= 0 ||
      prediction.dias_cobertura === null);

  return {
    supplies,
    selectedSupply,
    selectedSupplyId,
    horizon,
    prediction,
    loading,
    isLoading: loading,
    isLoadingSupplies,
    isLoadingPrediction,
    error,
    hasInsufficientData,
    toastMessage,
    setSelectedSupplyId,
    setHorizon,
    notifyToast,
  };
}
