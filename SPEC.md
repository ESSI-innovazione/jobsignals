# JobSignal — Technical Specification

**Version:** 1.0 · **Date:** 2026-08-12
**Repo:** https://github.com/ESSI-innovazione/jobsignals · **Supabase project:** `jobsignal` · **Hosting:** Vercel
**Design reference:** [`mockup/jobsignal-mockup.html`](mockup/jobsignal-mockup.html) (clickable mockup — the visual source of truth)

---

## 1. Overview

**JobSignal** is an internal web platform for **TimeVision** (Italian company). It helps the HR/recruiting team discover and track **open job positions published by other companies**, collected from three source types:

1. LinkedIn posts
2. Indeed listings
3. The company's own career page / website

It is **not** a public job board. Only internal TimeVision users can log in. The web app is **read-mostly**: all companies and positions are entered manually by the admin directly in Supabase (Studio / SQL); the app reads that data, makes it searchable, visualizes it per company, and emails users when new positions matching their preferences appear.

### Goals

- One place to see every tracked opening, with its source clearly labeled and a link to the original posting.
- Precise, combinable search: job title + description full-text + zone (e.g. exactly "AI Developer" in "Napoli").
- A simple BI-style dashboard per tracked company (openings over time, by source, by zone).
- Daily email alerts, filtered by each user's own preferences (followed job titles, followed companies, enabled sources), with a guarantee of **never emailing twice for the same position**.
- Internal-only authentication via Supabase Auth.

### Non-goals (v1)

