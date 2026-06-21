from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    garmin_email: str = ""
    garmin_password: str = ""
    anthropic_api_key: str = ""
    gemini_api_key: str = ""
    timezone: str = "UTC"
    db_path: str = "/data/running_coach.db"
    garmin_token_dir: str = "/data/garmin_tokens"
    activity_poll_minutes: int = 5
    daily_sync_hour: int = 7
    # Each daily run syncs today plus the prior (window-1) days, so last night's
    # overnight stats land on the wake-up day while earlier days' full-day totals
    # finalize the morning after.
    daily_sync_window_days: int = 3
    ai_model: str = "claude-sonnet-4-6"

    # Auth / multi-user
    auth_enabled: bool = False
    cf_access_team_domain: str = ""  # e.g. "myteam.cloudflareaccess.com"
    cf_access_aud: str = ""          # AUD tag from Cloudflare Access app
    dev_user_email: str = ""         # fallback identity when auth_enabled=False
    encryption_key: str = ""         # Fernet key for storing Garmin passwords (Phase 2)

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
