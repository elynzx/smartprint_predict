import os
import random
import sys
from datetime import datetime, timedelta, timezone

from passlib.context import CryptContext

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import Base, SessionLocal, engine
from app.models.insumo import Insumo
from app.models.movimiento import Movimiento, TipoMovimientoEnum
from app.models.usuario import RolEnum, Usuario

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def seed_database():
    print("🌱 Inicializando poblamiento de base de datos...")

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        db.query(Movimiento).delete()
        db.query(Insumo).delete()
        db.query(Usuario).delete()
        db.commit()

        print("Creando usuarios base...")
        admin_user = Usuario(
            nombre="Carlos Méndez",
            email="admin@resep.pe",
            password_hash=get_password_hash("Admin2026!"),
            rol=RolEnum.administrador,
            activo=True,
        )
        operario_user = Usuario(
            nombre="Juan Pérez (Almacén)",
            email="trabajador@resep.pe",
            password_hash=get_password_hash("Trabajador2026!"),
            rol=RolEnum.trabajador,
            activo=True,
        )
        ventas_user = Usuario(
            nombre="Ana Torres (Ejecutiva de Ventas)",
            email="ventas@resep.pe",
            password_hash=get_password_hash("Ventas2026!"),
            rol=RolEnum.asesor_comercial,
            activo=True,
        )
        db.add_all([admin_user, operario_user, ventas_user])
        db.commit()
        db.refresh(admin_user)
        db.refresh(operario_user)

        print("Creando catálogo de insumos de imprenta...")
        insumos_data = [
            {
                "nombre": "Papel couché 150g - A3",
                "unidad": "resmas",
                "stock_minimo": 350,
                "costo_unitario": 210.00,
                "categoria": "Papel",
                "base_daily_consumption": 18, 
            },
            {
                "nombre": "Tinta negra offset",
                "unidad": "litros",
                "stock_minimo": 20,
                "costo_unitario": 45.00,
                "categoria": "Tintas",
                "base_daily_consumption": 2.5,
            },
            {
                "nombre": "Plancha offset CTP",
                "unidad": "unidades",
                "stock_minimo": 10,
                "costo_unitario": 15.00,
                "categoria": "Planchas",
                "base_daily_consumption": 1.2,
            },
            {
                "nombre": "Papel bond 75g",
                "unidad": "resmas",
                "stock_minimo": 300,
                "costo_unitario": 120.00,
                "categoria": "Papel",
                "base_daily_consumption": 12,
            },
            {
                "nombre": "Tinta cian offset",
                "unidad": "litros",
                "stock_minimo": 15,
                "costo_unitario": 48.00,
                "categoria": "Tintas",
                "base_daily_consumption": 1.8,
            },
            {
                "nombre": "Solvente base lavado",
                "unidad": "litros",
                "stock_minimo": 25,
                "costo_unitario": 35.00,
                "categoria": "Químicos",
                "base_daily_consumption": 1.5,
            },
        ]

        insumos_creados = []
        for data in insumos_data:
            base_cons = data.pop("base_daily_consumption")
            insumo = Insumo(**data, stock_actual=0, activo=True)
            db.add(insumo)
            db.commit()
            db.refresh(insumo)
            insumos_creados.append((insumo, base_cons))

        print("Generando 60 días de historial de Kardex...")
        now = datetime.now(timezone.utc)
        start_date = now - timedelta(days=60)

        for insumo, base_consumption in insumos_creados:
            current_stock = 0

            initial_stock = int(base_consumption * 45)  # 45 días de inventario inicial
            mov_inicial = Movimiento(
                insumo_id=insumo.id,
                tipo=TipoMovimientoEnum.ENTRADA,
                cantidad=initial_stock,
                motivo="Inventario inicial de apertura de planta",
                documento_referencia="INIV-2026-001",
                observaciones="Carga masiva de inventario base",
                fecha_operacion=start_date,
                usuario_id=admin_user.id,
            )
            db.add(mov_inicial)
            current_stock += initial_stock

            for day_offset in range(1, 61):
                current_day = start_date + timedelta(days=day_offset)
                is_weekend = current_day.weekday() in [5, 6]  # Sábado o Domingo

                if day_offset in [20, 45]:
                    restock_qty = int(base_consumption * 25)
                    mov_restock = Movimiento(
                        insumo_id=insumo.id,
                        tipo=TipoMovimientoEnum.ENTRADA,
                        cantidad=restock_qty,
                        motivo="Ingreso por orden de compra programada",
                        proveedor="Papelera Andina S.A."
                        if "Papel" in insumo.categoria
                        else "Distribuidora Gráfica Peruana",
                        documento_referencia=f"OC-2026-0{day_offset}",
                        observaciones="Reposición de stock regular",
                        fecha_operacion=current_day,
                        usuario_id=admin_user.id,
                    )
                    db.add(mov_restock)
                    current_stock += restock_qty

                if (
                    not is_weekend or random.random() > 0.6
                ):  
                    daily_output = max(
                        1, int(random.gauss(base_consumption, base_consumption * 0.2))
                    )

                    if daily_output <= current_stock:
                        mov_salida = Movimiento(
                            insumo_id=insumo.id,
                            tipo=TipoMovimientoEnum.SALIDA,
                            cantidad=daily_output,
                            motivo="Despacho a taller de prensa offset",
                            documento_referencia=f"OT-2026-{1000 + day_offset}",
                            observaciones="Consumo operativo de producción",
                            fecha_operacion=current_day,
                            usuario_id=operario_user.id,
                        )
                        db.add(mov_salida)
                        current_stock -= daily_output

            insumo.stock_actual = current_stock
            db.add(insumo)

        db.commit()
        print(
            "✅ Base de datos poblada exitosamente con usuarios, insumos e historial de 60 días."
        )

    except Exception as e:
        db.rollback()
        print(f"Error al poblar la base de datos: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
