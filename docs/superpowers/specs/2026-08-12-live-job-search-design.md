# Live job search (Jooble + Indeed) — Design

**Date:** 2026-08-12
**Status:** Approved (design), pending implementation plan
**Relates to:** `SPEC.md` (JobSignal v1.1)

## 0. Context & relationship to SPEC.md

The current `SPEC.md` (v1.1) describes JobSignal as an internal TimeVision tracker whose
positions are entered **manually** (`/gestione` or Supabase Studio) and explicitly lists
*"No automatic scraping. No crawlers, no ingestion pipelines."* as a v1 non-goal.

This feature is a **deliberate pivot for the search surface only**: the home search bar
is wired to **live external job sources** instead of (or in addition to) the local dataset.
It does **not** change the Supabase-backed feed, `/gestione`, company dashboards, or the
notification cron — those remain as specified. `SPEC.md` should later be amended to reflect
that the home search now has a live-external mode; this document is the source of truth for
that mode until then.

## 1. Goal

When a user submits a query in the home search bar, return **real, current** job postings
fetched live from external sources, ranked and rendered in the existing card UI.

**Decisions locked during brainstorming:**
- **Fetch model:** live fetch on each search (on submit). No persistence; results are ephemeral.
- **Sources for v1:** **Jooble** (REST API) + **Indeed** (via JobSpy). LinkedIn and Subito are
  deferred (they need residential proxies / a stealth browser and are too slow/fragile for a
  live path). InfoJobs is excluded (closed in Italy since 2025-12-31).
- **Indeed hosting:** a **Vercel Python function** in this repo. JobSpy's Indeed scraper uses
  Indeed's internal JSON API over plain HTTP (no browser), so it can run serverless.
- **Type-ahead:** the live per-keystroke top-5 dropdown is **dropped**. Live results are
  produced on submit only. (A static example-hint line may remain.)

## 2. Non-goals

- No LinkedIn, no Subito, no InfoJobs in v1.
- No persistence of fetched results to Supabase (this is live-only by decision).
- No change to `/posizioni`, `/gestione`, `/aziende`, `/notifiche`, or the cron.
- No residential-proxy infrastructure.

## 3. Architecture

```
home search bar (submit, GET /?q=…)
        │
        ▼
GET /api/search?q=<role>&where=<location>   (Next.js route handler, Node runtime)
        │  fan out in parallel; each source fails independently (Promise.allSettled)
        ├─► Jooble REST API            (fetch, in-process)         ~1s
        └─► GET /api/indeed?q=&where=   (Vercel Python fn, JobSpy)  ~2–5s
        │
        ▼
   normalize each source → JobResult[]
   merge + dedupe (hash of lower(title)+company+location)
   rank (see §6), apply short in-memory cache
        │
        ▼
   JSON { results: JobResult[], sources: { jooble: ok|error, indeed: ok|error } }
        │
        ▼
home page renders result cards (existing PositionCard-style component)
```

### 3.1 Components / files

| File | Responsibility |
|---|---|
| `lib/jobs/types.ts` | Shared `JobResult` type + `JobSource` union (adds `"jooble"`). |
| `lib/jobs/jooble.ts` | Jooble client: POST `https://jooble.org/api/{key}`, map response → `JobResult[]`. |
| `lib/jobs/normalize.ts` | Merge, dedupe, and rank helpers shared by the route. |
| `app/api/search/route.ts` | Node route handler; fan-out to Jooble + `/api/indeed`, merge, cache, respond. |
| `api/indeed.py` | Vercel Python function; runs JobSpy for Indeed, returns normalized JSON. |
| `requirements.txt` | `python-jobspy` (and pins). |
| `app/(app)/page.tsx` | Home page: submit → `/api/search`, render live results + loading/error states; remove live type-ahead. |
| `components/source-chip.tsx` | Add the `jooble` chip variant. |
| `.env.example` / Vercel env | `JOOBLE_API_KEY`. |

## 4. Data model — `JobResult`

```ts
type JobSource = "jooble" | "indeed" | "linkedin" | "website";

interface JobResult {
  id: string;          // stable hash of source + url (dedupe/react key)
  title: string;
  company: string;     // may be empty from some sources
  location: string;
  source: JobSource;   // origin as reported to us
  url: string;         // apply/original posting link (opens in new tab)
  snippet: string;     // short description text, plain
  salary?: string;     // free-text, source-provided; often absent
  postedAt?: string;   // ISO date if derivable, else undefined
}
```

