import { useAuth } from "../context/AuthContext";

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function Navbar() {
  const { user, logout } = useAuth();
  const date = new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <header className="navbar">
      <div className="search">
        Buscar en el sistema <kbd>⌘ K</kbd>
      </div>
      <div className="navbar-right">
        <span className="today">Hoy, {date}</span>
        {user && (
          <button className="profile" onClick={logout} title="Cerrar sesión">
            <span className="avatar">{initials(user.nombre)}</span>
            <span>
              <strong>{user.nombre}</strong>
              <small>{user.rol}</small>
            </span>
          </button>
        )}
      </div>
    </header>
  );
}
