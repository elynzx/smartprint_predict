import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { RoleEnum } from "../../../types";
import { useAuth } from "../hooks/useAuth";

export function LoginForm() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (user) {
    return (
      <Navigate
        to={
          user.rol === RoleEnum.COMMERCIAL
            ? "/disponibilidad"
            : "/app/dashboard"
        }
        replace
      />
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const loggedUser = await login(email, password);
      navigate(
        loggedUser.rol === RoleEnum.COMMERCIAL
          ? "/disponibilidad"
          : "/app/dashboard",
        { replace: true },
      );
    } catch (reason: unknown) {
      setError(
        reason instanceof Error ? reason.message : "No se pudo iniciar sesión.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
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
        <button
          className="primary-button"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </main>
  );
}
