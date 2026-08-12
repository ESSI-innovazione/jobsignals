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
