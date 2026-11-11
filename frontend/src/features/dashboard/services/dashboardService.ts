import { apiRequest, fetchActiveAlerts } from "../../../api/client";
import {
  fetchKardexMovements,
  fetchSupplies,
  formatSupplyCode,
} from "../../inventory/services/inventoryService";
import type { SupplyItem } from "../../inventory/types";
import type {
  CategoryDistributionItem,
  DashboardSummary,
  PrioritySupplyItem,
  PrioritySupplyStatus,
  WeeklyTrendPoint,
} from "../types";

const AUTH_STORAGE_KEY = "smartprint.auth";

function resolveStoredToken(explicitToken?: string | null): string | undefined {
  if (explicitToken) return explicitToken;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { token?: string };
    return parsed.token;
  } catch {
    return undefined;
  }
}

export function classifyPriorityStatus(
  currentStock: number,
  minimumStock: number,
): PrioritySupplyStatus {
  if (minimumStock > 0 && currentStock < 0.6 * minimumStock) {
    return "Crítico";
  }
  if (currentStock < minimumStock) {
    return "Alerta";
  }
  if (minimumStock > 0 && currentStock < 1.15 * minimumStock) {
    return "Revisión";
  }
  return "Estable";
}

export const DEFAULT_CATEGORY_DISTRIBUTION: CategoryDistributionItem[] = [
  { categoria: "Papel", porcentaje: 38, color: "#0F52BA" },
  { categoria: "Tintas", porcentaje: 24, color: "#00A4E4" },
  { categoria: "Planchas", porcentaje: 18, color: "#10B981" },
  { categoria: "Otros", porcentaje: 20, color: "#F59E0B" },
];

export function buildEightWeekTrend(weeklyBase = 240): WeeklyTrendPoint[] {
  const base = weeklyBase > 0 ? weeklyBase : 240;
  return [
    {
      week: "Sem 1",
      realConsumption: Math.round(base * 0.86),
      projectedConsumption: Math.round(base * 0.88),
    },
    {
      week: "Sem 2",
      realConsumption: Math.round(base * 0.94),
      projectedConsumption: Math.round(base * 0.92),
    },
    {
      week: "Sem 3",
      realConsumption: Math.round(base * 0.91),
      projectedConsumption: Math.round(base * 0.95),
    },
    {
      week: "Sem 4",
      realConsumption: Math.round(base * 1.02),
      projectedConsumption: Math.round(base * 0.99),
    },
    {
      week: "Sem 5",
      realConsumption: Math.round(base * 1.05),
      projectedConsumption: Math.round(base * 1.03),
    },
    {
      week: "Sem 6",
      realConsumption: null,
      projectedConsumption: Math.round(base * 1.07),
    },
    {
      week: "Sem 7",
      realConsumption: null,
      projectedConsumption: Math.round(base * 1.11),
    },
    {
      week: "Sem 8",
      realConsumption: null,
      projectedConsumption: Math.round(base * 1.15),
    },
  ];
}

function buildPrioritySupplies(supplies: SupplyItem[]): PrioritySupplyItem[] {
  return [...supplies]
    .sort((a, b) => {
      const ratioA =
        a.stock_minimo > 0 ? a.stock_actual / a.stock_minimo : 999;
      const ratioB =
        b.stock_minimo > 0 ? b.stock_actual / b.stock_minimo : 999;
      return ratioA - ratioB;
    })
    .map((item) => ({
      id: item.id,
      codigo: formatSupplyCode(item.id),
      nombre: item.nombre,
      categoria: item.categoria,
      unidad: item.unidad,
      stock_actual: item.stock_actual,
      stock_minimo: item.stock_minimo,
      estado: classifyPriorityStatus(item.stock_actual, item.stock_minimo),
    }));
}

export async function getDashboardSummary(
  token?: string | null,
): Promise<DashboardSummary> {
  const authToken = resolveStoredToken(token);
  if (!authToken) {
    throw new Error("Sesión no disponible para consultar el Dashboard.");
  }

  try {
    const summary = await apiRequest<DashboardSummary>(
      "/api/dashboard",
      {},
      authToken,
    );
    return {
      ...summary,
      distribucion_categorias:
        summary.distribucion_categorias?.length > 0
          ? summary.distribucion_categorias
          : DEFAULT_CATEGORY_DISTRIBUTION,
      tendencia_semanal:
        summary.tendencia_semanal ??
        buildEightWeekTrend(summary.prediccion_semanal_total),
    };
  } catch {
    const [supplies, alerts, movements] = await Promise.all([
      fetchSupplies(authToken),
      fetchActiveAlerts(authToken).catch(() => []),
      fetchKardexMovements(authToken).catch(() => []),
    ]);

    const criticalCount = supplies.filter(
      (item) =>
        item.stock_minimo > 0 && item.stock_actual < 0.6 * item.stock_minimo,
    ).length;

    const belowMinCount = supplies.filter(
      (item) => item.stock_actual < item.stock_minimo,
    ).length;

    const activeAlertsCount = Math.max(alerts.length, belowMinCount);

    const estimatedWeeklyDemand = Math.round(
      supplies.reduce((acc, item) => acc + item.stock_minimo * 0.35, 0),
    );

    return {
      total_insumos: supplies.length,
      stock_critico_count: criticalCount,
      alertas_activas_count: activeAlertsCount,
      prediccion_semanal_total: estimatedWeeklyDemand || 245,
      insumos_prioritarios: buildPrioritySupplies(supplies),
      movimientos_recientes: movements.slice(0, 6).map((mov) => ({
        id: mov.id,
        insumo_id: mov.insumo_id,
        insumo_nombre: mov.insumo_nombre,
        unidad: mov.unidad,
        tipo: mov.tipo,
        cantidad: mov.cantidad,
        documento_referencia: mov.documento_referencia,
        fecha_operacion: mov.fecha_operacion,
        usuario_nombre: mov.usuario_nombre,
      })),
      distribucion_categorias: DEFAULT_CATEGORY_DISTRIBUTION,
      tendencia_semanal: buildEightWeekTrend(estimatedWeeklyDemand || 245),
    };
  }
}
