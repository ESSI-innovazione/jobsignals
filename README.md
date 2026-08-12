# JobSignal

Internal **TimeVision** platform to discover and track **open job positions at other companies**, collected from three kinds of sources:

- **LinkedIn** posts
- **Indeed** listings
- Company **career pages / websites**

JobSignal is **not** a public job board: only internal TimeVision users (mainly the HR/recruiting team) can log in. All data is entered manually by the admin directly into Supabase — the app reads it, makes it searchable, and sends email alerts.

## Features

- **Positions feed** — the latest openings, each card linking to the original posting with its source clearly labeled
- **Search** — combinable filters: job title, full-text description search (Italian), zone/region
- **Company dashboards** — per-company BI view: openings over time, breakdown by source and by zone, current openings
- **Email notifications** — a daily cron job alerts each user about new positions matching their followed job titles, companies, and sources
- **Notification preferences** — per-user toggles for roles, companies, and sources
- **Internal auth** — Supabase Auth, no public signup

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS
- [Supabase](https://supabase.com) — Postgres, Auth, Row Level Security (project: `jobsignal`)
- [Vercel](https://vercel.com) — hosting + Vercel Cron
- Transactional email provider for notifications

Full technical specification: [SPEC.md](SPEC.md) · Clickable mockup: [mockup/jobsignal-mockup.html](mockup/jobsignal-mockup.html)

## Development

```bash
npm install
npm run dev
```

UI language: **Italian**.
