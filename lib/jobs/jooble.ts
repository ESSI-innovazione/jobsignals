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
