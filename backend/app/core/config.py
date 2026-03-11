from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = Field(default="flypy-typing-backend", alias="APP_NAME")
    app_env: str = Field(default="development", alias="APP_ENV")
    app_host: str = Field(default="0.0.0.0", alias="APP_HOST")
    app_port: int = Field(default=8000, alias="APP_PORT")
    app_debug: bool = Field(default=True, alias="APP_DEBUG")
    app_cors_origins: str = Field(default="http://localhost:5173", alias="APP_CORS_ORIGINS")

    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/flypy_typing",
        alias="DATABASE_URL",
    )
    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")

    jwt_secret: str = Field(default="change-me", alias="JWT_SECRET")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(default=120, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    refresh_token_expire_minutes: int = Field(default=10080, alias="REFRESH_TOKEN_EXPIRE_MINUTES")

    smtp_enabled: bool = Field(default=False, alias="SMTP_ENABLED")
    smtp_host: str = Field(default="", alias="SMTP_HOST")
    smtp_port: int = Field(default=587, alias="SMTP_PORT")
    smtp_username: str = Field(default="", alias="SMTP_USERNAME")
    smtp_password: str = Field(default="", alias="SMTP_PASSWORD")
    smtp_from: str = Field(default="noreply@example.com", alias="SMTP_FROM")
    smtp_use_tls: bool = Field(default=True, alias="SMTP_USE_TLS")
    smtp_use_ssl: bool = Field(default=False, alias="SMTP_USE_SSL")
    smtp_timeout_seconds: int = Field(default=15, alias="SMTP_TIMEOUT_SECONDS")
    smtp_subject_prefix: str = Field(default="[Flypy] ", alias="SMTP_SUBJECT_PREFIX")

    object_storage_endpoint: str = Field(default="", alias="OBJECT_STORAGE_ENDPOINT")
    object_storage_bucket: str = Field(default="", alias="OBJECT_STORAGE_BUCKET")
    object_storage_access_key: str = Field(default="", alias="OBJECT_STORAGE_ACCESS_KEY")
    object_storage_secret_key: str = Field(default="", alias="OBJECT_STORAGE_SECRET_KEY")

    openai_api_key: str = Field(default="", alias="OPENAI_API_KEY")
    embedding_provider: str = Field(default="openai", alias="EMBEDDING_PROVIDER")
    chat_provider: str = Field(default="openai", alias="CHAT_PROVIDER")

    @property
    def cors_origins(self) -> list[str]:
        return [item.strip() for item in self.app_cors_origins.split(",") if item.strip()]

    @property
    def database_url_sync(self) -> str:
        return self.database_url.replace("+asyncpg", "+psycopg")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
