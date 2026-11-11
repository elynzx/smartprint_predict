import { useEffect, useState } from "react";
import { getDisponibilidad, type DisponibilidadItem } from "../api";
import { useAuth } from "../context/AuthContext";

export function Availability() {
  const { token } = useAuth();
  const [items, setItems] = useState<DisponibilidadItem[]>([]);
  useEffect(() => {
    if (token)
      getDisponibilidad(token)
        .then(setItems)
        .catch(() => setItems([]));
  }, [token]);
  return (
    <>
      <h1>Factibilidad comercial</h1>
      <p className="muted">
        Consulta cualitativa de disponibilidad para tus proyectos.
      </p>
      <div className="availability-grid">
        {items.map((item) => (
          <article className="availability-card" key={item.insumo_id}>
            <span
              className={
                item.estado_disponibilidad === "Disponible"
                  ? "status good"
                  : "status warning"
              }
            >
              {item.estado_disponibilidad}
            </span>
            <h2>{item.nombre}</h2>
            <p>
              {item.unidad} · {item.observacion_comercial}
            </p>
          </article>
        ))}
      </div>
    </>
  );
}
