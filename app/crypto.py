"""Symmetric encryption for at-rest secrets (per-user Garmin passwords).

Uses Fernet (AES-128-CBC + HMAC) keyed by ``settings.encryption_key``. The key
is generated once and must stay stable across restarts/migrations — rotating or
losing it makes stored passwords undecryptable and forces every user to
reconnect Garmin (no training data is lost). Generate one with::

    python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
"""

from cryptography.fernet import Fernet

from app.config import settings


def is_configured() -> bool:
    """True when an encryption key is set, so credentials can be stored."""
    return bool(settings.encryption_key)


def _fernet() -> Fernet:
    key = settings.encryption_key
    if not key:
        raise RuntimeError(
            "encryption_key (ENCRYPTION_KEY) is not configured; cannot "
            "encrypt/decrypt Garmin credentials."
        )
    return Fernet(key.encode() if isinstance(key, str) else key)


def encrypt(plaintext: str) -> str:
    """Encrypt a string, returning URL-safe base64 ciphertext."""
    return _fernet().encrypt(plaintext.encode()).decode()


def decrypt(ciphertext: str) -> str:
    """Decrypt ciphertext produced by :func:`encrypt`."""
    return _fernet().decrypt(ciphertext.encode()).decode()
