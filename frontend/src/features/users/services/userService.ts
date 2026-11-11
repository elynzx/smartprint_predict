import { apiRequest } from "../../../api/client";
import type {
  CreateUserRequest,
  UpdateUserRequest,
  UserItem,
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

export function formatUserCode(id: number): string {
  return `USR-${String(id).padStart(3, "0")}`;
}

export function formatRoleDisplayName(rol: string): string {
  if (rol === "administrador") return "Administrador (Compras)";
  if (rol === "trabajador") return "Trabajador (Almacén)";
  if (rol === "asesor_comercial") return "Asesor Comercial";
  return rol;
}

export function fetchUsers(token?: string | null): Promise<UserItem[]> {
  const authToken = resolveStoredToken(token);
  return apiRequest<UserItem[]>("/api/usuarios", {}, authToken);
}

export function createUser(
  payload: CreateUserRequest,
  token?: string | null,
): Promise<UserItem> {
  const authToken = resolveStoredToken(token);
  return apiRequest<UserItem>(
    "/api/usuarios",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    authToken,
  );
}

export function updateUser(
  userId: number,
  payload: UpdateUserRequest,
  token?: string | null,
): Promise<UserItem> {
  const authToken = resolveStoredToken(token);
  return apiRequest<UserItem>(
    `/api/usuarios/${userId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    authToken,
  );
}
