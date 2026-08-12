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
1. **Positions feed** — a list of open positions. Each position card shows: job title, company name, zone/region, short description, publication date, and a **source logo** (LinkedIn logo, Indeed logo, or the company's own name/logo for direct website posts). Clicking a position opens the original posting URL (LinkedIn / Indeed / company site) in a new tab.
2. **Search engine** — HR can search and filter positions by: **job title**, **job description** (full-text search), and **zone/region**. Example: find exactly "AI Developer" in "Campania". Filters must be combinable.
3. **Company dashboards** — every tracked company has its own simple BI-style dashboard page: company info, number of open positions, positions over time, breakdown by source (LinkedIn / Indeed / website) and by zone, and the list of its current openings.
4. **Email notifications (cron job)** — a scheduled job checks for newly added positions and sends an email to HR users whenever new positions appear anywhere (LinkedIn, Indeed, company sites).
5. **Notification preferences** — each user can turn notifications **on/off per job title and per company** (and per source), so they only receive alerts for what they follow.
6. **Auth** — internal login for TimeVision users only (Supabase Auth).

## What I want from you in this session
1. Restate the **big picture** of the product in your own words: purpose, users, and main flows — so I can confirm you understood it correctly.
2. Propose the **screen map**: which pages exist and what is on each one.
3. Build a **clickable HTML mockup** of the main screens, following the attached design:
   - Home / positions feed (cards with source logos)
   - Search results with filters (job title, description, zone)
   - Company dashboard page (with simple charts)
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

1. **Overview** — product summary, goals, and non-goals. Explicit non-goals: no HubSpot/CRM integration, no automatic scraping in v1 (all data is inserted manually into Supabase by the admin).
2. **Users & roles** — `admin` (manages data directly in Supabase) and `user` (TimeVision HR: searches positions, views dashboards, manages own notification preferences).
3. **Tech stack** — Next.js (App Router) + TypeScript + Tailwind CSS, Supabase (Postgres, Auth, RLS), Vercel (hosting + Vercel Cron), a transactional email provider for notifications. Repo: https://github.com/ESSI-innovazione/jobsignals — Supabase project: `jobsignal`.
4. **Data model** — full Supabase schema with SQL:
   - `companies` (name, logo_url, website, zone/region, sector, notes, …)
   - `positions` (company_id, title, description, zone, source enum: `linkedin` | `indeed` | `website`, source_url, posted_at, status `open`/`closed`, …)
   - `profiles` (internal users)
   - `notification_preferences` (user_id, target_type: `job_title` | `company` | `source`, target_value, enabled)
   - `notification_log` (which position was notified, to whom, when — so the cron job never emails twice for the same position)
   Include indexes for full-text search on title + description, and Row Level Security policies for every table.
5. **Feature specs** — for each feature (feed, search, company dashboard, notifications, preferences, auth): expected behavior, edge cases, and acceptance criteria.
6. **Search** — exactly how the title / description / zone filters combine, and the Postgres full-text search approach.
7. **Cron job** — Vercel Cron schedule, the API endpoint it calls, how it detects "new positions since the last run", how it matches new positions against each user's notification preferences, and the email content (subject + body, in Italian, with a link to the position).
8. **Pages & routes** — the full route map, with what each page renders and which data it reads.
9. **UI language** — Italian.
10. **Milestones** — an ordered build plan in small steps (Step 1 = README + first push + Vercel deploy; then database schema; then positions feed; then search; then company dashboards; then notifications + preferences). Each milestone must end with a clear "done when…" checkpoint.

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
