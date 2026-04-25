import os

from scripts.sushi_prices import (
    VALID_CITIES,
    aggregate_unit_prices,
    estimate_ingredient_price,
    price_sushi,
)

DEFAULT_LOCATION = "New York"

# Map canonical ingredient name (matches recipe keys) -> list of serper queries.
# Multiple queries per ingredient: serper returns a flaky slice of products on
# any single search; pooling samples across queries stabilises the median and
# makes it much more likely we get at least one weight-parsed ($/oz) sample.
INGREDIENT_QUERIES: dict[str, list[str]] = {
    "Nori": ["nori seaweed sheets", "sushi nori sheets"],
    "Rice": ["sushi rice", "short grain rice"],
    "Salmon": ["sushi grade salmon", "sashimi salmon fillet", "fresh salmon fillet"],
    "Tuna": ["sushi grade ahi tuna", "yellowfin tuna sashimi", "fresh tuna steak"],
    "Shrimp": ["raw shrimp", "fresh shrimp", "frozen shrimp"],
    "Tempura": ["tempura batter mix", "tempura flour"],
}

_caches: dict[str, dict] = {}
_skipped: dict[str, list[tuple[str, str]]] = {}


def list_locations() -> list[str]:
    return sorted(VALID_CITIES)


def is_loaded(location: str) -> bool:
    return location in _caches


def load_prices(location: str = DEFAULT_LOCATION) -> bool:
    if location not in VALID_CITIES:
        print(f"[pricing] unknown location: {location}")
        return False
    if location in _caches:
        return True

    api_key = os.environ.get("SERPER_API_KEY")
    if not api_key:
        print("[pricing] SERPER_API_KEY not set; skipping price prefetch")
        return False

    print(f"[pricing] fetching ingredient prices in {location}, NY...")
    all_results: dict = {}
    for canonical, queries in INGREDIENT_QUERIES.items():
        merged: list[dict] = []
        for query in queries:
            try:
                result = estimate_ingredient_price(query, location, api_key)
                merged.extend(result["samples"])
            except Exception as e:
                print(f"[pricing] {canonical} ({query}) failed: {type(e).__name__}: {e}")

        if not merged:
            print(f"[pricing] {canonical:<8} ({len(queries)} queries): NO SAMPLES")
            continue

        merged_result = {"ingredient": canonical, "samples": merged}
        all_results[canonical] = merged_result
        up = aggregate_unit_prices(merged_result)
        parts = []
        if up["per_oz"] is not None:
            parts.append(f"${up['per_oz']:.3f}/oz n={up['n_oz']}")
        if up["per_count"] is not None:
            parts.append(f"${up['per_count']:.3f}/ct n={up['n_count']}")
        summary = " | ".join(parts) if parts else "no usable parses"
        print(f"[pricing] {canonical:<8} ({len(merged)} pooled samples): {summary}")

    makeable, _unit, skipped = price_sushi(all_results)
    _caches[location] = {name.lower(): info for name, info in makeable.items()}
    _skipped[location] = skipped
    print(f"[pricing] [{location}] priced {len(_caches[location])} sushi types, skipped {len(skipped)}")
    for name, reason in skipped:
        print(f"[pricing]   - {name}: {reason}")
    return True


def price_plate(counts: list[dict], location: str = DEFAULT_LOCATION) -> dict:
    if location not in _caches:
        load_prices(location)
    cache = _caches.get(location)
    if cache is None:
        return {"available": False, "total": None, "breakdown": [], "location": location}

    breakdown: list[dict] = []
    total = 0.0
    for c in counts:
        key = c["display"].lower()
        info = cache.get(key)
        qty = c["count"]
        if info is None:
            breakdown.append({
                "display": c["display"],
                "count": qty,
                "price_per_piece": None,
                "subtotal": None,
            })
            continue
        per_piece = info["price_per_piece"]
        subtotal = per_piece * qty
        breakdown.append({
            "display": c["display"],
            "count": qty,
            "price_per_piece": per_piece,
            "subtotal": subtotal,
        })
        total += subtotal

    return {
        "available": True,
        "total": round(total, 2),
        "breakdown": breakdown,
        "location": location,
    }
