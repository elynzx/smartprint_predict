import { FormEvent, useEffect, useState } from "react";
import { Modal } from "../../../components/ui/Modal";
import type { UserRole } from "../../../types";
import { useAuth } from "../../auth/hooks/useAuth";
import {
  createUser,
  formatUserCode,
  updateUser,
} from "../services/userService";
import type { UserItem } from "../types";

export const USER_ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "administrador", label: "Administrador (Compras / Gerencia)" },
  { value: "trabajador", label: "Trabajador (Operador de Almacén)" },
  { value: "asesor_comercial", label: "Asesor Comercial (Ventas)" },
];

export interface UserFormModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  user: UserItem | null;
  onClose: () => void;
  onSaved: (saved: UserItem, mode: "create" | "edit") => Promise<void> | void;
}

export function UserFormModal({
  isOpen,
  mode,
  user,
  onClose,
  onSaved,
}: UserFormModalProps) {
  const { token } = useAuth();
  const [nombre, setNombre] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [rol, setRol] = useState<UserRole>("trabajador");
  const [activo, setActivo] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    setPassword("");
    if (mode === "edit" && user) {
      setNombre(user.nombre);
      setEmail(user.email);
      setRol(user.rol);
      setActivo(user.activo);
    } else {
      setNombre("");
      setEmail("");
      setRol("trabajador");
      setActivo(true);
    }
  }, [isOpen, mode, user]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;

    setError("");
    setIsSubmitting(true);

    try {
      if (mode === "edit" && user) {
        const updated = await updateUser(
          user.id,
          {
            nombre: nombre.trim(),
            email: email.trim().toLowerCase(),
            rol,
            activo,
            ...(password.trim() ? { password: password.trim() } : {}),
          },
          token,
        );
        await onSaved(updated, "edit");
      } else {
        const created = await createUser(
          {
            nombre: nombre.trim(),
            email: email.trim().toLowerCase(),
            password,
            rol,
            activo,
          },
          token,
        );
        await onSaved(created, "create");
      }
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo guardar el usuario.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const modalTitle =
    mode === "edit" && user
      ? `Editar usuario (${formatUserCode(user.id)})`
      : "Nuevo usuario";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
      <form onSubmit={handleSubmit}>
        <label>
          Nombre completo
          <input
            type="text"
            placeholder="Ej. María Fernanda Torres"
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            required
          />
        </label>

        <label>
          Correo electrónico corporativo
          <input
            type="email"
            placeholder="Ej. mtorres@resep.pe"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <div className="modal-row-2">
          <label>
            Rol en el sistema
            <select
              className="movimiento-select"
              value={rol}
              onChange={(event) => setRol(event.target.value as UserRole)}
              required
            >
              {USER_ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Estado de la cuenta
            <select
              className="movimiento-select"
              value={activo ? "true" : "false"}
              onChange={(event) => setActivo(event.target.value === "true")}
            >
              <option value="true">Activo (Acceso permitido)</option>
              <option value="false">Inactivo (Acceso suspendido)</option>
            </select>
          </label>
        </div>

        <label>
          {mode === "edit"
            ? "Nueva contraseña (opcional, dejar en blanco para mantener)"
            : "Contraseña de acceso"}
          <input
            type="password"
            placeholder={
              mode === "edit"
                ? "•••••••• (Sin cambios)"
                : "Mínimo 4 caracteres"
            }
            value={password}
            minLength={mode === "create" ? 4 : undefined}
            onChange={(event) => setPassword(event.target.value)}
            required={mode === "create"}
          />
        </label>

        {error && <div className="error">{error}</div>}

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-primary bg-[#0F52BA]"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Guardando..."
              : mode === "edit"
                ? "Guardar cambios"
                : "Crear usuario"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
