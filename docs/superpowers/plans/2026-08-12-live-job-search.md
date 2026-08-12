# Live Job Search (Jooble + Indeed) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the home search bar to real, live job postings fetched on submit from the Jooble REST API and Indeed (via JobSpy), merged and rendered in the existing card style.

**Architecture:** A Next.js Node route handler (`/api/search`) fans out in parallel to two sources — Jooble (in-process `fetch`) and a Vercel Python function (`/api/indeed`, running JobSpy) — using `Promise.allSettled` so each source fails independently. Results are normalized to a shared `JobResult` shape, deduped, ranked, and returned as JSON; the home page fetches this on submit and renders result cards. Nothing is persisted.

**Tech Stack:** Next.js 16 (App Router) + TypeScript, Node runtime route handlers, Vercel Python function (`python-jobspy`), Vitest (TS unit tests), pytest (Python unit tests).

## Global Constraints

- Framework: **Next.js 16 App Router + TypeScript**. Route handlers use `export const runtime = "nodejs"` and `export const dynamic = "force-dynamic"`.
- **UI copy is Italian** (labels, empty/error states). Code/identifiers are English.
- All external posting links open in a **new tab**: `target="_blank" rel="noopener noreferrer"`.
- **No persistence** — live results are ephemeral; do not write to Supabase or sample-data.
- Default search location is **Italy** (`where=Italia`, JobSpy `country_indeed="Italy"`).
- Do **not** modify `vercel.json`'s framework override (production convention).
- `lib/jobs/*` modules import each other with **relative** paths (they use `node:crypto` and must never be pulled into a client bundle); the home client component only imports the **`JobResult` type** (type-only, erased at build).
- Do not touch `/posizioni`, `/gestione`, `/aziende`, `/notifiche`, or the cron — search only.

---

### Task 1: Test tooling + shared types

**Files:**
- Modify: `package.json` (add `test` script + `vitest` devDependency)
- Create: `vitest.config.ts`
- Create: `pytest.ini`
- Create: `lib/jobs/types.ts`
- Test: `lib/jobs/types.test.ts`

**Interfaces:**
- Produces:
  - `type JobSource = "jooble" | "indeed" | "linkedin" | "website"`
  - `interface JobResult { id: string; title: string; company: string; location: string; source: JobSource; url: string; snippet: string; salary?: string; postedAt?: string }`
  - `const jobSourceLabels: Record<JobSource, string>`

- [ ] **Step 1: Install Vitest**

Run: `npm install -D vitest`

- [ ] **Step 2: Add the test script**

In `package.json`, add to `"scripts"`:

```json
"test": "vitest run"
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
```

- [ ] **Step 4: Create `pytest.ini`** (used by Task 4)

```ini
[pytest]
pythonpath = api
testpaths = tests/python
```

- [ ] **Step 5: Write the failing test** — `lib/jobs/types.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { jobSourceLabels } from "./types";

describe("jobSourceLabels", () => {
  it("has an Italian-facing label for every source", () => {
    expect(jobSourceLabels.jooble).toBe("Jooble");
    expect(jobSourceLabels.indeed).toBe("Indeed");
    expect(jobSourceLabels.website).toBe("Sito aziendale");
    expect(jobSourceLabels.linkedin).toBe("LinkedIn");
  });
});
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `./types`.

- [ ] **Step 7: Create `lib/jobs/types.ts`**

```ts
export type JobSource = "jooble" | "indeed" | "linkedin" | "website";

export interface JobResult {
  id: string; // stable hash of source + url (dedupe / React key)
  title: string;
  company: string; // may be empty from some sources
  location: string;
  source: JobSource; // how we obtained it
  url: string; // original posting link (opens in a new tab)
  snippet: string; // short plain-text description
  salary?: string; // free-text, source-provided; often absent
  postedAt?: string; // ISO date (YYYY-MM-DD) if derivable
}