Mapping notes:
- **Jooble** returns `{ title, location, snippet, salary, source, type, link, company, updated, id }`.
  `source` here is the *origin board* (e.g. "Indeed"), useful context but we tag `source: "jooble"`
  for provenance of *how we got it*; the origin board is kept in `snippet`/meta if useful.
- **Indeed (JobSpy)** returns a DataFrame; `api/indeed.py` selects and renames columns to the
  `JobResult` shape and emits JSON.

## 5. Fan-out, resilience, caching

- **Parallel** fan-out with `Promise.allSettled`; a failed/timed-out source never blocks the other.
- **Per-source timeouts:** Jooble ~5s, Indeed ~8s (AbortController).
- **Partial results:** render whatever returned; the response reports per-source status so the UI
  can quietly note a degraded source ("Indeed non disponibile") without failing the page.
- **In-memory cache:** normalize the query key (`lower(trim(q))|where`) and cache the merged
  result ~5 min to avoid re-hitting APIs on refinement/reload. (Best-effort; per-instance.)
- **Empty query:** no fetch; show the pre-search hero/hint (unchanged behavior).

## 6. Ranking & dedupe

- **Dedupe key:** `sha1(lower(trim(title)) + '|' + lower(company) + '|' + lower(location))`.
  On collision, keep the first; prefer a result that has a salary/postedAt when merging.
- **Ranking (simple, v1):** exact title match > all query words present in title > the rest;
  tie-break by `postedAt desc` when present. (Mirrors the spirit of SPEC §6.1 tiers, but over
  live results. No DB full-text here.)

## 7. Configuration

| Env var | Scope | Purpose |
|---|---|---|
| `JOOBLE_API_KEY` | server only | Jooble REST API key (free, via jooble.org/api/about). |

- Default location: **Italy** (`where=Italia`, `country_indeed="Italy"`). A location field on the
  search bar is optional for v1; default to Italy when omitted.

## 8. UI changes (home page)

- Submit performs a client fetch to `/api/search`; show a **loading state** during fan-out.
- Render results with the existing card component; each card links to `url` in a new tab.
- Remove the live per-keystroke top-5 dropdown (kept behavior: example-query hint line).
- **Error/empty states:** no results → the existing "Nessuna posizione trovata" empty state;
  a source failing → a small non-blocking note, results from the healthy source still shown.

## 9. Risks & validations

1. **Indeed may block Vercel datacenter IPs.** JobSpy is normally rate-limit-free, but shared
   cloud IPs can be blocked where residential IPs aren't. **Validate with a spike first**
   (deploy `api/indeed.py`, hit it on Vercel, confirm real results). If blocked: move Indeed to
   an external host or drop it for v1 — **Jooble alone still delivers a working live search.**
2. **Jooble key required** before any Jooble result works.
3. **Latency** ~2–5s/search, dominated by Indeed; acceptable for on-submit search.
4. **Python + Next.js in one Vercel project:** `api/*.py` is detected as a standalone function
   independent of the Next.js `app/` router; keep the `vercel.json` framework override intact
   (per project convention) and verify the Python function deploys alongside the Next app.

## 10. Acceptance criteria

- [ ] Submitting "AI Developer" on `/` returns live cards from Jooble (and Indeed if the spike
      passed), each opening the original posting in a new tab.
- [ ] If one source errors/times out, the other's results still render, with a quiet degraded note.
- [ ] Duplicate postings arriving from both sources appear once.
- [ ] A no-match query shows the existing empty state.
- [ ] No `JOOBLE_API_KEY` → Jooble is skipped gracefully (logged), not a hard crash.
- [ ] The Supabase feed / gestione / notifications behavior is unchanged.

## 11. Deferred (future)

- LinkedIn (JobSpy + residential proxies) and Subito (Scrapling stealth browser), likely on a
  scheduled ingestion model rather than live, feeding the Supabase `positions` table.
- Persisting live results and reconciling them with manually-entered positions.
- Amend `SPEC.md` to document the live-search mode formally.
