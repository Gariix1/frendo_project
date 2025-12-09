import os
import secrets
import string
from typing import List, Dict, Any, Optional

try:
    import bcrypt  # type: ignore
except ImportError as exc:  # pragma: no cover
    raise RuntimeError("bcrypt is required; install with 'pip install bcrypt'.") from exc


def generate_game_id(length: int = 6) -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def generate_token(nbytes: int = 16) -> str:
    # URL-safe token
    return secrets.token_urlsafe(nbytes)


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(password: str, stored_hash: str) -> bool:
    if stored_hash.startswith("$2"):
        try:
            return bcrypt.checkpw(password.encode("utf-8"), stored_hash.encode("utf-8"))
        except Exception:
            return False
    if stored_hash.startswith("sha256:"):
        import hashlib

        return stored_hash == "sha256:" + hashlib.sha256(password.encode("utf-8")).hexdigest()
    return False


def derangement_assignment(ids: List[str]) -> Dict[str, str]:
    """Return a mapping id -> assigned_id with no self-assignments.
    Simple shuffle-with-retry suitable for small N.
    Raises ValueError if not possible (N < 2).
    """
    n = len(ids)
    if n < 2:
        raise ValueError("At least 2 participants required for derangement")
    for _ in range(1000):
        shuffled = ids.copy()
        secrets.SystemRandom().shuffle(shuffled)
        if all(a != b for a, b in zip(ids, shuffled)):
            return {a: b for a, b in zip(ids, shuffled)}
    # Last resort: perform a simple fix by swapping a conflicting pair
    shuffled = ids.copy()
    secrets.SystemRandom().shuffle(shuffled)
    for i in range(n):
        if ids[i] == shuffled[i]:
            j = (i + 1) % n
            shuffled[i], shuffled[j] = shuffled[j], shuffled[i]
    if any(ids[i] == shuffled[i] for i in range(n)):
        raise RuntimeError("Failed to compute derangement")
    return {a: b for a, b in zip(ids, shuffled)}


def get_share_base_url(origin: Optional[str] = None) -> str:
    """Return the base URL used to build share links.
    Priority: explicit env -> provided origin -> localhost fallback.
    """
    base = os.getenv("SHARE_BASE_URL")
    if base:
        return base
    if origin:
        return origin
    return "http://localhost:5173"
