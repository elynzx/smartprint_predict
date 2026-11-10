from pydantic import BaseModel, EmailStr

from app.models.usuario import RolEnum


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    nombre: str
    email: EmailStr
    rol: RolEnum


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
