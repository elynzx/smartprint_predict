import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/hooks/useAuth";
import { UserFormModal } from "./components/UserFormModal";
import { UserTable } from "./components/UserTable";
import { fetchUsers, updateUser } from "./services/userService";
import type { UserItem } from "./types";

export function UsersPage() {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string>("");

  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  const notifyToast = useCallback((message: string) => {
    setToastMessage(message);
    window.setTimeout(() => {
      setToastMessage((current) => (current === message ? "" : current));
    }, 3800);
  }, []);

  const loadUsers = useCallback(async () => {
    if (!token) {
      setUsers([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const list = await fetchUsers(token);
      setUsers(list);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar el listado de usuarios.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  async function handleUserSaved(saved: UserItem, mode: "create" | "edit") {
    await loadUsers();
    notifyToast(
      mode === "create"
        ? `Usuario "${saved.nombre}" (${saved.email}) creado exitosamente.`
        : `Usuario "${saved.nombre}" actualizado correctamente.`,
    );
  }

  async function handleToggleUserStatus(target: UserItem) {
    if (!token) return;
    try {
      const updated = await updateUser(
        target.id,
        { activo: !target.activo },
        token,
      );
      setUsers((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
      notifyToast(
        `Cuenta de "${updated.nombre}" marcada como ${updated.activo ? "Activa" : "Inactiva"}.`,
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar el estado del usuario.",
      );
    }
  }

  return (
    <div className="inventory-view">
      {toastMessage && (
        <div className="toast-notification" role="status" aria-live="polite">
          <span className="toast-dot" />
          <span>{toastMessage}</span>
        </div>
      )}

      <header className="inventory-header">
        <div>
          <span className="availability-eyebrow">CONTROL DE ACCESO RBAC</span>
          <h1 className="text-[#17233D]">Gestión de Usuarios</h1>
          <p className="muted text-[#75819A]">
            Administración de cuentas corporativas, asignación de roles
            operativos y control de estado activo/inactivo.
          </p>
        </div>

        <div className="inventory-actions">
          <button
            type="button"
            className="btn-primary bg-[#0F52BA]"
            onClick={() => {
              setSelectedUser(null);
              setModalMode("create");
            }}
          >
            <span aria-hidden="true">+</span> Nuevo usuario
          </button>
        </div>
      </header>

      {error && <div className="error">{error}</div>}

      <section className="inventory-table-panel bg-white border border-[#E8EDF5] rounded-[12px]">
        <UserTable
          users={users}
          currentUserId={currentUser?.id}
          isLoading={isLoading}
          onEditUser={(target) => {
            setSelectedUser(target);
            setModalMode("edit");
          }}
          onToggleUserStatus={(target) => void handleToggleUserStatus(target)}
        />
      </section>

      <UserFormModal
        isOpen={modalMode !== null}
        mode={modalMode ?? "create"}
        user={selectedUser}
        onClose={() => setModalMode(null)}
        onSaved={handleUserSaved}
      />
    </div>
  );
}
