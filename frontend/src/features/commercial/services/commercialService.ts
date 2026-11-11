import { apiRequest } from "../../../api/client";
import type { CommercialSupplyItem } from "../types";

export function fetchCommercialAvailability(
  token: string,
  query = "",
): Promise<CommercialSupplyItem[]> {
  const params = query ? `?q=${encodeURIComponent(query)}` : "";
  return apiRequest<CommercialSupplyItem[]>(
    `/api/disponibilidad${params}`,
    {},
    token,
  );
}

export function resolveCategoryLabel(
  supplyName: string,
  explicitCategory?: string,
): string {
  if (explicitCategory && explicitCategory.trim().length > 0) {
    return explicitCategory;
  }
  const lower = supplyName.toLowerCase();
  if (lower.includes("papel")) return "Papel";
  if (lower.includes("tinta")) return "Tintas";
  if (lower.includes("plancha")) return "Planchas";
  if (lower.includes("solvente") || lower.includes("químico")) {
    return "Químicos";
  }
  return "Insumos";
}

export function formatUnitLabel(unit: string): string {
  const normalized = unit.trim().toLowerCase();
  const singularMap: Record<string, string> = {
    resmas: "Resma",
    resma: "Resma",
    litros: "Litro",
    litro: "Litro",
    unidades: "Unidad",
    unidad: "Unidad",
    pliegos: "Pliego",
    pliego: "Pliego",
    rollos: "Rollo",
    rollo: "Rollo",
    galones: "Galón",
    galon: "Galón",
  };
  if (singularMap[normalized]) {
    return singularMap[normalized];
  }
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function resolveCommercialNote(item: CommercialSupplyItem): string {
  if (item.estado_disponibilidad === "Disponible") {
    return item.observacion_comercial || "Apto para programación de proyecto";
  }
  return (
    item.observacion_comercial || "Requiere confirmación de plazo con almacén"
  );
}
