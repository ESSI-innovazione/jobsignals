# JobSignal — Prompts for Claude

Three prompts to run in order. Attach the frontend design file/screenshots when you send **Prompt 1** (and mention it again in later sessions if needed).

---

## PROMPT 1 — Big picture + mockup

```
# JobSignal — Big Picture & Mockup

## Context
I'm building an internal web platform called **JobSignal** for **TimeVision** (an Italian company). It is NOT a public job board — only internal TimeVision users (mainly the HR/recruiting team) will use it.

The goal: help our HR team discover and track **open job positions at other companies**, collected from three kinds of sources:
1. LinkedIn posts
2. Indeed listings
3. The company's own career page / website

There is **no CRM integration** (no HubSpot). All data is entered manually by me (the admin) directly into a **Supabase** project named `jobsignal`. The web app only reads from Supabase.

Infrastructure already in place:
- GitHub repo: https://github.com/ESSI-innovazione/jobsignals
- Supabase project: `jobsignal`
- Deployment target: Vercel
- Frontend design: see the attached design — follow its style, colors, and layout direction.

## Core features
1. **Search-first home page** — the home page is built around a big search bar. The user types a job title and gets the **best-matching open positions** that exist, ranked by relevance (exact title matches first, then close/partial matches). Advanced filters refine by **job description** (full-text) and **zone/region** — e.g., find exactly "AI Developer" in "Campania". Filters must be combinable.
2. **Positions results/feed** — each position card shows: job title, company name, zone/region, short description, publication date, and a **source logo** (LinkedIn logo, Indeed logo, or the company's own name/logo for direct website posts). Clicking a position opens the original posting URL (LinkedIn / Indeed / company site) in a new tab.
3. **Company profile + dashboard** — when the user clicks the company of a position, they land on the company's page, where the company is clearly recognizable like a LinkedIn company page: logo, name, **VAT number (Partita IVA)**, **address**, and a **brief 1–2 line description**. Below that header sits a simple BI-style dashboard: number of open positions, positions over time, breakdown by source (LinkedIn / Indeed / website) and by zone, and the list of its current openings.
4. **Daily positions management** — a dedicated in-app section where the newest positions are added and modified **daily**: create a position, edit it, mark it closed. This keeps the data fresh without touching Supabase directly (direct Supabase inserts by the admin remain possible).
5. **Email notifications (cron job)** — a scheduled job checks for newly added positions and sends an email to HR users whenever new positions appear anywhere (LinkedIn, Indeed, company sites).
6. **Notification preferences** — each user can turn notifications **on/off per job title and per company** (and per source), so they only receive alerts for what they follow.
7. **Auth** — internal login for TimeVision users only (Supabase Auth).

## What I want from you in this session
1. Restate the **big picture** of the product in your own words: purpose, users, and main flows — so I can confirm you understood it correctly.
2. Propose the **screen map**: which pages exist and what is on each one.
3. Build a **clickable HTML mockup** of the main screens, following the attached design:
   - Home page centered on the big search bar, with best-match results shown as position cards (with source logos)
   - Search results with filters (job title, description, zone)
   - Company page: LinkedIn-style header (logo, name, VAT number, address, 1–2 line description) + simple dashboard charts
   - Daily positions management section (list of the newest positions + add/edit form)
   - Notification settings page (toggles per job title / company / source)
   - Login page
Use realistic Italian sample data (companies in Campania, roles like "AI Developer", "Data Engineer", "HR Specialist"). UI copy in Italian.

Do NOT write any backend code in this session — this step is only about the big picture and the mockup.
```

---

## PROMPT 2 — Write the spec

