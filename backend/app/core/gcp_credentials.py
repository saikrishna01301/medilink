import base64
import json
import os
import tempfile
from pathlib import Path
from threading import Lock
from typing import Any, Dict, Optional, Sequence

from google.oauth2 import service_account

_INFO_CACHE: Dict[str, Dict[str, Any]] = {}
_FILE_CACHE: Dict[str, str] = {}
_CACHE_LOCK = Lock()


def _read_file_if_exists(candidate: str) -> Optional[str]:
    candidate = candidate.strip().strip('"').strip("'")
    if not candidate:
        return None
    path = Path(candidate)
    if path.exists() and path.is_file():
        try:
            return path.read_text(encoding="utf-8")
        except OSError as exc:
            raise ValueError(f"Failed to read service account file at {path}: {exc}") from exc
    return None


def _maybe_base64_decode(value: str) -> Optional[str]:
    try:
        decoded = base64.b64decode(value, validate=True)
        text = decoded.decode("utf-8")
        if text.strip().startswith("{"):
            return text
    except Exception:
        return None
    return None


def _normalize_candidate(candidate: Optional[str]) -> Optional[str]:
    if not candidate:
        return None

    candidate = candidate.strip()
    if not candidate:
        return None

    # If it's a file path, read it.
    file_contents = _read_file_if_exists(candidate)
    if file_contents:
        return file_contents

    # Replace escaped newlines if necessary.
    if "\\n" in candidate and "\n" not in candidate:
        candidate = candidate.replace("\\n", "\n")

    if candidate.startswith("{") and candidate.rstrip().endswith("}"):
        return candidate

    decoded = _maybe_base64_decode(candidate)
    if decoded:
        return decoded

    return None


def _load_service_account_info_from_string(value: str) -> Dict[str, Any]:
    cache_key = hash(value)
    cached = _INFO_CACHE.get(cache_key)
    if cached:
        return cached

    try:
        parsed = json.loads(value)
    except json.JSONDecodeError as exc:
        raise ValueError("Service account JSON is not valid JSON") from exc

    if not isinstance(parsed, dict):
        raise ValueError("Service account JSON must decode to an object")

    _INFO_CACHE[cache_key] = parsed
    return parsed


def load_service_account_info(
    *candidates: Optional[str],
) -> Optional[Dict[str, Any]]:
    """
    Attempt to resolve service-account info from a series of candidates.

    Candidates can be:
      - Inline JSON strings
      - Base64-encoded JSON strings
      - File paths pointing to JSON files
    """
    for candidate in candidates:
        normalized = _normalize_candidate(candidate)
        if not normalized:
            continue
        return _load_service_account_info_from_string(normalized)
    return None


def build_service_account_credentials(
    *candidates: Optional[str],
    scopes: Optional[Sequence[str]] = None,
) -> Optional[service_account.Credentials]:
    info = load_service_account_info(*candidates)
    if not info:
        return None
    return service_account.Credentials.from_service_account_info(info, scopes=scopes)


def _ensure_temp_dir() -> Path:
    temp_dir = Path(tempfile.gettempdir()) / "medilink-google"
    temp_dir.mkdir(parents=True, exist_ok=True)
    return temp_dir


def _write_temp_credentials(info: Dict[str, Any], cache_key: str) -> str:
    temp_dir = _ensure_temp_dir()
    file_path = temp_dir / f"{cache_key}.json"

    with _CACHE_LOCK:
        cached_path = _FILE_CACHE.get(cache_key)
        if cached_path and Path(cached_path).exists():
            return cached_path

        file_path.write_text(json.dumps(info), encoding="utf-8")
        _FILE_CACHE[cache_key] = str(file_path)
        return str(file_path)


def ensure_application_default_credentials(
    *json_candidates: Optional[str],
    cache_key: str = "application-default",
) -> Optional[str]:
    """
    Ensure GOOGLE_APPLICATION_CREDENTIALS points to a valid JSON file.

    If the env var already references an existing file we leave it alone.
    Otherwise we try to resolve inline JSON from the provided candidates (or
    GOOGLE_APPLICATION_CREDENTIALS_JSON) and write it to a temp file.
    """
    existing_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "").strip()
    if existing_path and Path(existing_path).exists():
        return existing_path

    # Allow direct file path candidates.
    for candidate in json_candidates:
        if not candidate:
            continue
        path = Path(candidate.strip('"').strip("'"))
        if path.exists() and path.is_file():
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(path)
            return str(path)

    fallback_env = os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON", "")
    info = load_service_account_info(*(json_candidates + (fallback_env,)))
    if not info:
        return None

    temp_path = _write_temp_credentials(info, cache_key)
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = temp_path
    return temp_path


def as_inline_json(value: Dict[str, Any]) -> str:
    """Utility to serialize service-account info back to a JSON string."""
    return json.dumps(value)

