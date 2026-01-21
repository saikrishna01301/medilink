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
    # If candidate looks like inline JSON, skip path checks
    if candidate.startswith("{") and candidate.rstrip().endswith("}"):
        return None
    path = Path(candidate)
    if path.exists() and path.is_file():
        try:
            return path.read_text(encoding="utf-8")
        except OSError as exc:
            raise ValueError(
                f"Failed to read service account file at {path}: {exc}"
            ) from exc
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

    # Remove matching wrapping quotes (single or double) that often appear in .env files
    if (
        len(candidate) >= 2
        and candidate[0] in {"'", '"'}
        and candidate[-1] == candidate[0]
    ):
        candidate = candidate[1:-1].strip()

    if not candidate:
        return None

    # If it's a file path, read it.
    file_contents = _read_file_if_exists(candidate)
    if file_contents:
        return file_contents

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

    # Allow direct file path candidates. Skip candidates that look like
    # inline JSON (they'll be handled below) to avoid treating a JSON string
    # as a filesystem path which can raise OSError for long strings.
    for candidate in json_candidates:
        if not candidate:
            continue
        stripped = candidate.strip().strip('"').strip("'")
        # Quick heuristic: if it looks like JSON, skip path checks here
        if stripped.startswith("{") and stripped.rstrip().endswith("}"):
            continue
        # Otherwise treat as a potential path
        path = Path(stripped)
        if path.exists() and path.is_file():
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(path)
            return str(path)

    # Next, attempt to resolve inline JSON from provided candidates or the
    # GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable.
    fallback_env = os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON", "")
    info = load_service_account_info(*(json_candidates + (fallback_env,)))
    if not info:
        # If inline JSON wasn't provided, attempt to locate a JSON key file
        # in the project root or common locations. We try a few sensible
        # places so developers can drop a key at the repository root and
        # have it picked up automatically.
        project_key = _find_key_in_project_root()
        if project_key:
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(project_key)
            return str(project_key)
        return None

    temp_path = _write_temp_credentials(info, cache_key)
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = temp_path
    return temp_path


def _search_upwards_for_repo_root(start: Optional[Path] = None) -> Optional[Path]:
    """Walk upwards from start (or cwd) and return the first directory that
    appears to be the repository/project root. Heuristics: presence of
    .git, pyproject.toml, requirements.txt, package.json, or folders like
    'backend'/'frontend'."""
    if start is None:
        start = Path.cwd()

    candidates = [
        ".git",
        "pyproject.toml",
        "requirements.txt",
        "package.json",
        "backend",
        "frontend",
    ]
    current = start.resolve()
    for parent in [current] + list(current.parents):
        for marker in candidates:
            if (parent / marker).exists():
                return parent
    return None


def _find_key_in_project_root() -> Optional[Path]:
    """Search for common GCP key filenames in the project/root directories.

    Returns the Path to the first found key file or None.
    """
    filenames = [
        "gcp-key.json",
        "gcp_credentials.json",
        "service-account.json",
        "service_account.json",
        "google-credentials.json",
        "google-service-account.json",
        "credentials.json",
        "key.json",
        "gcp-key-credentials.json",
    ]

    # Check current working directory first, then attempt to find project root
    search_dirs = [Path.cwd()]
    repo_root = _search_upwards_for_repo_root()
    if repo_root and repo_root not in search_dirs:
        search_dirs.append(repo_root)

    # Also check the directory where this module lives (app/core -> app)
    module_root = Path(__file__).resolve().parents[2]
    if module_root not in search_dirs:
        search_dirs.append(module_root)

    for d in search_dirs:
        for name in filenames:
            candidate = d / name
            if candidate.exists() and candidate.is_file():
                try:
                    # Validate it's JSON
                    _ = json.loads(candidate.read_text(encoding="utf-8"))
                    return candidate
                except Exception:
                    # skip files that are not valid JSON
                    continue

    # As a last resort, look for any *.json file in the repo root that looks like a key
    if repo_root:
        for candidate in repo_root.glob("*.json"):
            try:
                data = json.loads(candidate.read_text(encoding="utf-8"))
                # basic heuristic: presence of 'private_key' and 'client_email'
                if (
                    isinstance(data, dict)
                    and "private_key" in data
                    and "client_email" in data
                ):
                    return candidate
            except Exception:
                continue

    return None


def as_inline_json(value: Dict[str, Any]) -> str:
    """Utility to serialize service-account info back to a JSON string."""
    return json.dumps(value)
