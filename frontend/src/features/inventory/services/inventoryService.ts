import { API_URL, apiRequest } from "../../../api/client";
import type {
  CreateSupplyPayload,
  MovementCreatedResponse,
  MovementRecord,
  MovementRequest,
  SupplyItem,
  SupplyStatus,
  UpdateSupplyPayload,
} from "../types";

const SUPPLIER_STORAGE_KEY = "smartprint.suppliers";

interface RawSupplyResponse {
  id: number;
  nombre: string;
  unidad: string;
  stock_actual: number | string;
  stock_minimo: number | string;
  costo_unitario: number | string;
  categoria: string;
  proveedor?: string | null;
  proveedor_referencial?: string | null;
}

function readStoredSuppliers(): Record<number, string> {
  try {
    const raw = localStorage.getItem(SUPPLIER_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<number, string>;
  } catch {
    return {};
  }
}

function saveStoredSupplier(supplyId: number, supplier?: string): void {
  const trimmed = (supplier ?? "").trim();
  if (!trimmed) return;
  try {
    const current = readStoredSuppliers();
    current[supplyId] = trimmed;
    localStorage.setItem(SUPPLIER_STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Ignore storage errors
  }
}

export function getReferentialSupplier(
  category: string,
  explicitSupplier?: string | null,
): string {
  if (explicitSupplier && explicitSupplier.trim().length > 0) {
    return explicitSupplier.trim();
  }
  const lower = category.toLowerCase();
  if (lower.includes("papel")) return "Papelera Andina S.A.";
  if (lower.includes("tinta")) return "Tintas & Pigmentos Gráficos SAC";
  if (lower.includes("plancha")) return "Distribuidora Gráfica Peruana";
  if (lower.includes("químico") || lower.includes("quimico")) {
    return "Química Industrial Gráfica S.A.";
  }
  return "Distribuidora Gráfica Peruana";
}

function normalizeSupply(raw: RawSupplyResponse): SupplyItem {
  const storedSuppliers = readStoredSuppliers();
  const resolvedSupplier =
    raw.proveedor ||
    raw.proveedor_referencial ||
    storedSuppliers[raw.id] ||
    getReferentialSupplier(raw.categoria);

  return {
    id: raw.id,
    nombre: raw.nombre,
    unidad: raw.unidad,
    stock_actual: Number(raw.stock_actual),
    stock_minimo: Number(raw.stock_minimo),
    costo_unitario: Number(raw.costo_unitario),
    categoria: raw.categoria,
    proveedor: resolvedSupplier,
    proveedor_referencial: resolvedSupplier,
  };
}

export function getSupplyStatus(
  currentStock: number,
  minimumStock: number,
): SupplyStatus {
  if (minimumStock > 0 && currentStock < 0.6 * minimumStock) {
    return "Crítico";
  }
  if (currentStock < minimumStock) {
    return "En Riesgo";
  }
  return "Estable";
}

export function formatSupplyCode(id: number): string {
  return `INS-${String(id).padStart(3, "0")}`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-PE", {
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(value);
}

export async function fetchSupplies(token: string): Promise<SupplyItem[]> {
  const data = await apiRequest<RawSupplyResponse[]>("/api/insumos", {}, token);
  return data.map(normalizeSupply);
}

export async function createSupply(
  token: string,
  payload: CreateSupplyPayload,
): Promise<SupplyItem> {
  const supplierValue = (
    payload.proveedor ??
    payload.proveedor_referencial ??
    ""
  ).trim();
  const requestBody: CreateSupplyPayload = {
    ...payload,
    proveedor: supplierValue || getReferentialSupplier(payload.categoria),
    proveedor_referencial:
      supplierValue || getReferentialSupplier(payload.categoria),
  };

  const created = await apiRequest<RawSupplyResponse>(
    "/api/insumos",
    {
      method: "POST",
      body: JSON.stringify(requestBody),
    },
    token,
  );
  saveStoredSupplier(created.id, requestBody.proveedor);
  return normalizeSupply({
    ...created,
    proveedor: requestBody.proveedor,
    proveedor_referencial: requestBody.proveedor_referencial,
  });
}

export async function updateSupply(
  token: string,
  supplyId: number,
  payload: UpdateSupplyPayload,
): Promise<SupplyItem> {
  const supplierValue = (
    payload.proveedor ??
    payload.proveedor_referencial ??
    ""
  ).trim();
  const requestBody: UpdateSupplyPayload = {
    ...payload,
    ...(supplierValue
      ? {
          proveedor: supplierValue,
          proveedor_referencial: supplierValue,
        }
      : {}),
  };

  const updated = await apiRequest<RawSupplyResponse>(
    `/api/insumos/${supplyId}`,
    {
      method: "PATCH",
      body: JSON.stringify(requestBody),
    },
    token,
  );
  if (supplierValue) {
    saveStoredSupplier(supplyId, supplierValue);
  }
  return normalizeSupply({
    ...updated,
    ...(supplierValue
      ? {
          proveedor: supplierValue,
          proveedor_referencial: supplierValue,
        }
      : {}),
  });
}

export async function fetchKardexMovements(
  token: string,
  supplyId?: number,
): Promise<MovementRecord[]> {
  const params = supplyId ? `?insumo_id=${supplyId}` : "";
  const raw = await apiRequest<
    MovementRecord[] | { items?: MovementRecord[] }
  >(`/api/movimientos${params}`, {}, token);
  if (Array.isArray(raw)) {
    return raw;
  }
  return Array.isArray(raw?.items) ? raw.items : [];
}

export function createKardexMovement(
  token: string,
  payload: MovementRequest,
): Promise<MovementCreatedResponse> {
  return apiRequest<MovementCreatedResponse>(
    "/api/movimientos",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function exportInventoryCsv(
  token: string,
  fallbackItems: SupplyItem[] = [],
): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/api/reportes/inventario.csv`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "inventario_resep.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return;
    }
  } catch {
    // Fallback client-side CSV generation when endpoint is unavailable
  }

  const headers = [
    "ID",
    "Codigo",
    "Nombre",
    "Categoria",
    "Unidad",
    "Proveedor",
    "Stock_Actual",
    "Stock_Minimo",
    "Costo_Unitario_PEN",
    "Estado",
  ];
  const rows = fallbackItems.map((item) => {
    const status = getSupplyStatus(item.stock_actual, item.stock_minimo);
    const supplier =
      item.proveedor ??
      item.proveedor_referencial ??
      getReferentialSupplier(item.categoria);
    return [
      item.id,
      formatSupplyCode(item.id),
      `"${item.nombre.replace(/"/g, '""')}"`,
      `"${item.categoria.replace(/"/g, '""')}"`,
      item.unidad,
      `"${supplier.replace(/"/g, '""')}"`,
      item.stock_actual,
      item.stock_minimo,
      item.costo_unitario.toFixed(2),
      status,
    ].join(",");
  });
  const csvContent = "\ufeff" + [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "inventario_resep.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
