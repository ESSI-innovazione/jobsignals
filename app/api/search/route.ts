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
  const hasError = Object.values(body.sources).includes("error");
  if (!hasError) {
    cache.set(key, { at: Date.now(), body });
  }
  return Response.json(body);
}
