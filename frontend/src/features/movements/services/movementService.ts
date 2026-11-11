import { apiRequest } from "../../../api/client";
import type {
  MovementHistoryItem,
  MovementRequest,
  MovementResponse,
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

export function fetchMovements(
  token?: string | null,
  supplyId?: number,
): Promise<MovementHistoryItem[]> {
  const authToken = resolveStoredToken(token);
  const params = supplyId ? `?insumo_id=${supplyId}` : "";
  return apiRequest<MovementHistoryItem[]>(
    `/api/movimientos${params}`,
    {},
    authToken,
  );
}
