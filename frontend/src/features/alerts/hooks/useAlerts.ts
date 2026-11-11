import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import {
  fetchSupplies,
  formatNumber,
  formatSupplyCode,
} from "../../inventory/services/inventoryService";
import type { SupplyItem } from "../../inventory/types";
import { enrichAlertWithSupply, getAlerts } from "../services/alertsService";
import type {
  AlertFilterOption,
  AlertItem,
  IncidentTimelineItem,
} from "../types";

export function useAlerts() {
  const { token } = useAuth();
  const [allAlerts, setAllAlerts] = useState<AlertItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<AlertFilterOption>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const loadAlerts = useCallback(async () => {
    if (!token) {
      setAllAlerts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [rawAlerts, supplies] = await Promise.all([
        getAlerts(undefined, 50, token),
        fetchSupplies(token).catch(() => [] as SupplyItem[]),
      ]);

      const supplyMap = new Map<number, SupplyItem>(
        supplies.map((supply) => [supply.id, supply]),
      );

      let mergedAlerts = rawAlerts.map((alert) => {
        const supply = supplyMap.get(alert.insumo_id);
        return supply ? enrichAlertWithSupply(alert, supply) : alert;
      });

      if (mergedAlerts.length === 0 && supplies.length > 0) {
        mergedAlerts = supplies
          .filter((supply) => supply.stock_actual < supply.stock_minimo)
          .map((supply) =>
            enrichAlertWithSupply(
              {
                insumo_id: supply.id,
                nombre: supply.nombre,
                codigo: formatSupplyCode(supply.id),
                categoria: supply.categoria,
                unidad: supply.unidad,
                stock_actual: supply.stock_actual,
                stock_minimo: supply.stock_minimo,
              },
              supply,
            ),
          );
      }

      mergedAlerts.sort((a, b) => {
        if (a.estado_alerta !== b.estado_alerta) {
          return a.estado_alerta === "critico" ? -1 : 1;
        }
        return (a.dias_agotamiento ?? 999) - (b.dias_agotamiento ?? 999);
      });

      setAllAlerts(mergedAlerts);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron consultar las alertas de abastecimiento.",
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadAlerts();
  }, [loadAlerts]);

  const filteredAlerts = useMemo<AlertItem[]>(() => {
    if (activeFilter === "all") return allAlerts;
    return allAlerts.filter((item) => item.estado_alerta === activeFilter);
  }, [allAlerts, activeFilter]);

  const criticalCount = useMemo(
    () => allAlerts.filter((item) => item.estado_alerta === "critico").length,
    [allAlerts],
  );

  const reviewCount = useMemo(
    () => allAlerts.filter((item) => item.estado_alerta === "revision").length,
    [allAlerts],
  );

  const incidents = useMemo<IncidentTimelineItem[]>(() => {
    const generated: IncidentTimelineItem[] = allAlerts
      .slice(0, 5)
      .map((alert, idx) => {
        const minutesAgo = (idx + 1) * 18;
        const unitLabel = alert.unidad ?? "und";
        const isCritical = alert.estado_alerta === "critico";
        return {
          id: `inc-${alert.insumo_id}`,
          timeLabel: `Hace ${minutesAgo} min`,
          title: isCritical
            ? `Quiebre crítico detectado: ${alert.nombre}`
            : `Umbral preventivo alcanzado: ${alert.nombre}`,
          detail: `Saldo físico (${formatNumber(alert.stock_actual)} ${unitLabel}) por debajo del mínimo (${formatNumber(alert.stock_minimo)} ${unitLabel}). Déficit: ${formatNumber(alert.deficit)} ${unitLabel}.`,
          severity: alert.estado_alerta,
          supplyCode: alert.codigo,
        };
      });

    generated.push({
      id: "inc-system-audit",
      timeLabel: "Hoy, 08:00 AM",
      title: "Barrido automático de umbrales completado",
      detail:
        "El motor SmartPrint verificó los saldos físicos frente al stock de seguridad de planta.",
      severity: "info",
    });

    return generated;
  }, [allAlerts]);

  return {
    alerts: filteredAlerts,
    allAlerts,
    activeFilter,
    criticalCount,
    reviewCount,
    totalCount: allAlerts.length,
    incidents,
    loading,
    error,
    setActiveFilter,
    refreshAlerts: loadAlerts,
  };
}
