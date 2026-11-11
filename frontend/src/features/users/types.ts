import type { UserRole } from "../../types";

export interface UserItem {
  id: number;
  nombre: string;
  email: string;
  rol: UserRole;
  activo: boolean;
}

export interface CreateUserRequest {
  nombre: string;
  email: string;
  password: string;
  rol: UserRole;
  activo?: boolean;
}

export interface UpdateUserRequest {
  nombre?: string;
  email?: string;
  rol?: UserRole;
  activo?: boolean;
  password?: string;
}
