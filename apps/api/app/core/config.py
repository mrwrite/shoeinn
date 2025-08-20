from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./dev.db"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    jwt_secret: str = "changeme"
    allowed_origins: str = "*"

    class Config:
        env_file = ".env"


settings = Settings()
