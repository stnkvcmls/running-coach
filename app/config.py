from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    garmin_email: str = ""
    garmin_password: str = ""
    anthropic_api_key: str = ""
    timezone: str = "UTC"
    db_path: str = "/data/running_coach.db"
    garmin_token_dir: str = "/data/garmin_tokens"
    activity_poll_minutes: int = 5
    daily_sync_hour: int = 7
    ai_model: str = "claude-sonnet-4-6"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
