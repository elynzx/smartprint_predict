const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

type RequestOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

export type Role = "administrador" | "trabajador" | "asesor_comercial";

export interface AuthUser {
  id: number;
  nombre: string;
  email: string;
  rol: Role;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export interface DisponibilidadItem {
  insumo_id: number;
  nombre: string;
  unidad: string;
  estado_disponibilidad: "Disponible" | "Stock Limitado";
  observacion_comercial: string;
}

export interface AlertItem {
  id: number;
  insumo_id: number;
  nombre: string;
  prioridad: string;
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
  token?: string,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      detail?: string;
    } | null;
    throw new Error(body?.detail ?? `Error HTTP ${response.status}`);
  }
  return (await response.json()) as T;
}

export function login(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function getAlerts(token: string): Promise<AlertItem[]> {
  return request<AlertItem[]>("/api/alertas", {}, token);
}

export function getDisponibilidad(
  token: string,
  query = "",
): Promise<DisponibilidadItem[]> {
  const params = query ? `?q=${encodeURIComponent(query)}` : "";
  return request<DisponibilidadItem[]>(
    `/api/disponibilidad${params}`,
    {},
    token,
  );
}
