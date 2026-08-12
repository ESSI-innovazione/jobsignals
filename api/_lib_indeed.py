import hashlib
from typing import Any, Optional


def job_id(source: str, url: str) -> str:
    return hashlib.sha1(f"{source}|{url}".encode("utf-8")).hexdigest()[:16]


def _s(v: Any) -> str:
    if v is None:
        return ""
    s = str(v).strip()
    return "" if s.lower() == "nan" else s


def _salary(row: dict[str, Any]) -> Optional[str]:
    lo, hi = _s(row.get("min_amount")), _s(row.get("max_amount"))
    cur = _s(row.get("currency"))
    if lo and hi:
        base = f"{lo} - {hi}"
    elif lo or hi:
        base = lo or hi
    else:
        return None
    return f"{base} {cur}".strip() if cur else base


def _location(row: dict[str, Any]) -> str:
    loc = _s(row.get("location"))
    if loc:
        return loc
    parts = [_s(row.get("city")), _s(row.get("state")), _s(row.get("country"))]
    return ", ".join(p for p in parts if p)


def to_job_results(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    for row in rows:
        url = _s(row.get("job_url"))
        if not url:
            continue
        results.append(
            {
                "id": job_id("indeed", url),
                "title": _s(row.get("title")),
                "company": _s(row.get("company")),
                "location": _location(row),
                "source": "indeed",
                "url": url,
                "snippet": _s(row.get("description"))[:400],
                "salary": _salary(row),
                "postedAt": _s(row.get("date_posted")) or None,
            }
        )
    return results
