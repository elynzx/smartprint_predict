from functools import lru_cache
from pathlib import Path
from typing import Annotated

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    """Configuración de la aplicación cargada desde variables de entorno."""

    app_name: str = "SmartPrint Predict API"
    database_url: str = Field(
        default="postgresql+psycopg://postgres:postgres@localhost:5432/smartprint_db",
        alias="DATABASE_URL",
    )
    secret_key: str = Field(
        default="change-this-secret-key-in-env",
        alias="SECRET_KEY",
    )
    environment: str = Field(default="development", alias="ENVIRONMENT")
    cors_origins: Annotated[list[str], Field(alias="CORS_ORIGINS")] = [
        "http://localhost:5173"
    ]

    model_config = SettingsConfigDict(
        env_file=BACKEND_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )


@lru_cache
def get_settings() -> Settings:
    """Devuelve una instancia cacheada de la configuración."""

    return Settings()


settings = get_settings()
