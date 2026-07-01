from pydantic_settings import BaseSettings

_DEFAULT_AVAILABLE_MODELS: dict[str, list[str]] = {
    "claude": ["claude-opus-4-8", "claude-opus-4-7", "claude-sonnet-4-6", "claude-haiku-4-5-20251001"],
    "gemini": [
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite",
        "gemini-3-flash",
        "gemini-3.1-flash-lite",
        "gemma-2-2b-it",
        "gemma-4-26b-it",
        "gemma-4-31b-it",
    ],
}


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
    # Overridable via AVAILABLE_MODELS env var as a JSON object, e.g.:
    # AVAILABLE_MODELS='{"claude": ["claude-opus-4-8"], "gemini": ["gemini-2.5-flash"]}'
    available_models: dict[str, list[str]] = _DEFAULT_AVAILABLE_MODELS

    # Auth / multi-user
    auth_enabled: bool = False
    cf_access_team_domain: str = ""  # e.g. "myteam.cloudflareaccess.com"
    cf_access_aud: str = ""          # AUD tag from Cloudflare Access app
    dev_user_email: str = ""         # fallback identity when auth_enabled=False
    encryption_key: str = ""         # Fernet key for storing Garmin passwords (Phase 2)
    # Network binding — used by the startup security guard to detect public exposure
    # without auth.  Must match the --host value passed to uvicorn.
    bind_host: str = "127.0.0.1"
    # Explicit opt-out for the startup security guard below — set this only if
    # you understand the risk (e.g. a trusted, firewalled private network) and
    # still want to run with auth disabled on a non-loopback bind.
    allow_insecure_bind: bool = False

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