- **No HubSpot or any CRM integration.**
- **No automatic scraping.** No crawlers, no ingestion pipelines: all data is inserted manually into Supabase by the admin.
- No in-app admin UI for managing companies/positions (the admin uses Supabase Studio directly).
- No self-service signup (users are created by the admin in Supabase Auth).
- No application-tracking features (JobSignal tracks *other companies'* openings; nobody applies through it).
- No mobile app (the web app is responsive).

---

## 2. Users & roles

| Role | Who | What they do | Where |
|---|---|---|---|
| `admin` | The project owner (innovazione@timevision.it) | Inserts/updates companies and positions; creates user accounts; marks positions `closed` | Directly in **Supabase Studio** (table editor / SQL). The admin also logs into the web app as a normal user. |
| `user` | TimeVision HR team | Browses the feed, searches positions, views company dashboards, manages **their own** notification preferences | The web app |

- Role is stored on `profiles.role` (`'admin'` \| `'user'`, default `'user'`). In v1 the web app renders the same UI for both roles; the role column exists so future versions can gate an in-app admin area without a migration.
- There is **no signup flow**. The admin creates users in Supabase Auth (Dashboard → Authentication → Add user) with a `@timevision.it` email; a database trigger auto-creates the matching `profiles` row.

---

## 3. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | Server Components for all data reads; Server Actions for preference writes |
| Styling | **Tailwind CSS** | Theme tokens taken from the mockup design system (see §9) |
| Database / Auth | **Supabase** (project `jobsignal`) | Postgres, Supabase Auth (email+password), Row Level Security on every table |
| Supabase client | `@supabase/supabase-js` + `@supabase/ssr` | Cookie-based sessions; middleware-protected routes |
| Hosting | **Vercel** | Production = `main` branch of the GitHub repo |
| Scheduler | **Vercel Cron** | Calls the notification endpoint daily (see §7) |
| Email | **Resend** (transactional email provider) | Any transactional provider works; Resend is the reference choice for its Vercel/Next.js integration. Sender: `JobSignal <notifiche@…>` on a verified domain. |
| Charts | Hand-rolled SVG/CSS components | The mockup's line chart and horizontal bars are plain SVG/CSS — no chart library needed |

### Environment variables

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server | Supabase anon (publishable) key — always behind RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Used **only** by the cron endpoint (bypasses RLS to read all users' preferences and write `notification_log`) |
| `RESEND_API_KEY` | server only | Email sending |
| `CRON_SECRET` | server only | Vercel Cron authenticates with `Authorization: Bearer ${CRON_SECRET}` |
| `NEXT_PUBLIC_APP_URL` | client + server | Absolute URL of the deployed app, used in email links |

---

## 4. Data model

All SQL below is the canonical schema, to be applied as Supabase migrations in order. Postgres config for full-text search is **`italian`** (data is in Italian).

### 4.1 Extensions & helpers

```sql
create extension if not exists pg_trgm;   -- trigram index for ILIKE title filtering

-- keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;
```

### 4.2 Enums

```sql
create type public.position_source as enum ('linkedin', 'indeed', 'website');
create type public.position_status as enum ('open', 'closed');
create type public.notification_target as enum ('job_title', 'company', 'source');
```

### 4.3 `companies`

```sql
create table public.companies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  logo_url    text,                 -- optional; UI falls back to initials avatar
  website     text,                 -- company site, shown on the dashboard header
  zone        text,                 -- headquarters zone/region, e.g. 'Napoli'
  sector      text,                 -- e.g. 'Software & AI'
  notes       text,                 -- admin-only free text
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger companies_updated_at
  before update on public.companies
  for each row execute function public.set_updated_at();
```

### 4.4 `positions`

```sql
create table public.positions (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  title       text not null,
  description text,
  zone        text,                              -- position location, e.g. 'Napoli', 'Remoto'
  source      public.position_source not null,   -- 'linkedin' | 'indeed' | 'website'
  source_url  text not null,                     -- original posting URL (card click target)
  posted_at   date not null default current_date,-- publication date shown in the UI
  status      public.position_status not null default 'open',
  created_at  timestamptz not null default now(),-- insertion time: drives "new since last run"
  updated_at  timestamptz not null default now(),
  -- full-text search over title (weight A) + description (weight B), Italian stemming
  search_vector tsvector generated always as (
    setweight(to_tsvector('italian', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('italian', coalesce(description, '')), 'B')
  ) stored
);

create trigger positions_updated_at
  before update on public.positions
  for each row execute function public.set_updated_at();

-- indexes
create index positions_search_idx      on public.positions using gin (search_vector);
create index positions_title_trgm_idx  on public.positions using gin (title gin_trgm_ops);
create index positions_company_idx     on public.positions (company_id);
create index positions_status_posted   on public.positions (status, posted_at desc);
create index positions_created_idx     on public.positions (created_at desc);
```

### 4.5 `profiles`

One row per internal user, keyed to `auth.users`. Auto-created on signup by trigger.

```sql
create table public.profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  email                 text not null,
  full_name             text,
  role                  text not null default 'user' check (role in ('admin', 'user')),
  notifications_enabled boolean not null default true,  -- master toggle ("Notifiche attive")
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- auto-create a profile when the admin creates an auth user
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- prevent privilege escalation: users may update their own row, but never their role
create or replace function public.protect_profile_role()
returns trigger language plpgsql as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null then
    raise exception 'role cannot be changed by the user';
  end if;
  return new;
end $$;

create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();
```

### 4.6 `notification_preferences`

One row per followed target. **Semantics of `target_value` depend on `target_type`:**

| `target_type` | `target_value` | Match rule |
|---|---|---|
| `job_title` | the followed title text, e.g. `AI Developer` | position `title ILIKE '%' || target_value || '%'` (case-insensitive containment: "AI Developer Senior" matches "AI Developer") |
| `company` | `companies.id` as text (uuid) | position `company_id::text = target_value` |
| `source` | `linkedin` \| `indeed` \| `website` | position `source::text = target_value` |

```sql
create table public.notification_preferences (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  target_type  public.notification_target not null,
  target_value text not null,
  enabled      boolean not null default true,
  created_at   timestamptz not null default now(),
  unique (user_id, target_type, target_value)
);

create index notification_preferences_user_idx on public.notification_preferences (user_id);
```

### 4.7 `notification_log`

The dedupe ledger: one row per (position, user) ever emailed. The unique constraint is the hard guarantee that **the cron job never emails twice for the same position**, even across retries or overlapping runs.

```sql
create table public.notification_log (
  id          uuid primary key default gen_random_uuid(),
  position_id uuid not null references public.positions(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  sent_at     timestamptz not null default now(),
  unique (position_id, user_id)
);

create index notification_log_user_idx on public.notification_log (user_id);
```

### 4.8 Row Level Security

RLS is **enabled on every table**. The admin writes data through Supabase Studio (which uses a privileged role and bypasses RLS); the cron endpoint uses the service-role key (also bypasses RLS). The app itself only ever uses the anon key + user session.

```sql
alter table public.companies                enable row level security;
alter table public.positions                enable row level security;
alter table public.profiles                 enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.notification_log         enable row level security;

-- companies: any logged-in user can read; nobody writes via the app
create policy "companies readable by authenticated"
  on public.companies for select to authenticated using (true);

-- positions: any logged-in user can read; nobody writes via the app
create policy "positions readable by authenticated"
  on public.positions for select to authenticated using (true);

-- profiles: users see and update only their own row (role change blocked by trigger, §4.5)
create policy "profiles: read own"
  on public.profiles for select to authenticated using (id = auth.uid());
create policy "profiles: update own"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- notification_preferences: full CRUD, own rows only
create policy "prefs: read own"
  on public.notification_preferences for select to authenticated using (user_id = auth.uid());
create policy "prefs: insert own"
  on public.notification_preferences for insert to authenticated with check (user_id = auth.uid());
create policy "prefs: update own"
  on public.notification_preferences for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "prefs: delete own"
  on public.notification_preferences for delete to authenticated using (user_id = auth.uid());

-- notification_log: users may read their own history; only the service role writes
create policy "log: read own"
  on public.notification_log for select to authenticated using (user_id = auth.uid());
-- (no insert/update/delete policies: writes happen only via SUPABASE_SERVICE_ROLE_KEY)
```

Note on anonymous access: with no `to anon` policies anywhere, an unauthenticated request with the anon key reads nothing — defense in depth on top of the route middleware.

### 4.9 Seed data (development)

A `seed.sql` inserts the mockup's sample set: 6 companies in Campania (Neapolis Tech S.r.l., Vesuvio Analytics, Partenope HR Solutions, Costiera Digital, Sannio Software, Reggia Logistics) and ~20 positions across the three sources with realistic Italian titles/descriptions ("AI Developer", "Data Engineer", "HR Specialist", …) and zones (Napoli, Salerno, Caserta, Benevento, Sorrento (NA), Remoto).

---

## 5. Feature specs

### 5.1 Auth (login riservato)

**Behavior**
- `/login` shows the branded two-panel login page from the mockup (brand panel + card with "Email aziendale" / "Password" / "Accedi").
- Sign-in via Supabase Auth `signInWithPassword`. On success → redirect to `/posizioni`.
- Sessions are cookie-based (`@supabase/ssr`). Next.js middleware guards every route except `/login` and static assets: unauthenticated → redirect to `/login`; authenticated user visiting `/login` → redirect to `/posizioni`.
- "Esci" in the sidebar signs out and returns to `/login`.
- No signup, no password-reset UI in v1 (footer text: "Problemi di accesso? Scrivi a innovazione@timevision.it"; the admin resets passwords from the Supabase dashboard).

**Edge cases**
- Wrong credentials → inline Italian error: "Email o password non corretti." (do not reveal whether the email exists).
- Expired/invalid session mid-navigation → middleware redirects to `/login`.
- Deep link while logged out (e.g. `/aziende/<id>`) → after login, land on `/posizioni` (v1 does not preserve the intended destination; acceptable simplification).

**Acceptance criteria**
- [ ] Any app route requested without a session redirects to `/login`.
- [ ] A user created in Supabase Auth can log in and gets a `profiles` row automatically.
- [ ] Wrong password shows the Italian error without a page crash.
- [ ] "Esci" ends the session; the back button does not show protected content afterwards.

### 5.2 Positions feed (`/posizioni`)

**Behavior**
- Header: eyebrow "Feed", title "Posizioni aperte".
- Three KPI tiles: **Posizioni aperte** (count of `status='open'`), **Aziende monitorate** (count of companies), **Fonti attive** (static "LinkedIn · Indeed · Siti").
- Card list of **open** positions ordered by `posted_at desc, created_at desc`. Each card shows: title, "Nuova" badge, company name, zone pill, short description (truncated ~3 lines), source chip (LinkedIn / Indeed / Sito aziendale with the mockup's chip styling), publication date in Italian ("Pubblicata l'11 agosto 2026"), and "Apri annuncio ↗".
- The whole card is a link to `source_url`, opened in a **new tab** (`target="_blank" rel="noopener noreferrer"`). The company name inside the card is a nested link to that company's dashboard.
- "Nuova" badge: shown when `created_at` is within the **last 7 days**.
- Pagination: first 20 cards, "Carica altre" loads the next page (query-param based, server-rendered).

**Edge cases**
- Zero open positions → empty state: "Nessuna posizione aperta al momento."
- Position with missing `description` → card renders without the description paragraph.
- `closed` positions never appear in the feed.
- Malformed/missing `source_url` cannot happen (`not null`); a dead external link is the source site's problem, not ours.

**Acceptance criteria**
- [ ] Feed shows only `open` positions, newest first.
- [ ] KPI numbers match `select count(*)` on the same filters.
- [ ] Clicking a card opens the original posting in a new tab; clicking the company name navigates to `/aziende/[id]` without triggering the outer link.
- [ ] A position inserted in Supabase Studio appears in the feed on the next page load (no caching staler than one request — feed pages render dynamically).

### 5.3 Search (`/ricerca`)

**Behavior** — see §6 for exact query semantics.
- Filter card with three inputs + "Cerca": **Titolo posizione** (free text), **Parole nella descrizione** (free text), **Zona** (select: "Tutta la Campania" = no filter, plus the distinct `zone` values present in `positions`).
- Filters live in the URL (`/ricerca?titolo=…&testo=…&zona=…`) so searches are shareable and back/forward works. Submission is a GET form; results render server-side.
- Active filters render as removable chips; removing a chip re-runs the search without it.
- Result count line: "**N risultati** · ordinati per data di pubblicazione".
- Result cards are identical to feed cards, plus `<mark>` highlighting of the matched title text and matched description terms.
- Only `open` positions are searched.

**Edge cases**
- All filters empty → show the form with no results section (prompt: "Inserisci almeno un filtro per cercare."), not the whole database.
- No matches → "Nessun risultato. Prova ad allargare i filtri."
- Description input with only stopwords (e.g. "il la") → `websearch_to_tsquery` yields an empty query → treat as no description filter, and surface the hint above.
- Special characters (`&`, `:`, quotes) in inputs must not break the query — `websearch_to_tsquery` is injection-safe by design; the title `ILIKE` parameter must escape `%` and `_`.

**Acceptance criteria**
- [ ] Searching titolo "AI Developer" + zona "Napoli" returns exactly the open positions whose title contains "AI Developer" (case-insensitive) in zone Napoli.
- [ ] Description search matches stemmed Italian words (searching "sviluppo" matches "sviluppatore" is *not* required, but "pipeline" matches "pipeline su Azure" is).
- [ ] All three filters combine with AND.
- [ ] Reloading the results URL reproduces the same results; chips reflect the URL.

### 5.4 Companies list (`/aziende`)

**Behavior**
- Two-column grid of company cards: logo (or initials avatar with the mockup's gradient), name, "sector · zone" line, and the count of its **open** positions. Card links to the company dashboard.
- Ordered by open-position count desc, then name asc.

**Edge cases**
- Company with 0 open positions still appears (count "0") — it's being monitored.
- Missing `logo_url` → initials avatar (first letters of the name).

**Acceptance criteria**
- [ ] Every row in `companies` renders a card; counts match the positions table.
- [ ] Clicking a card opens `/aziende/[id]`.

### 5.5 Company dashboard (`/aziende/[id]`)

**Behavior**
- Breadcrumb "Aziende / {name}". Header card: logo, name, sector, zone, website link (new tab), and the "Azienda seguita" pill shown **only if** the current user has an enabled `company` preference for this company.
- KPI tiles: **Posizioni aperte ora**; **Posizioni pubblicate nel {anno corrente}** (count with `posted_at` in the current year, any status); **Fonte principale** (source with most open positions, with "N posizioni su M" caption).
- Charts (data = this company's positions only):
  - **Posizioni pubblicate per mese** — SVG line chart of positions per `posted_at` month over the last 6 months (any status: it measures publication activity).
  - **Posizioni aperte per fonte** — horizontal bars, open positions grouped by `source`, using the mockup's categorical colors.
  - **Per zona** — horizontal bars, open positions grouped by `zone`.
- Table "Posizioni aperte (N)": title, zone, source chip, date ("11 ago 2026"), "Apri ↗" → `source_url` in a new tab. Ordered by `posted_at desc`.
- Implementation note: one query fetches the company's positions; all aggregates are computed in the server component (data volume is small — no materialized views needed).

**Edge cases**
- Unknown company id → `notFound()` (404 page in Italian).
- Company with 0 positions → KPIs show 0, charts show an empty state ("Nessun dato"), table shows the empty message.
- Months with 0 publications still appear on the line chart's x-axis (value 0).

**Acceptance criteria**
- [ ] All numbers derive from the same positions set and are mutually consistent (bars per fonte sum to the "aperte ora" KPI).
- [ ] The "Azienda seguita" pill reflects the user's actual preference.
- [ ] Table links open the original postings in new tabs.

### 5.6 Notification preferences (`/notifiche`)

**Behavior** — four sections, per the mockup:
1. **Notifiche attive** — master toggle, bound to `profiles.notifications_enabled`. Copy shows the user's email: "Invio a {email} quando vengono rilevate nuove posizioni."
2. **Ruoli seguiti** — list of the user's `job_title` preference rows, each with a toggle (`enabled`). "Aggiungi" input creates a new row (trimmed, deduped case-insensitively). A row can be toggled off without being deleted.
3. **Aziende seguite** — one row per company in `companies` (name + zone sub-label) with a toggle. Toggle ON upserts an enabled `company` preference; OFF sets `enabled=false`. No row in the DB = not followed.
4. **Fonti** — three fixed rows (LinkedIn, Indeed, Siti aziendali). **Default is enabled**: no `source` row in the DB means the source is on. Toggling OFF upserts `(source, value, enabled=false)`.
- Writes via Server Actions with optimistic UI; "Salva preferenze" persists any pending changes (individual toggles may also save immediately — either way the button always leaves the page consistent).

**Semantics reminder (drives §7):** roles and companies are *positive* follows (OR'd together); sources are a *restricting* filter; the master toggle gates everything.

**Edge cases**
- Adding a duplicate role (case-insensitive) → re-enable the existing row instead of erroring.
- Adding an empty/whitespace role → ignored with inline hint.
- A followed company later deleted by the admin → preference row cascades away (FK is on `profiles`, not `companies`, so instead: dangling uuid never matches; the companies section only renders existing companies, so the stale row is invisible and harmless).
- User with zero role and zero company follows → will receive **no** notifications (there is nothing to match); the page shows a hint: "Non stai seguendo nessun ruolo o azienda: non riceverai avvisi."

**Acceptance criteria**
- [ ] Toggles persist across reload and across devices (state lives in Postgres, not localStorage).
- [ ] RLS: a user can neither read nor write another user's preferences (verified with two test accounts).
- [ ] Master toggle off → cron sends nothing to that user regardless of other toggles.

### 5.7 Email notifications (cron)

Specified in full in §7. Feature-level acceptance criteria:

- [ ] A position inserted today triggers exactly one email per matching user at the next cron run.
- [ ] Re-running the endpoint immediately afterwards sends nothing (dedupe via `notification_log`).
- [ ] A user with the matching source disabled, or the master toggle off, receives nothing.
- [ ] The email is in Italian and every position links to its original posting.

---

## 6. Search — exact semantics

Three filters, all optional, **combined with AND** (an omitted filter imposes no constraint). Base predicate always includes `status = 'open'`.

| Filter | Input | Predicate |
|---|---|---|
| Titolo | free text `t` | `title ILIKE '%' || t || '%'` — case-insensitive **containment**, so "AI Developer" also matches "AI Developer Senior". Served by the `pg_trgm` GIN index. `%` and `_` in user input are escaped. |
| Descrizione | free text `q` | `search_vector @@ websearch_to_tsquery('italian', q)` — Italian stemming, multi-word AND by default, supports quoted phrases and `OR`/`-` operators natively. The `search_vector` column covers title (weight A) + description (weight B), so description terms that happen to appear in the title also match. |
| Zona | select `z` | `zone = z` (exact match on the position's zone). "Tutta la Campania" = filter omitted. Options = `select distinct zone from positions where zone is not null order by 1`. |

Reference query (Supabase JS translates to this):

```sql
select p.*, c.name as company_name, c.logo_url
from positions p
join companies c on c.id = p.company_id
where p.status = 'open'
  and (:titolo is null or p.title ilike '%' || :titolo || '%')
  and (:testo  is null or p.search_vector @@ websearch_to_tsquery('italian', :testo))
  and (:zona   is null or p.zone = :zona)
order by p.posted_at desc, p.created_at desc
limit 50;
```

**Ordering:** by publication date, newest first (matches the mockup copy "ordinati per data di pubblicazione"). No relevance ranking in v1 — result sets are small and date order is what HR wants; `ts_rank` can be added later without schema changes.

**Highlighting:** done in the rendering layer (wrap case-insensitive occurrences of the title input and of the description words in `<mark>`), not with `ts_headline`, to keep queries simple.

**Empty description query:** if `websearch_to_tsquery('italian', q)` produces an empty tsquery (input was all stopwords/punctuation), the app drops the description filter and shows a hint rather than returning zero rows misleadingly. Implementation: filter via an RPC `search_positions(titolo text, testo text, zona text)` (a `security invoker` SQL function wrapping the query above), which keeps `websearch_to_tsquery` server-side and RLS intact.

---

## 7. Cron job — email notifications

### Schedule & endpoint

- **Vercel Cron:** daily at **06:00 UTC** (08:00 in Italy during CEST, 07:00 during CET).

```json
// vercel.json
{ "crons": [ { "path": "/api/cron/notify", "schedule": "0 6 * * *" } ] }
```

- **Endpoint:** `GET /api/cron/notify` (Next.js route handler, `runtime = 'nodejs'`, `maxDuration = 60`).
- **Auth:** rejects with 401 unless `Authorization: Bearer ${CRON_SECRET}` matches (Vercel sends this automatically when the `CRON_SECRET` env var is set). This also allows safe manual triggering with `curl` for testing.
- The handler uses the **service-role** Supabase client: it must read all users' profiles/preferences and insert into `notification_log`, which RLS forbids to normal sessions.

### Detecting "new positions since the last run"

Two layers, so correctness never depends on remembering the last run time:

1. **Candidate window:** `status = 'open' and created_at > now() - interval '48 hours'`. `created_at` (insertion time) is used — not `posted_at` — because "new" means "newly entered by the admin". The 48h window is deliberately wider than the 24h cadence so a failed/skipped run is caught up by the next one.
2. **Ledger dedupe:** a candidate is only emailed to a user if no `notification_log` row exists for that `(position_id, user_id)` pair. The unique constraint makes this idempotent: re-runs, overlapping runs, and the widened window can never produce a duplicate email.

### Matching algorithm

```
candidates = open positions created in the last 48h
recipients = profiles where notifications_enabled = true

for each recipient u:
  prefs           = u's notification_preferences
  disabledSources = { p.target_value | p.target_type='source' and p.enabled=false }
  followedTitles  = { p.target_value | p.target_type='job_title' and p.enabled=true }
  followedCompanies = { p.target_value | p.target_type='company' and p.enabled=true }

  matches = [ pos in candidates where
                pos.source not in disabledSources                       -- source filter (default: allowed)
            and ( any t in followedTitles: pos.title ILIKE '%'+t+'%'    -- positive follow, OR'd
                  or pos.company_id::text in followedCompanies ) ]

  toSend = matches minus positions already in notification_log for u
  if toSend is empty: continue

  insert notification_log rows for (each toSend, u) with ON CONFLICT DO NOTHING;
  actuallyInserted = rows the insert returned            -- races resolved here
  if actuallyInserted is empty: continue
  send ONE digest email to u with actuallyInserted
  on send failure: delete those just-inserted log rows   -- so the next run retries them
```

Key decisions:
- **One digest email per user per run** (not one email per position) — a batch insert of 10 positions produces one email listing 10 items.
- **Log-then-send with compensation:** rows are inserted first (winning any race), the email is sent second, and a send failure rolls the rows back so the user is retried next run. Worst case is a duplicate after a crash between send and rollback — acceptable; a missed alert is worse than a rare duplicate.
- A user with no enabled `job_title`/`company` follows matches nothing by design (§5.6).

### Email content (Italian)

- **From:** `JobSignal <notifiche@{verified-domain}>`
- **Subject:**
  - 1 position: `JobSignal — Nuova posizione: {title} · {company}`
  - N positions: `JobSignal — {N} nuove posizioni per te`
- **Body** (HTML + plain-text fallback), per position:

> **Ciao {nome},**
> ci sono nuove posizioni che corrispondono a ciò che segui:
>
> **{title}** — {company} · {zone}
> Fonte: {LinkedIn | Indeed | Sito aziendale} · Pubblicata il {posted_at, formato "11 agosto 2026"}
> {prima riga della descrizione}
> [Apri l'annuncio →]({source_url})   ·   [Dashboard azienda]({NEXT_PUBLIC_APP_URL}/aziende/{company_id})
>
> — footer —
> Ricevi questa email perché segui ruoli o aziende su JobSignal.
> [Gestisci le tue preferenze]({NEXT_PUBLIC_APP_URL}/notifiche) · Piattaforma interna TimeVision

- The primary link per position is the **original posting** (`source_url`); the footer links to `/notifiche` for preference management.

### Observability

- The handler returns JSON `{ candidates, usersMatched, emailsSent, errors }`, visible in Vercel Cron logs.
- Failures of a single user's email must not abort the whole run (per-user try/catch).

---

## 8. Pages & routes

UI copy: **Italian** (see §9). Layout: wine-gradient sidebar (Posizioni / Ricerca / Aziende / Notifiche + user block + Esci) on all authenticated pages; `/login` is full-screen without the sidebar.

| Route | Page | Renders | Reads |
|---|---|---|---|
| `/login` | Login | Brand panel + login card ("Accedi") | — (writes: Supabase Auth sign-in) |
| `/` | Redirect | Immediate redirect → `/posizioni` | — |
| `/posizioni` | Feed | KPI tiles + paginated position cards | `positions` (open, ordered by `posted_at desc`) joined to `companies`; counts for KPIs |
| `/ricerca` | Search | Filter card, active-filter chips, result count, result cards with `<mark>` | `search_positions` RPC (§6); distinct zones for the select |
| `/aziende` | Companies | Grid of company cards with open-position counts | `companies` + per-company open counts |
| `/aziende/[id]` | Company dashboard | Header card, 3 KPIs, line chart (per mese), bars (per fonte, per zona), openings table | that company's `companies` row + all its `positions`; the user's `company` preference for the "Azienda seguita" pill |
| `/notifiche` | Preferences | Master toggle + Ruoli seguiti + Aziende seguite + Fonti + "Salva preferenze" | own `profiles` row, own `notification_preferences`, full `companies` list (writes via Server Actions) |
| `/api/cron/notify` | API (no UI) | JSON summary | service-role reads/writes per §7 |

- **Middleware:** everything except `/login`, `/api/cron/*`, and static assets requires a session (§5.1). `/api/cron/notify` is protected by `CRON_SECRET` instead.
- All data-reading pages render **dynamically** (no static caching): the admin inserts data continuously and HR must see it immediately.
- Data reads happen in Server Components with the cookie-scoped Supabase client, so RLS applies everywhere.

---

## 9. UI language & design

- **All UI copy is Italian** — navigation (Posizioni, Ricerca, Aziende, Notifiche, Esci), labels, empty states, errors, dates ("Pubblicata l'11 agosto 2026", formatted with `Intl.DateTimeFormat('it-IT')`), and notification emails. Code, identifiers, and this spec are in English.
- **Design system** (from `mockup/jobsignal-mockup.html` — port its CSS variables to Tailwind theme tokens):
  - Palette: wine `#510B1D` (primary, sidebar gradient), green `#1F5436` (success/follow), cream `#fbf8f4` (background), paper white cards, ink `#1d1117`.
  - Chart categorical trio (CVD-validated): LinkedIn `#9c3a56`, Indeed `#c07b1a`, Website `#2e7d4f`.
  - Source chips: LinkedIn `#0a66c2` "in", Indeed `#2557a7` italic "i", website = green globe icon.
  - Font: Plus Jakarta Sans; radius 18/26px; soft layered shadows.
- Responsive per the mockup: sidebar collapses to a horizontal top bar under 960px; grids collapse to one column. `prefers-reduced-motion` respected.

---

## 10. Milestones

Ordered, small, independently executable. Each step assumes only: this `SPEC.md`, the repo, the `jobsignal` Supabase project, and the mockup file. **Do not start a step before the previous one's checkpoint is met.**

### Step 1 — Bootstrap: README, scaffold, first deploy
- Write `README.md` (project name, purpose, tech stack, feature list) and push as the repo's first commit to `main`.
- Scaffold Next.js (App Router, TypeScript, Tailwind) in the repo root; landing page: "JobSignal — TimeVision internal", styled with the §9 palette.
- Connect the repo to Vercel; production deploy from `main`.
- Add Supabase client setup (`@supabase/supabase-js`, `@supabase/ssr`) reading `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`; commit `.env.example` with every §3 variable (values blank). **No tables yet.**

**Done when…** the README is on `main`, the Vercel production URL serves the landing page, env vars are set on Vercel, and `npm run build` passes locally.

### Step 2 — Database schema + seed
- Apply §4 in full as ordered migrations: extensions/helpers, enums, all five tables, indexes, triggers, RLS policies.
- Apply `seed.sql` (§4.9).
- Create at least two test users in Supabase Auth (one will double as admin: set `role='admin'` on their profile) and verify the `handle_new_user` trigger created their profiles.

**Done when…** all five tables exist with RLS enabled; seed data is queryable; a SQL check confirms: anon role sees zero rows everywhere, an authenticated test user sees companies/positions but only their own profile/preferences; the FTS query from §6 returns expected rows against the seed.

### Step 3 — Auth
- Build `/login` per §5.1 and the mockup (brand panel + card, Italian copy, error handling).
- Session middleware: protect all routes, redirect logic both ways.
- App shell for authenticated pages: sidebar (nav + user block with name/role from `profiles` + Esci), responsive per §9. Nav targets can be placeholder pages.

**Done when…** an unauthenticated visit to any route lands on `/login`; a seeded test user can log in, sees the shell with their name, and can log out; wrong credentials show "Email o password non corretti."; deployed and verified on Vercel.

### Step 4 — Positions feed
- Build `/posizioni` per §5.2: KPI tiles, position cards (full mockup styling: source chips, zone pill, "Nuova" badge, Italian dates), pagination, empty state. `/` redirects here.

**Done when…** the feed on the production URL shows the seeded open positions newest-first with correct KPIs; cards open the original postings in new tabs; the company-name link navigates to the (possibly placeholder) company route; inserting a new position in Supabase Studio makes it appear on reload with the "Nuova" badge.

### Step 5 — Search
- Create the `search_positions` RPC (§6) as a migration.
- Build `/ricerca` per §5.3: GET form, URL-persisted filters, chips, result count, `<mark>` highlighting, empty/edge states.

**Done when…** the §5.3 acceptance criteria pass against seed data — including the canonical case: titolo "AI Developer" + zona "Napoli" returns exactly the seeded matches; filters combine with AND; a reloaded results URL reproduces the search; deployed and verified.

### Step 6 — Companies list + company dashboards
- Build `/aziende` per §5.4 and `/aziende/[id]` per §5.5: header card, KPIs, SVG line chart, source/zone bars with §9 chart colors, openings table, 404 and zero-data states. (The "Azienda seguita" pill may be hidden until Step 7 ships preferences — if so, note it in the step's PR and add it in Step 7.)

**Done when…** every seeded company has a working dashboard whose numbers are mutually consistent (§5.5 criteria); a company with zero positions renders gracefully; unknown ids 404; deployed and verified.

### Step 7 — Notification preferences
- Build `/notifiche` per §5.6: master toggle (profiles), ruoli seguiti (add/toggle), aziende seguite, fonti — all persisted via Server Actions to `notification_preferences`/`profiles`.
- Wire the "Azienda seguita" pill on company dashboards to the real preference.

**Done when…** all §5.6 acceptance criteria pass, including the two-account RLS check (user A cannot read or affect user B's preferences); toggles survive reload; deployed and verified.

### Step 8 — Cron + email notifications
- Add `vercel.json` cron config, `CRON_SECRET`, `RESEND_API_KEY`, and the `/api/cron/notify` handler implementing §7 exactly (service-role client, 48h candidate window, ledger dedupe, log-then-send with compensation, one Italian digest per user, JSON run summary).
- Verify the email domain in Resend.

**Done when…** the §5.7 acceptance criteria pass end-to-end on production: insert a matching position → trigger the endpoint with the bearer secret → the test user receives the Italian digest with a working "Apri l'annuncio" link → a second trigger sends nothing; an unauthenticated request gets 401; the scheduled cron shows in the Vercel dashboard. **This step completes v1.**
