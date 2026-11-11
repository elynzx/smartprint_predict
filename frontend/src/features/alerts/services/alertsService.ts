import { apiRequest } from "../../../api/client";
import { formatSupplyCode } from "../../inventory/services/inventoryService";
import type { SupplyItem } from "../../inventory/types";
import type { AlertItem, AlertSeverity } from "../types";

const AUTH_STORAGE_KEY = "smartprint.auth";

interface RawAlertPayload {
  id?: number;
  insumo_id: number;
  nombre: string;
  codigo?: string;
  categoria?: string;
  unidad?: string;
  stock_actual?: number;
  stock_minimo?: number;
  deficit?: number;
  dias_agotamiento?: number | null;
  estado_alerta?: string;
  prioridad?: string;
}

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

function normalizeSeverity(
  rawEstado?: string,
  rawPrioridad?: string,
  stockActual?: number,
  stockMinimo?: number,
): AlertSeverity {
  const normalized = (rawEstado ?? "").trim().toLowerCase();
  if (normalized === "critico" || normalized === "crítico") {
    return "critico";
  }
  if (normalized === "revision" || normalized === "revisión") {
    return "revision";
  }
  if (
    typeof stockActual === "number" &&
    typeof stockMinimo === "number" &&
    stockMinimo > 0
  ) {
    return stockActual < 0.6 * stockMinimo ? "critico" : "revision";
  }
  return rawPrioridad === "Alta" ? "critico" : "revision";
}

export function enrichAlertWithSupply(
  raw: RawAlertPayload,
  supply?: SupplyItem,
): AlertItem {
  const stockActual = Number(raw.stock_actual ?? supply?.stock_actual ?? 0);
  const stockMinimo = Number(raw.stock_minimo ?? supply?.stock_minimo ?? 0);
  const deficit =
    typeof raw.deficit === "number"
      ? Math.max(0, raw.deficit)
      : Math.max(0, stockMinimo - stockActual);

  const estadoAlerta = normalizeSeverity(
    raw.estado_alerta,
    raw.prioridad,
    stockActual,
    stockMinimo,
  );

  const fallbackDepletionDays =
    stockMinimo > 0
      ? Math.max(1, Math.round((stockActual / stockMinimo) * 12))
      : null;

  return {
    id: raw.id ?? raw.insumo_id,
    insumo_id: raw.insumo_id,
    nombre: raw.nombre || supply?.nombre || `Insumo #${raw.insumo_id}`,
    codigo: raw.codigo || formatSupplyCode(raw.insumo_id),
    categoria: raw.categoria || supply?.categoria || "General",
    unidad: raw.unidad || supply?.unidad || "und",
    stock_actual: stockActual,
    stock_minimo: stockMinimo,
    deficit: Number(deficit.toFixed(2)),
    dias_agotamiento:
      raw.dias_agotamiento !== undefined
        ? raw.dias_agotamiento
        : fallbackDepletionDays,
    estado_alerta: estadoAlerta,
    prioridad:
      raw.prioridad ?? (estadoAlerta === "critico" ? "Alta" : "Media"),
  };
}

export async function getAlerts(
  estado?: string,
  limit = 50,
  token?: string | null,
): Promise<AlertItem[]> {
  const authToken = resolveStoredToken(token);
  const params = new URLSearchParams();
  if (estado && estado !== "all") {
    params.set("estado", estado);
  }
  if (limit) {
    params.set("limit", String(limit));
  }

  const queryString = params.toString();
  const endpoint = queryString
    ? `/api/alertas?${queryString}`
    : "/api/alertas";

  const rawList = await apiRequest<RawAlertPayload[]>(endpoint, {}, authToken);
  return rawList.map((item) => enrichAlertWithSupply(item));
}
