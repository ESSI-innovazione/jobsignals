import { dedupe, rank } from "./normalize";
import type { JobResult } from "./types";

export type SourceStatus = "ok" | "error" | "skipped";

export interface SearchResponse {
  results: JobResult[];
  sources: Record<string, SourceStatus>;
}

export interface SourceFetcher {
  name: string;
  skipped?: boolean;
  fetch: () => Promise<JobResult[]>;
}

export async function aggregate(
  query: string,
  fetchers: SourceFetcher[]
): Promise<SearchResponse> {
  const settled = await Promise.allSettled(fetchers.map((f) => f.fetch()));
  const sources: Record<string, SourceStatus> = {};
  const all: JobResult[] = [];
  settled.forEach((res, i) => {
    const f = fetchers[i];
    if (res.status === "fulfilled") {
      sources[f.name] = f.skipped ? "skipped" : "ok";
      all.push(...res.value);
    } else {
      sources[f.name] = "error";
      console.error(`[search] ${f.name} failed`, res.reason);
    }
  });
  return { results: rank(query, dedupe(all)), sources };
}
