from typing import Annotated

from fastapi import APIRouter, Body, Form, HTTPException, Request, status
from pydantic import ValidationError
from sqlalchemy import select

from app.core.deps import DbSession
from app.core.security import create_access_token, verify_password
from app.models.usuario import Usuario
from app.schemas.auth import LoginRequest, LoginResponse, UserResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
async def login(
    request: Request,
    db: DbSession,
    body: Annotated[LoginRequest | None, Body()] = None,
    form_email: Annotated[str | None, Form(alias="email")] = None,
    form_password: Annotated[str | None, Form(alias="password")] = None,
) -> LoginResponse:
    del body, form_email, form_password
    content_type = request.headers.get("content-type", "")
    try:
        if content_type.startswith("application/json"):
            credentials = LoginRequest.model_validate(await request.json())
        else:
            form = await request.form()
            credentials = LoginRequest(
                email=str(form.get("email", "")),
                password=str(form.get("password", "")),
            )
    except (ValidationError, ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None

    user = db.scalar(select(Usuario).where(Usuario.email == credentials.email))
    if user is None or not user.activo or not verify_password(
        credentials.password, user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(str(user.id), user.rol.value)
    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=user.id, nombre=user.nombre, email=user.email, rol=user.rol
        ),
    )
