import { describe, it, expect } from "vitest";
import { aggregate } from "./search";
import type { JobResult } from "./types";

const job = (over: Partial<JobResult>): JobResult => ({
  id: over.id ?? "x", title: over.title ?? "Dev", company: over.company ?? "Acme",
  location: over.location ?? "Napoli", source: over.source ?? "jooble",
  url: over.url ?? "https://x", snippet: "", salary: over.salary, postedAt: over.postedAt,
});

describe("aggregate", () => {
  it("merges fulfilled sources, marks them ok, and ranks the union", async () => {
    const res = await aggregate("AI Developer", [
      { name: "jooble", fetch: async () => [job({ title: "AI Developer", url: "https://j" })] },
      { name: "indeed", fetch: async () => [job({ title: "Senior AI Developer", url: "https://i", source: "indeed" })] },
    ]);
    expect(res.sources).toEqual({ jooble: "ok", indeed: "ok" });
    expect(res.results.map((r) => r.title)).toEqual(["AI Developer", "Senior AI Developer"]);
  });

  it("marks a rejected source error and still returns the healthy one", async () => {
    const res = await aggregate("dev", [
      { name: "jooble", fetch: async () => [job({ url: "https://j" })] },
      { name: "indeed", fetch: async () => { throw new Error("boom"); } },
    ]);
    expect(res.sources).toEqual({ jooble: "ok", indeed: "error" });
    expect(res.results).toHaveLength(1);
  });

  it("marks a skipped source", async () => {
    const res = await aggregate("dev", [
      { name: "jooble", skipped: true, fetch: async () => [] },
    ]);
    expect(res.sources.jooble).toBe("skipped");
  });
});
