"""In-memory multiplayer tables. Resets on server restart — fine for a demo.

Threading note: Python's GIL serializes dict/list ops, so basic mutations are safe
under FastAPI's threadpool. Not safe for distributed deploys; phase 2 uses a real DB.
"""
import secrets
import time
import uuid
from typing import Optional


ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"  # avoid 0/O, 1/I/L confusion

_tables: dict[str, dict] = {}


def _gen_code() -> str:
    while True:
        code = "".join(secrets.choice(ALPHABET) for _ in range(6))
        if code not in _tables:
            return code


def _new_participant(name: str) -> dict:
    return {
        "id": str(uuid.uuid4()),
        "name": name.strip() or "Player",
        "joined_at": time.time(),
    }


def create_table(
    table_name: str,
    restaurant: str,
    city: str,
    ayce_price_per_person: float,
    tax_included: bool,
    tip_percent: float,
    host_name: str,
) -> tuple[dict, str]:
    code = _gen_code()
    host = _new_participant(host_name)
    table = {
        "code": code,
        "table_name": table_name,
        "restaurant": restaurant,
        "city": city,
        "ayce_price_per_person": ayce_price_per_person,
        "tax_included": tax_included,
        "tip_percent": tip_percent,
        "created_at": time.time(),
        "finished_at": None,
        "participants": [host],
        "captures": [],
    }
    _tables[code] = table
    return table, host["id"]


def get_table(code: str) -> Optional[dict]:
    return _tables.get(code.upper())


def join_table(code: str, name: str) -> tuple[Optional[dict], Optional[str]]:
    table = _tables.get(code.upper())
    if table is None:
        return None, None
    existing = next(
        (p for p in table["participants"] if p["name"].lower() == name.strip().lower()),
        None,
    )
    if existing:
        return table, existing["id"]
    p = _new_participant(name)
    table["participants"].append(p)
    return table, p["id"]


def add_capture(
    code: str,
    participant_id: str,
    total: int,
    counts: list,
    pricing: dict,
) -> Optional[dict]:
    table = _tables.get(code.upper())
    if table is None:
        return None
    if not any(p["id"] == participant_id for p in table["participants"]):
        return None
    table["captures"].append({
        "id": str(uuid.uuid4()),
        "participant_id": participant_id,
        "timestamp": time.time(),
        "total": total,
        "counts": counts,
        "pricing": pricing,
    })
    return table


def finish_table(code: str) -> Optional[dict]:
    table = _tables.get(code.upper())
    if table is None:
        return None
    if table["finished_at"] is None:
        table["finished_at"] = time.time()
    return table
