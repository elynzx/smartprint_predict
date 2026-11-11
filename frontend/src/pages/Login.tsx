import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (user)
    return (
      <Navigate
        to={user.rol === "asesor_comercial" ? "/disponibilidad" : "/app"}
        replace
      />
    );

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const loggedUser = await login(email, password);
      navigate(
        loggedUser.rol === "asesor_comercial" ? "/disponibilidad" : "/app",
        { replace: true },
      );
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "No se pudo iniciar sesión.",
      );
    }
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="brand login-brand">
          <span className="brand-mark">R</span>
          <span>
            <strong>RESEP</strong>
            <small>
              SmartPrint <b>Predict</b>
            </small>
          </span>
        </div>
        <h1>Iniciar sesión</h1>
        <p>Accede al sistema de gestión inteligente.</p>
        <label>
          Correo electrónico
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {error && <div className="error">{error}</div>}
        <button className="primary-button" type="submit">
          Ingresar
        </button>
      </form>
    </main>
  );
}
