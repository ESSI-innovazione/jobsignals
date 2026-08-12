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

const HTML_ENTITIES: Record<string, string> = {
  nbsp: " ",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  agrave: "à",
  egrave: "è",
  eacute: "é",
  igrave: "ì",
  ograve: "ò",
  ugrave: "ù",
};

export function stripHtml(s: string): string {
  return (s ?? "")
    .replace(/<[^>]*>/g, " ")
    // decode numeric entities (&#224; &#xE8; …) and the common named ones —
    // Jooble snippets are full of &nbsp; that otherwise leak into the UI
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (m, name) => HTML_ENTITIES[name.toLowerCase()] ?? m)
    .replace(/\s+/g, " ")
    .trim();
}

// Jooble matches locations by English name and returns nothing for the
// Italian spellings the app uses (e.g. "Italia" → 0 results, "Italy" → 16).
// Translate the country and the major Italian cities; anything not listed
// (Salerno, Caserta, Benevento, Sorrento… — same in English) passes through.
const JOOBLE_LOCATION_ALIASES: Record<string, string> = {
  italia: "Italy",
  roma: "Rome",
  milano: "Milan",
  napoli: "Naples",
  torino: "Turin",
  firenze: "Florence",
  venezia: "Venice",
  genova: "Genoa",
  padova: "Padua",
};

export function normalizeJoobleLocation(location: string): string {
  const key = (location ?? "").trim().toLowerCase();
  return JOOBLE_LOCATION_ALIASES[key] ?? location;
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
    body: JSON.stringify({
      keywords: query,
      location: normalizeJoobleLocation(where),
      page: 1,
      ResultOnPage: 50,
    }),
    signal: opts.signal,
  });
  if (!res.ok) throw new Error(`Jooble responded ${res.status}`);
  const data = (await res.json()) as { jobs?: JoobleJob[] };
  return (data.jobs ?? []).map(mapJoobleJob);
}
