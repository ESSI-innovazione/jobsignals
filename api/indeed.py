from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json
import os
import sys

# Vercel runs this handler from /var/task with only that directory on
# sys.path, so the sibling _lib_indeed module can't be imported by bare name
# (ModuleNotFoundError at cold start → 500). Add this file's own directory
# (…/api) to the path. Under pytest, pythonpath=api already covers it — this
# makes the deploy runtime and the test runtime agree.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from _lib_indeed import to_job_results

try:
    from jobspy import scrape_jobs
except Exception:  # keep the module importable even if the dep is absent
    scrape_jobs = None


def search_indeed(query: str, where: str, limit: int = 50) -> list[dict]:
    if scrape_jobs is None:
        raise RuntimeError("python-jobspy not installed")
    df = scrape_jobs(
        site_name=["indeed"],
        search_term=query,
        location=where,
        country_indeed="Italy",
        results_wanted=limit,
    )
    rows = df.to_dict("records") if df is not None else []
    return to_job_results(rows)


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        params = parse_qs(urlparse(self.path).query)
        q = (params.get("q", [""])[0] or "").strip()
        where = (params.get("where", ["Italia"])[0] or "Italia").strip()
        try:
            limit = int(params.get("limit", ["50"])[0])
        except ValueError:
            limit = 50
        limit = max(1, min(limit, 50))
        try:
            results = search_indeed(q, where, limit) if q else []
            payload = {"results": results, "source": "indeed"}
        except Exception as exc:  # never 500 the whole search
            payload = {"results": [], "source": "indeed", "error": str(exc)}
        body = json.dumps(payload).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body)
