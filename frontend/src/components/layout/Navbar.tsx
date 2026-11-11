import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { RoleEnum } from "../../types";

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatRoleLabel(role: string): string {
  if (role === RoleEnum.ADMIN) return "Compras / Admin";
  if (role === RoleEnum.WORKER) return "Almacén";
  if (role === RoleEnum.COMMERCIAL) return "Asesor Comercial";
  return role;
}

function getDefaultEmailForRole(role: string): string {
  if (role === RoleEnum.ADMIN) return "admin@resep.pe";
  if (role === RoleEnum.WORKER) return "almacen@resep.pe";
  if (role === RoleEnum.COMMERCIAL) return "comercial@resep.pe";
  return "usuario@resep.pe";
}

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownContainerRef = useRef<HTMLDivElement | null>(null);

  const formattedDate = new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());

  useEffect(() => {
    if (!isDropdownOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownContainerRef.current &&
        !dropdownContainerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDropdownOpen]);

  function handleLogout() {
    setIsDropdownOpen(false);
    logout();
    navigate("/login", { replace: true });
  }

  const userEmail =
    user?.email || (user ? getDefaultEmailForRole(user.rol) : "");

  return (
    <header className="navbar h-[74px] bg-white/80 backdrop-blur-md border-b border-[#E8EDF5]">
      <div className="search">
        Buscar en el sistema <kbd>⌘ K</kbd>
      </div>

      <div className="navbar-right">
        <span className="today">Hoy, {formattedDate}</span>

        {user && (
          <div className="profile-dropdown-wrapper" ref={dropdownContainerRef}>
            <button
              type="button"
              className="profile"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              aria-expanded={isDropdownOpen}
              aria-haspopup="menu"
            >
              <span className="avatar">{getInitials(user.nombre)}</span>
              <span>
                <strong>{user.nombre}</strong>
                <small>{formatRoleLabel(user.rol)}</small>
              </span>
              <span className="profile-caret" aria-hidden="true">
                ▾
              </span>
            </button>

            {isDropdownOpen && (
              <div
                className="profile-dropdown-menu bg-white border border-[#E8EDF5] rounded-[12px]"
                role="menu"
                aria-label="Menú de usuario"
              >
                <div className="profile-dropdown-header">
                  <strong className="text-[#17233D]">{user.nombre}</strong>
                  <small className="text-[#75819A]">{userEmail}</small>
                  <span className="profile-role-badge bg-[#E9F1FF] text-[#0F52BA]">
                    {formatRoleLabel(user.rol)}
                  </span>
                </div>

                {user.rol === RoleEnum.ADMIN && (
                  <>
                    <div className="profile-dropdown-divider" />
                    <Link
                      to="/app/users"
                      className="profile-dropdown-item text-[#17233D]"
                      role="menuitem"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <span>Gestión de usuarios</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  </>
                )}

                <div className="profile-dropdown-divider" />

                <button
                  type="button"
                  className="profile-dropdown-item profile-logout-btn text-[#EF4444]"
                  role="menuitem"
                  onClick={handleLogout}
                >
                  <span>Cerrar sesión</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