```
# JobSignal — Write the Technical Spec

Based on the big picture and the mockup we agreed on, write a complete technical specification and save it as `SPEC.md` in the repo root.

The spec must cover:

1. **Overview** — product summary, goals, and non-goals. Explicit non-goals: no HubSpot/CRM integration, no automatic scraping in v1 (positions are entered manually — either through the in-app daily management section or directly into Supabase by the admin).
2. **Users & roles** — `admin` (manages data directly in Supabase) and `user` (TimeVision HR: searches positions, views company profiles/dashboards, adds and edits the newest positions daily in the management section, manages own notification preferences).
3. **Tech stack** — Next.js (App Router) + TypeScript + Tailwind CSS, Supabase (Postgres, Auth, RLS), Vercel (hosting + Vercel Cron), a transactional email provider for notifications. Repo: https://github.com/ESSI-innovazione/jobsignals — Supabase project: `jobsignal`.
4. **Data model** — full Supabase schema with SQL:
   - `companies` (name, logo_url, website, **vat_number** (Partita IVA), **address**, **short_description** (1–2 lines, LinkedIn-style), zone/region, sector, notes, …)
   - `positions` (company_id, title, description, zone, source enum: `linkedin` | `indeed` | `website`, source_url, posted_at, status `open`/`closed`, …)
   - `profiles` (internal users)
   - `notification_preferences` (user_id, target_type: `job_title` | `company` | `source`, target_value, enabled)
   - `notification_log` (which position was notified, to whom, when — so the cron job never emails twice for the same position)
   Include indexes for full-text search on title + description, and Row Level Security policies for every table.
5. **Feature specs** — for each feature (search-first home, results feed, company profile + dashboard, daily positions management CRUD, notifications, preferences, auth): expected behavior, edge cases, and acceptance criteria.
6. **Search & ranking** — exactly how the title / description / zone filters combine, the Postgres full-text search approach, and the **best-match ranking**: exact title matches rank first, then prefix/partial matches, then full-text relevance on the description.
7. **Cron job** — Vercel Cron schedule, the API endpoint it calls, how it detects "new positions since the last run", how it matches new positions against each user's notification preferences, and the email content (subject + body, in Italian, with a link to the position).
8. **Pages & routes** — the full route map (home/search, results, company profile, daily positions management, notification settings, login), with what each page renders and which data it reads.
9. **UI language** — Italian.
10. **Milestones** — an ordered build plan in small steps (Step 1 = README + first push + Vercel deploy; then database schema; then search-first home + results; then company profiles + dashboards; then daily positions management; then notifications + preferences). Each milestone must end with a clear "done when…" checkpoint.

Write the spec so that each milestone can later be given to you as a standalone implementation task without extra context.
```

---

## PROMPT 3 — First step (repo bootstrap + first deploy)

```
# JobSignal — Step 1: repo bootstrap + first deploy

Execute only Step 1 of the milestone plan in `SPEC.md`. Scope of this step:

1. **README.md** — create a clear README in the repo root: project name (JobSignal), what it is (internal TimeVision platform to track open job positions at other companies, sourced from LinkedIn / Indeed / company websites), tech stack (Next.js, Supabase, Vercel), and a short feature list. Commit it and push to `main` on https://github.com/ESSI-innovazione/jobsignals — this is the repo's first commit.
2. **Scaffold the app** — create a minimal Next.js project (App Router, TypeScript, Tailwind) in the same repo, with a simple landing page that says "JobSignal — TimeVision internal", styled roughly in line with the attached design. Commit and push.
3. **Vercel** — connect the repo to Vercel and make sure the deployment succeeds. Give me the deployment URL.
4. **Supabase wiring** — add the Supabase client setup using environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) pointing at the `jobsignal` project, plus a `.env.example` file. Do NOT create any tables yet — the schema is the next milestone.

Do not build any product features in this step. When finished, confirm: README pushed, app scaffolded, Vercel deployment green, URL working.
```

---

## PROMPT 4 — Supervisor feature requests (search-first home, company identity, daily management)