export const jobSourceLabels: Record<JobSource, string> = {
  jooble: "Jooble",
  indeed: "Indeed",
  linkedin: "LinkedIn",
  website: "Sito aziendale",
};
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json vitest.config.ts pytest.ini lib/jobs/types.ts lib/jobs/types.test.ts
git commit -m "test: add Vitest/pytest tooling and shared JobResult types"
```

---

### Task 2: Normalize — id, dedupe, rank

**Files:**
- Create: `lib/jobs/normalize.ts`
- Test: `lib/jobs/normalize.test.ts`

**Interfaces:**
- Consumes: `JobResult` from `./types`.
- Produces:
  - `jobId(source: string, url: string): string`
  - `dedupe(results: JobResult[]): JobResult[]` — collapses postings with the same normalized `title|company|location`, keeping the first.
  - `rank(query: string, results: JobResult[]): JobResult[]` — exact-title first, then all-query-words-in-title, then the rest; tie-break by `postedAt desc`.

- [ ] **Step 1: Write the failing test** — `lib/jobs/normalize.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { jobId, dedupe, rank } from "./normalize";
import type { JobResult } from "./types";

function make(p: Partial<JobResult>): JobResult {
  return {
    id: p.id ?? jobId(p.source ?? "jooble", p.url ?? "https://x/" + Math.random()),
    title: p.title ?? "Dev",
    company: p.company ?? "Acme",
    location: p.location ?? "Napoli",
    source: p.source ?? "jooble",
    url: p.url ?? "https://x",
    snippet: p.snippet ?? "",
    salary: p.salary,
    postedAt: p.postedAt,
  };
}

describe("jobId", () => {
  it("is stable and depends on source + url", () => {
    expect(jobId("indeed", "https://a")).toBe(jobId("indeed", "https://a"));
    expect(jobId("indeed", "https://a")).not.toBe(jobId("jooble", "https://a"));
  });
});

describe("dedupe", () => {
  it("collapses same title+company+location (case-insensitive), keeping the first", () => {
    const a = make({ url: "https://a", title: "AI Developer", company: "Acme", location: "Napoli", source: "jooble" });
    const b = make({ url: "https://b", title: "ai developer", company: "ACME", location: "napoli", source: "indeed" });
    const out = dedupe([a, b]);
    expect(out).toHaveLength(1);
    expect(out[0].url).toBe("https://a");
  });

  it("keeps distinct postings", () => {
    const a = make({ title: "AI Developer", company: "Acme" });
    const b = make({ title: "Data Engineer", company: "Acme" });
    expect(dedupe([a, b])).toHaveLength(2);
  });
});

