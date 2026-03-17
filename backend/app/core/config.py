from pathlib import Path
from dataclasses import dataclass
from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[2]
ENV_FILE = BASE_DIR / ".env"


@dataclass(frozen=True)
class SMTPProviderConfig:
    name: str
    host: str
    port: int
    username: str
    password: str
    from_email: str
    use_tls: bool
    use_ssl: bool


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )

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
    smtp_fallback_enabled: bool = Field(default=False, alias="SMTP_FALLBACK_ENABLED")
    smtp_fallback_host: str = Field(default="", alias="SMTP_FALLBACK_HOST")
    smtp_fallback_port: int = Field(default=587, alias="SMTP_FALLBACK_PORT")
    smtp_fallback_username: str = Field(default="", alias="SMTP_FALLBACK_USERNAME")
    smtp_fallback_password: str = Field(default="", alias="SMTP_FALLBACK_PASSWORD")
    smtp_fallback_from: str = Field(default="", alias="SMTP_FALLBACK_FROM")
    smtp_fallback_use_tls: bool = Field(default=True, alias="SMTP_FALLBACK_USE_TLS")
    smtp_fallback_use_ssl: bool = Field(default=False, alias="SMTP_FALLBACK_USE_SSL")

    object_storage_endpoint: str = Field(default="", alias="OBJECT_STORAGE_ENDPOINT")
    object_storage_bucket: str = Field(default="", alias="OBJECT_STORAGE_BUCKET")
    object_storage_access_key: str = Field(default="", alias="OBJECT_STORAGE_ACCESS_KEY")
    object_storage_secret_key: str = Field(default="", alias="OBJECT_STORAGE_SECRET_KEY")

    openai_api_key: str = Field(default="", alias="OPENAI_API_KEY")
    openai_base_url: str = Field(default="", alias="OPENAI_BASE_URL")
    deepseek_api_key: str = Field(default="", alias="DEEPSEEK_API_KEY")
    deepseek_base_url: str = Field(default="https://api.deepseek.com", alias="DEEPSEEK_BASE_URL")
    embedding_provider: str = Field(default="openai", alias="EMBEDDING_PROVIDER")
    embedding_api_key: str = Field(default="", alias="EMBEDDING_API_KEY")
    embedding_base_url: str = Field(default="", alias="EMBEDDING_BASE_URL")
    embedding_model: str = Field(default="text-embedding-3-small", alias="EMBEDDING_MODEL")
    embedding_dimensions: int = Field(default=256, alias="EMBEDDING_DIMENSIONS")
    chat_provider: str = Field(default="openai", alias="CHAT_PROVIDER")
    chat_model: str = Field(default="gpt-4o-mini", alias="CHAT_MODEL")
    deepseek_chat_model: str = Field(default="deepseek-chat", alias="DEEPSEEK_CHAT_MODEL")
    chat_temperature: float = Field(default=0.3, alias="CHAT_TEMPERATURE")

    @property
    def cors_origins(self) -> list[str]:
        return [item.strip() for item in self.app_cors_origins.split(",") if item.strip()]

    @property
    def database_url_sync(self) -> str:
        return self.database_url.replace("+asyncpg", "+psycopg")

    @property
    def smtp_providers(self) -> list[SMTPProviderConfig]:
        providers: list[SMTPProviderConfig] = []

        if self.smtp_enabled and self.smtp_host and self.smtp_from:
            providers.append(
                SMTPProviderConfig(
                    name="primary",
                    host=self.smtp_host,
                    port=self.smtp_port,
                    username=self.smtp_username,
                    password=self.smtp_password,
                    from_email=self.smtp_from,
                    use_tls=self.smtp_use_tls,
                    use_ssl=self.smtp_use_ssl,
                )
            )

        if self.smtp_enabled and self.smtp_fallback_enabled and self.smtp_fallback_host:
            providers.append(
                SMTPProviderConfig(
                    name="fallback",
                    host=self.smtp_fallback_host,
                    port=self.smtp_fallback_port,
                    username=self.smtp_fallback_username,
                    password=self.smtp_fallback_password,
                    from_email=self.smtp_fallback_from or self.smtp_from,
                    use_tls=self.smtp_fallback_use_tls,
                    use_ssl=self.smtp_fallback_use_ssl,
                )
            )

        return providers

    @property
    def effective_ai_api_key(self) -> str:
        if self.chat_provider == "deepseek":
            return self.deepseek_api_key or self.openai_api_key
        return self.openai_api_key or self.deepseek_api_key

    @property
    def effective_ai_base_url(self) -> str:
        if self.chat_provider == "deepseek":
            return self.deepseek_base_url or self.openai_base_url
        return self.openai_base_url or self.deepseek_base_url

    @property
    def effective_chat_model(self) -> str:
        if self.chat_provider == "deepseek":
            return self.deepseek_chat_model or self.chat_model
        return self.chat_model or self.deepseek_chat_model

    @property
    def effective_embedding_api_key(self) -> str:
        return self.embedding_api_key or self.openai_api_key

    @property
    def effective_embedding_base_url(self) -> str:
        return self.embedding_base_url or self.openai_base_url


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
