import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { formatRoleDisplayName, formatUserCode } from "../services/userService";
import type { UserItem } from "../types";

export interface UserTableProps {
  users: UserItem[];
  currentUserId?: number;
  isLoading: boolean;
  onEditUser: (user: UserItem) => void;
  onToggleUserStatus: (user: UserItem) => void;
}

function getRoleBadgeClass(role: string): string {
  if (role === "administrador") {
    return "kpi-tag tag-blue";
  }
  if (role === "trabajador") {
    return "kpi-tag tag-cyan";
  }
  return "kpi-tag tag-amber";
}

export function UserTable({
  users,
  currentUserId,
  isLoading,
  onEditUser,
  onToggleUserStatus,
}: UserTableProps) {
  if (isLoading) {
    return <LoadingSpinner label="Cargando directorio de usuarios..." />;
  }

  if (users.length === 0) {
    return (
      <div className="availability-empty">
        No se encontraron usuarios registrados en el sistema.
      </div>
    );
  }

  return (
    <div className="table-scroll">
      <table className="inventory-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Nombre Completo</th>
            <th>Correo Electrónico</th>
            <th>Rol RBAC</th>
            <th>Estado</th>
            <th className="num-col">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isSelf = currentUserId === user.id;
            return (
              <tr key={user.id} className="inventory-row">
                <td className="font-mono tabular-nums code-cell">
                  {formatUserCode(user.id)}
                </td>
                <td>
                  <div className="insumo-cell">
                    <strong className="insumo-row-name text-[#17233D]">
                      {user.nombre}
                    </strong>
                    {isSelf && (
                      <small className="insumo-row-category">
                        Sesión actual
                      </small>
                    )}
                  </div>
                </td>
                <td className="font-mono text-[#75819A]">{user.email}</td>
                <td>
                  <span className={getRoleBadgeClass(user.rol)}>
                    {formatRoleDisplayName(user.rol)}
                  </span>
                </td>
                <td>
                  <span
                    className={
                      user.activo
                        ? "status good bg-[#E9FBF5] text-[#10B981]"
                        : "status critical bg-[#FFF0F0] text-[#EF4444]"
                    }
                  >
                    <i
                      className={
                        user.activo
                          ? "status-dot dot-good"
                          : "status-dot dot-critical"
                      }
                    />
                    {user.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="num-col actions-cell">
                  <button
                    type="button"
                    className="btn-row-action row-action-btn"
                    onClick={() => onEditUser(user)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="btn-row-icon row-action-btn"
                    disabled={isSelf && user.activo}
                    title={
                      isSelf
                        ? "No puedes desactivar tu propia sesión"
                        : user.activo
                          ? "Desactivar acceso"
                          : "Reactivar acceso"
                    }
                    onClick={() => onToggleUserStatus(user)}
                  >
                    {user.activo ? "⏸ Suspender" : "▶ Activar"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
