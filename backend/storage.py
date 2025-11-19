import json
import os
import sqlite3
import threading
from contextlib import contextmanager
from typing import Iterator

from .types import AppState

DATA_DIR = os.path.join(os.path.dirname(__file__))
JSON_FALLBACK = os.path.join(DATA_DIR, "data.json")
DB_PATH = os.path.join(DATA_DIR, "data.sqlite")

_lock = threading.Lock()


def _ensure_data_dir() -> None:
    os.makedirs(DATA_DIR, exist_ok=True)


def _connect() -> sqlite3.Connection:
    _ensure_data_dir()
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    return conn


def _init_db(conn: sqlite3.Connection) -> None:
    conn.execute(
        "CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL)"
    )
    conn.commit()


def _read_kv(conn: sqlite3.Connection, key: str) -> str | None:
    cur = conn.execute("SELECT value FROM kv WHERE key = ?", (key,))
    row = cur.fetchone()
    return row[0] if row else None


def _write_kv(conn: sqlite3.Connection, key: str, value: str) -> None:
    conn.execute(
        "INSERT INTO kv(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
        (key, value),
    )
    conn.commit()


def _default_state() -> AppState:
    return {"games": {}, "people": []}


def _migrate_from_json(conn: sqlite3.Connection) -> AppState:
    if not os.path.exists(JSON_FALLBACK):
        return _default_state()
    try:
        with open(JSON_FALLBACK, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception:
        data = _default_state()
    # write and keep json as backup (no delete)
    try:
        _write_kv(conn, "state", json.dumps(data, ensure_ascii=False, separators=(",", ":")))
    except Exception:
        pass
    return data


def _load_from_conn(conn: sqlite3.Connection) -> AppState:
    raw = _read_kv(conn, "state")
    if raw is None:
        data = _migrate_from_json(conn)
    else:
        try:
            data = json.loads(raw)
        except Exception:
            data = _default_state()
    if "games" not in data:
        data["games"] = {}
    if "people" not in data:
        data["people"] = []
    return data


def load_state() -> AppState:
    _ensure_data_dir()
    conn = _connect()
    try:
        _init_db(conn)
        return _load_from_conn(conn)
    finally:
        conn.close()


@contextmanager
def edit_state() -> Iterator[AppState]:
    _ensure_data_dir()
    with _lock:
        conn = _connect()
        try:
            _init_db(conn)
            state = _load_from_conn(conn)
            yield state
            payload = json.dumps(state, ensure_ascii=False, separators=(",", ":"))
            _write_kv(conn, "state", payload)
            try:
                with open(JSON_FALLBACK + ".bak", "w", encoding="utf-8") as f:
                    f.write(payload)
            except Exception:
                pass
        finally:
            conn.close()
