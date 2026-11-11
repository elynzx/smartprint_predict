export enum RoleEnum {
  ADMIN = "administrador",
  WORKER = "trabajador",
  COMMERCIAL = "asesor_comercial",
}

export type UserRole =
  | "administrador"
  | "trabajador"
  | "asesor_comercial";

export interface User {
  id: number;
  nombre: string;
  email: string;
  rol: UserRole;
}

export interface AlertItem {
  id: number;
  insumo_id: number;
  nombre: string;
  prioridad: "Alta" | "Media" | "Baja" | string;
}

export type StatusVariant =
  | "Crítico"
  | "En Riesgo"
  | "Estable"
  | "Disponible"
  | "Stock Limitado"
  | "Alta"
  | "Media"
  | "Baja";