```
# JobSignal — Feature Requirements from Supervisor

Context: JobSignal is an internal web platform for TimeVision's HR team to discover and track open job positions at other companies (sources: LinkedIn, Indeed, company websites). Data lives in the Supabase project `jobsignal`; repo: https://github.com/ESSI-innovazione/jobsignals; deployed on Vercel.

Apply these three requirements to the current state of the project (mockup, spec, or code — whatever we are working on now):

## 1. Search-first home page with best-match results
- The home page must be centered on a **large search bar** (like Google or LinkedIn search).
- The user types a **job title** and the platform returns the **best-matching open positions that exist** in the database, ranked by relevance:
  1. Exact title match first (e.g., "AI Developer" → positions titled exactly "AI Developer")
  2. Then close/partial matches (e.g., "Senior AI Developer", "AI Software Developer")
  3. Then broader matches from full-text search on the description
- Results appear as position cards (title, company, zone, date, source logo).
- If nothing matches, show a clear empty state with a suggestion to change the search terms.

## 2. Company identity — recognizable like a LinkedIn company page
- When the user clicks the company of a position, they land on the **company profile page**.
- The company must be immediately recognizable through a header that shows:
  - Company **logo** and **name**
  - **VAT number (Partita IVA)**
  - **Full address**
  - A **brief description of 1–2 lines** (like the tagline/about section of a LinkedIn company page)
- Below this header, the company's dashboard (open positions count, charts, list of its openings).
- Data model impact: the `companies` table must include `vat_number`, `address`, and `short_description` fields.

## 3. Daily positions management section
- The app must have a dedicated section where the user can **add and modify the newest positions daily**:
  - Add a new position (title, company, description, zone, source LinkedIn/Indeed/website, source URL, date)
  - Edit an existing position
  - Mark a position as closed
- The section should show the newest positions first (today / this week), so daily updating is fast.
- This works alongside direct data entry in Supabase — both must stay possible.

Update everything affected by these changes (screens, data model, routes, spec sections) and tell me exactly what you changed. UI copy in Italian.
```

---

## PROMPT 5 — Adopt the Nextly template as the frontend style

```
# JobSignal — Adopt the Nextly (web3templates) design style

## Context
This repo (https://github.com/ESSI-innovazione/jobsignals) is JobSignal, an internal web platform for TimeVision's HR team to discover and track open job positions at other companies (sources: LinkedIn, Indeed, company websites). It already contains a Next.js (App Router) + TypeScript + Tailwind scaffold with shadcn/ui set up. Data lives in the Supabase project `jobsignal`; deployment is on Vercel.

## Task
I want the frontend style of the whole app to be based on this free MIT-licensed template:
https://github.com/web3templates/nextly-template

It's a Next.js 14 + Tailwind landing page template (Headless UI, Heroicons, next-themes dark mode). Use it as the DESIGN LANGUAGE for JobSignal — do not blindly copy its landing-page sections.

Steps:
1. **Study the template** — clone or fetch https://github.com/web3templates/nextly-template and read its Tailwind config, global styles, and components (navbar, hero, buttons, cards, sections, footer, dark-mode handling). Extract its design system: color palette (indigo/trueGray tones), typography scale, spacing, border radius, shadows, and the light/dark theme approach.
2. **Apply it to our stack** — port that design system into THIS repo's Tailwind theme and existing shadcn/ui setup (CSS variables/tokens in globals.css + tailwind config). Keep our stack (App Router, shadcn/ui); adapt Nextly's look onto it. Do not downgrade our dependencies to match the template's.
3. **Restyle the JobSignal screens** in the Nextly style:
   - Home page: big centered search bar (job title search with best-match results), styled like Nextly's hero section
   - Position result cards: title, company, zone, date, source logo (LinkedIn / Indeed / company), in Nextly's card style
   - Company profile page: LinkedIn-style header (logo, name, VAT number / Partita IVA, address, 1–2 line description) + simple dashboard below
   - Daily positions management section (add/edit/close positions, newest first)
   - Notification settings (toggles per job title / company / source)
   - Login page
   - Shared navbar + footer in Nextly style, with dark mode toggle (next-themes)
4. **Attribution** — the template is MIT licensed: add a short attribution note (template name, author Surjith S M / Web3Templates, MIT) in the README or a CREDITS file, and keep its copyright notice with any copied code.

UI copy in Italian. When done, show me the list of files you changed and run the dev server so I can review the result.
```
