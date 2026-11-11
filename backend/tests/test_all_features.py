import os
import sys
from datetime import UTC, datetime, timedelta

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 1. Importar Base y modelos
from app.core.database import Base
from app.models.insumo import Insumo
from app.models.movimiento import Movimiento, TipoMovimientoEnum
from app.models.usuario import RolEnum, Usuario

# 2. Configurar SQLite en memoria compartida con StaticPool
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

from app.core.database import get_db
from app.core.security import get_password_hash
from main import app


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    admin = Usuario(
        id=1,
        nombre="Admin Test",
        email="admin@test.pe",
        password_hash=get_password_hash("testpass"),
        rol=RolEnum.administrador,
        activo=True,
    )
    ventas = Usuario(
        id=2,
        nombre="Ventas Test",
        email="ventas@test.pe",
        password_hash=get_password_hash("testpass"),
        rol=RolEnum.asesor_comercial,
        activo=True,
    )

    # Insumos de prueba
    insumo_con_consumo = Insumo(
        id=1,
        nombre="Papel couché test",
        unidad="resmas",
        stock_actual=100,
        stock_minimo=300,
        costo_unitario=200.0,
        categoria="Papel",
        activo=True,
    )
    insumo_sin_consumo = Insumo(
        id=2,
        nombre="Barniz UV Sin Uso",
        unidad="litros",
        stock_actual=50,
        stock_minimo=20,
        costo_unitario=80.0,
        categoria="Químicos",
        activo=True,
    )

    db.add_all([admin, ventas, insumo_con_consumo, insumo_sin_consumo])
    db.commit()

    # Historial de 30 días de salidas para Insumo 1
    now = datetime.now(UTC)
    for i in range(30, 0, -1):
        fecha_mov = now - timedelta(days=i)
        mov = Movimiento(
            insumo_id=1,
            tipo=TipoMovimientoEnum.SALIDA,
            cantidad=10,
            motivo="Despacho continuo a taller",
            fecha_operacion=fecha_mov,
            usuario_id=admin.id,
        )
        db.add(mov)

    db.commit()
    db.close()

    yield

    Base.metadata.drop_all(bind=engine)


def get_token_for(email: str):
    response = client.post(
        "/api/auth/login", json={"email": email, "password": "testpass"}
    )
    if response.status_code != 200:
        response = client.post(
            "/api/auth/login", data={"username": email, "password": "testpass"}
        )
    return response.json()["access_token"]


# --- 1. FRENO ANTINEGATIVO DE STOCK ---
def test_freno_antinegativo_stock():
    token = get_token_for("admin@test.pe")
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "insumo_id": 1,
        "tipo": "SALIDA",
        "cantidad": 150,
        "motivo": "Prueba de stock negativo",
        "documento_referencia": "OT-TEST",
    }

    response = client.post("/api/movimientos", json=payload, headers=headers)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    assert "Stock insuficiente" in str(response.json())


# --- 2. VISTA CUALITATIVA DE ASESOR COMERCIAL ---
def test_vista_cualitativa_asesor_comercial():
    token = get_token_for("ventas@test.pe")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/disponibilidad", headers=headers)
    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert len(data) > 0
    item = data[0]

    assert item["estado_disponibilidad"] in ["Disponible", "Stock Limitado"]
    assert "stock_actual" not in item
    assert "stock_minimo" not in item
    assert "costo_unitario" not in item


# --- 3. RBAC EN MOTOR PREDICTIVO ---
def test_rbac_prediccion_denegado_para_ventas():
    token = get_token_for("ventas@test.pe")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/prediccion/1?horizonte=30", headers=headers)
    assert response.status_code == status.HTTP_403_FORBIDDEN


# --- 4. CÁLCULO DE PREDICCIÓN Y MÉTRICAS ML ---
def test_calculo_prediccion_ml_exitoso():
    token = get_token_for("admin@test.pe")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/prediccion/1?horizonte=30", headers=headers)
    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert data["insumo_id"] == 1
    assert data["tasa_consumo_diaria"] > 0
    assert data["dias_cobertura"] is not None
    assert "mae" in data["metricas_error"]
    assert "rmse" in data["metricas_error"]


# --- 5. MANEJO DE INSUMO SIN CONSUMO ---
def test_prediccion_insumo_sin_consumo():
    token = get_token_for("admin@test.pe")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/prediccion/2?horizonte=30", headers=headers)
    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert data["insumo_id"] == 2
    assert data["tasa_consumo_diaria"] == 0.0
    assert data["dias_cobertura"] is None


# --- 6. FLUJO TRANSACCIONAL KARDEX EXITOSO ---
def test_flujo_transaccional_kardex_exitoso():
    token = get_token_for("admin@test.pe")
    headers = {"Authorization": f"Bearer {token}"}

    payload_entrada = {
        "insumo_id": 1,
        "tipo": "ENTRADA",
        "cantidad": 50,
        "motivo": "Reposición por OC",
        "documento_referencia": "OC-2026-99",
    }
    resp_entrada = client.post(
        "/api/movimientos", json=payload_entrada, headers=headers
    )
    assert resp_entrada.status_code == status.HTTP_200_OK
    assert resp_entrada.json()["saldo_resultante"] == 150

    payload_salida = {
        "insumo_id": 1,
        "tipo": "SALIDA",
        "cantidad": 30,
        "motivo": "Consumo para OT",
        "documento_referencia": "OT-2026-101",
    }
    resp_salida = client.post("/api/movimientos", json=payload_salida, headers=headers)
    assert resp_salida.status_code == status.HTTP_200_OK
    assert resp_salida.json()["saldo_resultante"] == 120
