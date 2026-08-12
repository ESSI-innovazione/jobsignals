# Live Posizioni (filter-driven, query-first) — Design

**Date:** 2026-08-12
**Status:** Approved
**Relates to:** `2026-08-12-live-job-search-design.md` (the engine)

## Goal

Rewire `/posizioni` from a static sample-data feed to a **query-first live search** over the
same Jooble + Indeed engine (`/api/search`), driven by the page's existing filter bar.

## Decisions (confirmed)

- **Query-first:** the page is empty on load (no API calls) until the user submits the text
  box or picks a Category. Then it runs a live search.
- **Drop the sample-data stats strip** ("aziende monitorate", "nuove questa settimana") — no
  live equivalent. Replace with a live result-count + active-sources line.
- **Region matching is best-effort** (sources are city/country-oriented).

## Behavior

- **Trigger a fetch** on: text-box submit, Category change, or Region change.
- **Date filter** is applied client-side to results' `postedAt` (no refetch on date change).
- **Query construction:**
  - `q` = trimmed text input; if empty, the selected Category's representative keyword
    (`software`→"developer", `data-ai`→"data engineer", `devops`→"devops", `hr`→"recruiter",
    `business`→"business analyst"; `all`→"" ). If `q` resolves to empty (no text, category
    "all") → no fetch; show the prompt empty state.
  - `where` = Region (`all`→"Italia", `Remoto`→"Remote", else the region name). "Italia" is
    normalized to "Italy" by the Jooble client (already merged).
- **Endpoint:** `GET /api/search?q=&where=` (full mode — NOT `fast=1`).
- **Render:** `JobResultCard` list (same as home); `loading` / `error` / empty / degraded-source
  states mirror home. Result line: "N posizioni trovate · fonti: Indeed, Jooble".
- **Azzera filtri** resets text/category/region/date and returns to the empty prompt.

## Files

- Rewrite: `app/(app)/posizioni/page.tsx` (client component; live fetch + filters).
- Reuse (no change): `components/filter-select.tsx`, `components/job-result-card.tsx`,
  `lib/jobs/types.ts`, `app/api/search/route.ts`.
- Keep importing `italianRegions` from `lib/sample-data` for the Region dropdown options only;
  drop `openPositions` / `companies` / `regionOf` imports.

## Non-goals

- No engine/API changes. No new endpoint. No LinkedIn/Subito. No persistence.

## Acceptance

- [ ] `/posizioni` loads with the filter bar and an empty prompt, no network calls.
- [ ] Typing "developer" + submit → live cards from Indeed (and Jooble) open in new tabs.
- [ ] Picking a Category runs that category's query; picking a Region scopes location.
- [ ] Date filter narrows the shown results by recency without a refetch.
- [ ] A source erroring shows the degraded note; the healthy source still renders.
- [ ] No sample-data feed remains on the page.
