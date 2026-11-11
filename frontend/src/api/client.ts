import type { AlertItem } from "../types";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export type RequestOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
  token?: string | null,
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

export function fetchActiveAlerts(token: string): Promise<AlertItem[]> {
  return apiRequest<AlertItem[]>("/api/alertas", {}, token);
}
