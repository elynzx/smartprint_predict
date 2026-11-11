import { apiRequest } from "../../../api/client";
import type {
  MovementHistoryItem,
  MovementRequest,
  MovementResponse,
  MovementsQueryParams,
  PaginatedMovementsResponse,
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

export function createMovement(
  payload: MovementRequest,
  token?: string | null,
): Promise<MovementResponse> {
  const authToken = resolveStoredToken(token);
  return apiRequest<MovementResponse>(
    "/api/movimientos",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    authToken,
  );
}

export async function fetchMovements(
  token?: string | null,
  params: MovementsQueryParams = {},
): Promise<PaginatedMovementsResponse> {
  const authToken = resolveStoredToken(token);
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;

  const searchParams = new URLSearchParams();
  searchParams.set("page", String(page));
  searchParams.set("limit", String(limit));
  if (typeof params.insumo_id === "number" && params.insumo_id > 0) {
    searchParams.set("insumo_id", String(params.insumo_id));
  }
  if (params.tipo && params.tipo.trim()) {
    searchParams.set("tipo", params.tipo.trim());
  }

  const raw = await apiRequest<
    PaginatedMovementsResponse | MovementHistoryItem[]
  >(`/api/movimientos?${searchParams.toString()}`, {}, authToken);

  if (Array.isArray(raw)) {
    const total = raw.length;
    const start = (page - 1) * limit;
    const sliced = raw.slice(start, start + limit);
    return {
      items: sliced,
      total,
      page,
      limit,
      total_pages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  return {
    items: Array.isArray(raw.items) ? raw.items : [],
    total: Number(raw.total ?? 0),
    page: Number(raw.page ?? page),
    limit: Number(raw.limit ?? limit),
    total_pages: Number(raw.total_pages ?? 1),
  };
}