describe("rank", () => {
  it("orders exact title, then all-words-in-title, then the rest", () => {
    const exact = make({ title: "AI Developer", postedAt: "2026-01-01" });
    const words = make({ title: "Senior AI Developer", postedAt: "2026-08-01" });
    const other = make({ title: "Data Engineer", postedAt: "2026-08-10" });
    const out = rank("AI Developer", [other, words, exact]);
    expect(out.map((r) => r.title)).toEqual(["AI Developer", "Senior AI Developer", "Data Engineer"]);
  });

  it("tie-breaks by postedAt desc within a tier", () => {
    const older = make({ title: "AI Developer Junior", postedAt: "2026-01-01" });
    const newer = make({ title: "AI Developer Senior", postedAt: "2026-08-01" });
    const out = rank("AI Developer", [older, newer]);
    expect(out.map((r) => r.title)).toEqual(["AI Developer Senior", "AI Developer Junior"]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `./normalize`.

- [ ] **Step 3: Create `lib/jobs/normalize.ts`**

```ts
import { createHash } from "node:crypto";
import type { JobResult } from "./types";

export function jobId(source: string, url: string): string {
  return createHash("sha1").update(`${source}|${url}`).digest("hex").slice(0, 16);
}

const norm = (s: string): string => (s ?? "").trim().toLowerCase();

function dedupeKey(r: JobResult): string {
  return createHash("sha1")
    .update(`${norm(r.title)}|${norm(r.company)}|${norm(r.location)}`)
    .digest("hex");
}

export function dedupe(results: JobResult[]): JobResult[] {
  const seen = new Map<string, JobResult>();
  for (const r of results) {
    const key = dedupeKey(r);
    if (!seen.has(key)) seen.set(key, r);
  }
  return [...seen.values()];
}

export function rank(query: string, results: JobResult[]): JobResult[] {
  const q = norm(query);
  const words = q.split(/\s+/).filter(Boolean);
  const tier = (r: JobResult): number => {
    const title = norm(r.title);
    if (title === q) return 0;
    if (words.length > 0 && words.every((w) => title.includes(w))) return 1;
    return 2;
  };
  return [...results].sort((a, b) => {
    const t = tier(a) - tier(b);
    if (t !== 0) return t;
    return (b.postedAt ?? "").localeCompare(a.postedAt ?? "");
  });
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/jobs/normalize.ts lib/jobs/normalize.test.ts
git commit -m "feat: job result id, dedupe, and relevance ranking"
```

---

### Task 3: Jooble client

**Files:**
- Create: `lib/jobs/jooble.ts`
- Test: `lib/jobs/jooble.test.ts`

**Interfaces:**
- Consumes: `JobResult` from `./types`; `jobId` from `./normalize`.
- Produces:
  - `stripHtml(s: string): string`
  - `mapJoobleJob(job: JoobleJob): JobResult`
  - `searchJooble(query: string, where: string, opts?: { apiKey?: string; signal?: AbortSignal }): Promise<JobResult[]>` — returns `[]` (no throw) when no API key; throws on non-2xx.

- [ ] **Step 1: Write the failing test** — `lib/jobs/jooble.test.ts`

```ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { stripHtml, mapJoobleJob, searchJooble } from "./jooble";

afterEach(() => vi.restoreAllMocks());

describe("stripHtml", () => {
  it("removes tags and collapses whitespace", () => {
    expect(stripHtml("<b>AI</b>   <i>Dev</i>")).toBe("AI Dev");
  });
});

describe("mapJoobleJob", () => {
  it("maps Jooble fields to JobResult", () => {
    const r = mapJoobleJob({
      title: "AI Developer",
      location: "Napoli",
      snippet: "<p>Great <b>role</b></p>",
      salary: "",
      source: "Indeed",
      type: "Full-time",
      link: "https://jooble.org/desc/1",
      company: "Acme",
      updated: "2026-08-11T10:00:00.0000000",
      id: 123,
    });
    expect(r).toMatchObject({
      title: "AI Developer",
      company: "Acme",
      location: "Napoli",
      source: "jooble",
      url: "https://jooble.org/desc/1",
      snippet: "Great role",
      postedAt: "2026-08-11",
    });
    expect(r.salary).toBeUndefined();
    expect(r.id).toHaveLength(16);
  });
});

describe("searchJooble", () => {
  it("returns [] and does not fetch when no API key", async () => {
    const spy = vi.spyOn(globalThis, "fetch");
    const out = await searchJooble("dev", "Italia", { apiKey: undefined });
    expect(out).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });

  it("POSTs to the keyed endpoint and maps jobs", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ jobs: [{ title: "Dev", link: "https://j/1", company: "Acme", location: "Roma", snippet: "hi", salary: "", updated: "2026-08-01T00:00:00" }] }), { status: 200 })
    );
    const out = await searchJooble("dev", "Italia", { apiKey: "KEY123" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://jooble.org/api/KEY123",
      expect.objectContaining({ method: "POST" })
    );
    expect(out).toHaveLength(1);
    expect(out[0].source).toBe("jooble");
  });

  it("throws on non-2xx", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("nope", { status: 403 }));
    await expect(searchJooble("dev", "Italia", { apiKey: "KEY123" })).rejects.toThrow(/403/);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `./jooble`.

- [ ] **Step 3: Create `lib/jobs/jooble.ts`**

```ts
import type { JobResult } from "./types";
import { jobId } from "./normalize";

const JOOBLE_ENDPOINT = "https://jooble.org/api";

export interface JoobleJob {
  title: string;
  location: string;
  snippet: string;
  salary: string;
  source?: string;
  type?: string;
  link: string;
  company: string;
  updated: string;
  id: number | string;
}

export function stripHtml(s: string): string {
  return (s ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function mapJoobleJob(job: JoobleJob): JobResult {
  return {
    id: jobId("jooble", job.link),
    title: job.title ?? "",
    company: job.company ?? "",
    location: job.location ?? "",
    source: "jooble",
    url: job.link,
    snippet: stripHtml(job.snippet ?? ""),
    salary: job.salary ? job.salary : undefined,
    postedAt: job.updated ? job.updated.slice(0, 10) : undefined,
  };
}

export async function searchJooble(
  query: string,
  where: string,
  opts: { apiKey?: string; signal?: AbortSignal } = {}
): Promise<JobResult[]> {
  const apiKey = "apiKey" in opts ? opts.apiKey : process.env.JOOBLE_API_KEY;
  if (!apiKey) {
    console.warn("[jooble] JOOBLE_API_KEY not set — skipping Jooble");
    return [];
  }
  const res = await fetch(`${JOOBLE_ENDPOINT}/${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keywords: query, location: where, page: 1, ResultOnPage: 50 }),
    signal: opts.signal,
  });
  if (!res.ok) throw new Error(`Jooble responded ${res.status}`);
  const data = (await res.json()) as { jobs?: JoobleJob[] };
  return (data.jobs ?? []).map(mapJoobleJob);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/jobs/jooble.ts lib/jobs/jooble.test.ts
git commit -m "feat: Jooble REST client with response mapping"
```

---

### Task 4: Indeed Python function (JobSpy)

**Files:**
- Create: `api/_lib_indeed.py` (pure normalizer, unit-tested)
- Create: `api/indeed.py` (Vercel HTTP handler)
- Create: `requirements.txt`
- Test: `tests/python/test_lib_indeed.py`

**Interfaces:**
- Produces (consumed by Task 5 over HTTP): `GET /api/indeed?q=<role>&where=<location>` → JSON `{ "results": JobResult[], "source": "indeed", "error"?: string }`. Each result has the exact `JobResult` field names/casing from Task 1 (`postedAt`, camelCase). The handler always returns HTTP 200 (errors surface in the `error` field so a source failure never 500s the search).
- `to_job_results(rows: list[dict]) -> list[dict]` and `job_id(source: str, url: str) -> str` in `_lib_indeed.py`.

- [ ] **Step 1: Write the failing test** — `tests/python/test_lib_indeed.py`

```python
from _lib_indeed import to_job_results, job_id


def test_job_id_is_stable_and_source_sensitive():
    assert job_id("indeed", "https://a") == job_id("indeed", "https://a")
    assert job_id("indeed", "https://a") != job_id("jooble", "https://a")


def test_to_job_results_maps_jobspy_rows():
    rows = [
        {
            "title": "AI Developer",
            "company": "Acme",
            "location": "Napoli, Campania",
            "job_url": "https://indeed.com/viewjob?jk=1",
            "description": "Great role in AI",
            "date_posted": "2026-08-11",
            "min_amount": 30000,
            "max_amount": 40000,
            "currency": "EUR",
        }
    ]
    out = to_job_results(rows)
    assert len(out) == 1
    r = out[0]
    assert r["title"] == "AI Developer"
    assert r["company"] == "Acme"
    assert r["source"] == "indeed"
    assert r["url"] == "https://indeed.com/viewjob?jk=1"
    assert r["postedAt"] == "2026-08-11"
    assert len(r["id"]) == 16
    assert r["salary"] == "30000 - 40000 EUR"


def test_to_job_results_skips_rows_without_url_and_handles_nan():
    rows = [
        {"title": "No URL", "job_url": None},
        {"title": "NaN salary", "job_url": "https://x", "min_amount": "nan", "max_amount": "nan"},
    ]
    out = to_job_results(rows)
    assert len(out) == 1
    assert out[0]["salary"] is None
```

- [ ] **Step 2: Install Python deps and run the test to verify it fails**

Run: `pip install python-jobspy pytest`
Run: `python -m pytest`
Expected: FAIL — `ModuleNotFoundError: No module named '_lib_indeed'`.

- [ ] **Step 3: Create `api/_lib_indeed.py`**

```python
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `python -m pytest`
Expected: PASS (3 tests).

- [ ] **Step 5: Create `api/indeed.py` (the HTTP handler)**

```python
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json

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
            results = search_indeed(q, where) if q else []
            payload = {"results": results, "source": "indeed"}
        except Exception as exc:  # never 500 the whole search
            payload = {"results": [], "source": "indeed", "error": str(exc)}
        body = json.dumps(payload).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body)
```

- [ ] **Step 6: Create `requirements.txt`**

```
python-jobspy==1.1.80
```

> Note: pin to the `python-jobspy` version installed in Step 2. Run `pip show python-jobspy` and use that exact version here so Vercel builds reproducibly.

- [ ] **Step 7: Commit**

```bash
git add api/_lib_indeed.py api/indeed.py requirements.txt tests/python/test_lib_indeed.py
git commit -m "feat: Indeed search via JobSpy as a Vercel Python function"
```

- [ ] **Step 8: Deploy-spike the Indeed function (RISK CHECK — do this before Task 6)**

This validates the top risk (Vercel datacenter IPs blocked by Indeed). Deploy the branch to a Vercel **preview** and hit the function directly:

Run: `curl "https://<preview-deployment-url>/api/indeed?q=AI%20Developer&where=Italia"`
Expected: JSON with a non-empty `results` array and no `error` field.

- If results come back: proceed to Task 5/6 as planned.
- If `results` is empty with a block/error, or the function times out: **Indeed is blocked from Vercel.** Record it in the branch, and in Task 6 mark Indeed as expected-degraded (Jooble carries v1). Do not spend effort fighting the block in this plan — it's a deferred concern (design doc §9/§11).

---

### Task 5: Search aggregator + `/api/search` route

**Files:**
- Create: `lib/jobs/search.ts`
- Test: `lib/jobs/search.test.ts`
- Create: `app/api/search/route.ts`

**Interfaces:**
- Consumes: `dedupe`, `rank` from `./normalize`; `JobResult` from `./types`; `searchJooble` from `./jooble`.
- Produces:
  - `type SourceStatus = "ok" | "error" | "skipped"`
  - `interface SearchResponse { results: JobResult[]; sources: Record<string, SourceStatus> }`
  - `interface SourceFetcher { name: string; skipped?: boolean; fetch: () => Promise<JobResult[]> }`
  - `aggregate(query: string, fetchers: SourceFetcher[]): Promise<SearchResponse>`
  - HTTP `GET /api/search?q=<role>&where=<location>` → `SearchResponse` JSON.

- [ ] **Step 1: Write the failing test** — `lib/jobs/search.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { aggregate } from "./search";
import type { JobResult } from "./types";

const job = (over: Partial<JobResult>): JobResult => ({
  id: over.id ?? "x", title: over.title ?? "Dev", company: over.company ?? "Acme",
  location: over.location ?? "Napoli", source: over.source ?? "jooble",
  url: over.url ?? "https://x", snippet: "", salary: over.salary, postedAt: over.postedAt,
});

describe("aggregate", () => {
  it("merges fulfilled sources, marks them ok, and ranks the union", async () => {
    const res = await aggregate("AI Developer", [
      { name: "jooble", fetch: async () => [job({ title: "AI Developer", url: "https://j" })] },
      { name: "indeed", fetch: async () => [job({ title: "Senior AI Developer", url: "https://i", source: "indeed" })] },
    ]);
    expect(res.sources).toEqual({ jooble: "ok", indeed: "ok" });
    expect(res.results.map((r) => r.title)).toEqual(["AI Developer", "Senior AI Developer"]);
  });

  it("marks a rejected source error and still returns the healthy one", async () => {
    const res = await aggregate("dev", [
      { name: "jooble", fetch: async () => [job({ url: "https://j" })] },
      { name: "indeed", fetch: async () => { throw new Error("boom"); } },
    ]);
    expect(res.sources).toEqual({ jooble: "ok", indeed: "error" });
    expect(res.results).toHaveLength(1);
  });

  it("marks a skipped source", async () => {
    const res = await aggregate("dev", [
      { name: "jooble", skipped: true, fetch: async () => [] },
    ]);
    expect(res.sources.jooble).toBe("skipped");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `./search`.

- [ ] **Step 3: Create `lib/jobs/search.ts`**

```ts
import { dedupe, rank } from "./normalize";
import type { JobResult } from "./types";

export type SourceStatus = "ok" | "error" | "skipped";

export interface SearchResponse {
  results: JobResult[];
  sources: Record<string, SourceStatus>;
}

export interface SourceFetcher {
  name: string;
  skipped?: boolean;
  fetch: () => Promise<JobResult[]>;
}

export async function aggregate(
  query: string,
  fetchers: SourceFetcher[]
): Promise<SearchResponse> {
  const settled = await Promise.allSettled(fetchers.map((f) => f.fetch()));
  const sources: Record<string, SourceStatus> = {};
  const all: JobResult[] = [];
  settled.forEach((res, i) => {
    const f = fetchers[i];
    if (res.status === "fulfilled") {
      sources[f.name] = f.skipped ? "skipped" : "ok";
      all.push(...res.value);
    } else {
      sources[f.name] = "error";
      console.error(`[search] ${f.name} failed`, res.reason);
    }
  });
  return { results: rank(query, dedupe(all)), sources };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Create `app/api/search/route.ts`** (wiring; verified manually in Task 6)

```ts
import { NextRequest } from "next/server";
import { searchJooble } from "@/lib/jobs/jooble";
import { aggregate, type SearchResponse, type SourceFetcher } from "@/lib/jobs/search";
import type { JobResult } from "@/lib/jobs/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { at: number; body: SearchResponse }>();

async function fetchWithTimeout(url: string, ms: number): Promise<JobResult[]> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctl.signal });
    if (!res.ok) throw new Error(`${url} responded ${res.status}`);
    const data = (await res.json()) as { results?: JobResult[] };
    return data.results ?? [];
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(req: NextRequest): Promise<Response> {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 200);
  const where = (req.nextUrl.searchParams.get("where") ?? "Italia").trim() || "Italia";
  if (!q) {
    return Response.json({ results: [], sources: {} } satisfies SearchResponse);
  }

  const key = `${q.toLowerCase()}|${where.toLowerCase()}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return Response.json(hit.body);

  const origin = req.nextUrl.origin;
  const fetchers: SourceFetcher[] = [
    {
      name: "jooble",
      skipped: !process.env.JOOBLE_API_KEY,
      fetch: () => {
        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), 5000);
        return searchJooble(q, where, { signal: ctl.signal }).finally(() => clearTimeout(timer));
      },
    },
    {
      name: "indeed",
      fetch: () =>
        fetchWithTimeout(
          `${origin}/api/indeed?q=${encodeURIComponent(q)}&where=${encodeURIComponent(where)}`,
          8000
        ),
    },
  ];

  const body = await aggregate(q, fetchers);
  cache.set(key, { at: Date.now(), body });
  return Response.json(body);
}
```

- [ ] **Step 6: Commit**

```bash
git add lib/jobs/search.ts lib/jobs/search.test.ts app/api/search/route.ts
git commit -m "feat: search aggregator and /api/search route with per-source resilience"
```

---

### Task 6: Home page — live results UI

**Files:**
- Create: `components/job-result-card.tsx`
- Modify: `app/(app)/page.tsx` (replace sample-data search with live `/api/search`; remove live type-ahead)
- Modify/Create: `.env.example` (add `JOOBLE_API_KEY=`)

**Interfaces:**
- Consumes: `JobResult`, `jobSourceLabels` from `@/lib/jobs/types`; `SearchResponse` shape from `/api/search`.

- [ ] **Step 1: Create `components/job-result-card.tsx`**

A self-contained card for live results (the existing `PositionCard` is bound to sample-data companies and cannot be reused). Company is plain text; the whole card links to the external posting.

```tsx
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import type { JobResult } from "@/lib/jobs/types";
import { jobSourceLabels } from "@/lib/jobs/types";

function formatDate(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso + "T12:00:00");
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("it-IT", { dateStyle: "long" }).format(d);
}

export function JobResultCard({ job }: { job: JobResult }) {
  const date = formatDate(job.postedAt);
  return (
    <div className="relative w-full bg-gray-100 rounded-2xl px-8 py-7 dark:bg-neutral-800 transition-colors hover:bg-gray-200/70 dark:hover:bg-neutral-700 focus-within:ring focus-within:ring-indigo-100 dark:focus-within:ring-indigo-900">
      <h3 className="text-xl font-bold tracking-tight text-gray-800 dark:text-white">
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="focus:outline-none after:absolute after:inset-0 after:rounded-2xl"
        >
          {job.title}
        </a>
      </h3>

      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-gray-500 dark:text-gray-300">
        {job.company && <span className="font-medium">{job.company}</span>}
        {job.location && (
          <>
            <span aria-hidden="true">·</span>
            <span className="rounded-full bg-white px-3 py-0.5 text-xs font-semibold text-gray-600 dark:bg-neutral-900 dark:text-gray-300">
              {job.location}
            </span>
          </>
        )}
        {job.salary && (
          <>
            <span aria-hidden="true">·</span>
            <span className="text-sm font-medium text-green-700 dark:text-green-400">{job.salary}</span>
          </>
        )}
      </div>

      {job.snippet && (
        <p className="mt-3 text-gray-500 dark:text-gray-300 line-clamp-2">{job.snippet}</p>
      )}

      <div className="flex flex-wrap items-center gap-4 pt-4 mt-4 text-sm text-gray-400 border-t border-gray-200 dark:border-neutral-700">
        <span className="font-medium text-gray-500 dark:text-gray-400">
          {jobSourceLabels[job.source]}
        </span>
        {date && <span>Pubblicata il {date}</span>}
        <span className="inline-flex items-center gap-1 ml-auto font-medium text-indigo-600 dark:text-indigo-400">
          Apri annuncio
          <ArrowTopRightOnSquareIcon className="w-4 h-4" />
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite the search logic in `app/(app)/page.tsx`**

Replace the sample-data search (`search`, `rankTop`, `tokenize`, `TieredResults`, the `suggestions`/`showSuggestions` state and the live dropdown JSX) with a live fetch on submit. Keep all the hero/background/`ImageStreamHero` markup unchanged. The imports of `PositionCard`, `SourceChip`, `companyById`, `openPositions`, `Position` from sample-data are removed; add the live imports.

Replace the component's state + handler with:

```tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Container } from "@/components/container";
import { TimeVisionLogo } from "@/components/timevision-logo";
import { CanvasRevealEffect } from "@/components/ui/sign-in-flow-1";
import { ImageStreamHero } from "@/components/ui/image-stream-hero";
import { JobResultCard } from "@/components/job-result-card";
import type { JobResult, JobSource } from "@/lib/jobs/types";

type SourceStatus = "ok" | "error" | "skipped";

// ...HERO_IMAGES stays exactly as-is...
```

Component body:

```tsx
export default function HomePage() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<JobResult[]>([]);
  const [sources, setSources] = useState<Record<string, SourceStatus>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [searched, setSearched] = useState(false);

  async function runSearch(q: string) {
    const term = q.trim();
    if (!term) return;
    setQuery(term);
    setLoading(true);
    setError(false);
    setSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { results: JobResult[]; sources: Record<string, SourceStatus> };
      setResults(data.results);
      setSources(data.sources);
    } catch {
      setError(true);
      setResults([]);
      setSources({});
    } finally {
      setLoading(false);
    }
  }

  const degraded = Object.entries(sources)
    .filter(([, s]) => s === "error")
    .map(([name]) => (name === "indeed" ? "Indeed" : name === "jooble" ? "Jooble" : name));
```

The `<form onSubmit>` becomes:

```tsx
onSubmit={(e) => {
  e.preventDefault();
  runSearch(input);
}}
```

Remove the `onFocus`/`onBlur`/`focused` handlers and the entire `{showSuggestions && (...)}` block from the input. Keep the input, the "Cerca" button, and the example hint line.

- [ ] **Step 3: Replace the results section** (the `{query.trim() !== "" && (...)}` block in `Container`) with live rendering:

```tsx
<Container className="relative z-10 max-w-4xl">
  {searched && (
    <div className="pb-10">
      {loading ? (
        <p className="mt-14 text-center text-gray-500 dark:text-gray-300">
          Ricerca in corso…
        </p>
      ) : error ? (
        <div className="px-8 mt-14 text-center bg-gray-100 rounded-2xl py-14 dark:bg-neutral-800">
          <p className="text-xl font-medium text-gray-800 dark:text-white">
            Si è verificato un errore durante la ricerca.
          </p>
          <p className="mt-2 text-gray-500 dark:text-gray-300">Riprova tra qualche istante.</p>
        </div>
      ) : results.length === 0 ? (
        <div className="px-8 mt-14 text-center bg-gray-100 rounded-2xl py-14 dark:bg-neutral-800">
          <p className="text-xl font-medium text-gray-800 dark:text-white">
            Nessuna posizione trovata per “{query}”.
          </p>
          <p className="mt-2 text-gray-500 dark:text-gray-300">
            Prova con un titolo più generico (es. “Developer” invece di “React Developer Senior”).
          </p>
        </div>
      ) : (
        <>
          {degraded.length > 0 && (
            <p className="mt-8 text-sm text-amber-600 dark:text-amber-400">
              Alcune fonti non sono disponibili in questo momento ({degraded.join(", ")}). I risultati potrebbero essere parziali.
            </p>
          )}
          <p className="mt-8 mb-4 text-sm font-medium text-gray-500 dark:text-gray-300">
            {results.length} posizioni trovate per “{query}”
          </p>
          <div className="flex flex-col gap-4">
            {results.map((job) => (
              <JobResultCard key={job.id} job={job} />
            ))}
          </div>
        </>
      )}
      <div className="mt-10 text-center">
        <Link href="/posizioni" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
          Vedi tutte le posizioni aperte →
        </Link>
      </div>
    </div>
  )}
</Container>
```

- [ ] **Step 4: Add `JOOBLE_API_KEY` to `.env.example`**

Append (create the file if it does not exist):

```
# Jooble REST API key (free — request at https://jooble.org/api/about)
JOOBLE_API_KEY=
```

- [ ] **Step 5: Verify the build and types**

Run: `npm run build`
Expected: build succeeds with no type errors. (`JobSource` import is only needed if referenced; remove it if unused to satisfy `noUnusedLocals`/lint.)

- [ ] **Step 6: Manual smoke test with `vercel dev`**

`next dev` does **not** serve the Python `api/indeed.py` function — use `vercel dev` (or deploy a preview) to exercise both sources locally. With `JOOBLE_API_KEY` set in `.env`:

Run: `vercel dev`
Then in the browser at the home page, search "AI Developer" and confirm:
- A loading state shows, then result cards render.
- Each card opens the original posting in a new tab.
- With `JOOBLE_API_KEY` unset, Jooble is skipped and the page still renders Indeed results (or the empty/degraded state) without crashing.

- [ ] **Step 7: Commit**

```bash
git add components/job-result-card.tsx "app/(app)/page.tsx" .env.example
git commit -m "feat: live job search results on the home page (Jooble + Indeed)"
```

---

## Self-Review

**Spec coverage (design doc §):**
- §1 goal (live results on submit) → Tasks 5–6.
- §3 architecture / fan-out → Tasks 4 (Indeed fn), 5 (route + aggregate).
- §4 `JobResult` model → Task 1; Jooble mapping Task 3; Indeed mapping Task 4.
- §5 resilience/timeouts/cache → Task 5 (`aggregate` + route timeouts + cache); partial results test in Task 5.
- §6 ranking + dedupe → Task 2.
- §7 config (`JOOBLE_API_KEY`, default Italy) → Task 5 (route default `where`), Task 6 (`.env.example`).
- §8 UI (on-submit, loading/empty/error, drop type-ahead, new-tab links) → Task 6.
- §9 risk validation (Indeed IP block) → Task 4 Step 8 spike.
- §10 acceptance criteria → covered across Tasks 3–6 (Jooble skip-without-key: Task 3 + Task 5; duplicates once: Task 2; degraded note: Task 6).

**Placeholder scan:** none — all steps carry concrete code. The only deliberately deferred item is the `requirements.txt` version pin (Task 4 Step 6), which instructs the exact command to get the value.

**Type consistency:** `JobResult` field names (`postedAt`, `snippet`, `url`, `source`) are identical across `types.ts` (Task 1), Jooble mapping (Task 3), Python output (Task 4), and the card (Task 6). `SearchResponse`/`SourceFetcher`/`SourceStatus` names match between `search.ts` (Task 5) and the route. The Python handler emits camelCase keys to match the TS `JobResult` exactly.
