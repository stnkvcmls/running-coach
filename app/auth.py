import json
import logging
import time

import httpx
import jwt
from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User

logger = logging.getLogger(__name__)

_jwks_cache: dict = {}
_jwks_fetched_at: float = 0
_JWKS_TTL = 3600  # seconds


def _get_jwks() -> dict:
    global _jwks_cache, _jwks_fetched_at
    now = time.time()
    if _jwks_cache and (now - _jwks_fetched_at) < _JWKS_TTL:
        return _jwks_cache
    url = f"https://{settings.cf_access_team_domain}/cdn-cgi/access/certs"
    resp = httpx.get(url, timeout=10)
    resp.raise_for_status()
    _jwks_cache = resp.json()
    _jwks_fetched_at = now
    return _jwks_cache


def verify_cf_access_jwt(token: str) -> str:
    """Verify a Cloudflare Access JWT and return the verified email claim."""
    jwks = _get_jwks()
    try:
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        public_key = None
        for k in jwks.get("keys", []):
            if k.get("kid") == kid:
                public_key = jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(k))
                break
        if public_key is None:
            raise HTTPException(status_code=401, detail="Unknown JWT key ID")
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            audience=settings.cf_access_aud,
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="JWT expired")
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail=f"Invalid JWT: {exc}")

    email = payload.get("email")
    if not email:
        raise HTTPException(status_code=401, detail="JWT missing email claim")
    return email


def _upsert_user(db: Session, email: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        user = User(email=email)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """FastAPI dependency: resolve the authenticated user for the current request.

    When auth_enabled=False (dev/CI), falls back to a synthetic dev user so
    the test suite and local runs work without a Cloudflare dependency.
    """
    if not settings.auth_enabled:
        email = settings.dev_user_email or settings.garmin_email or "dev@localhost"
        return _upsert_user(db, email)

    token = request.headers.get("Cf-Access-Jwt-Assertion")
    if not token:
        raise HTTPException(status_code=401, detail="Missing Cf-Access-Jwt-Assertion header")

    email = verify_cf_access_jwt(token)
    return _upsert_user(db, email)
