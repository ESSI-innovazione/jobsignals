import { describe, it, expect } from "vitest";
import { jobId, dedupe, rank } from "./normalize";
import type { JobResult } from "./types";

function make(p: Partial<JobResult>): JobResult {
  return {
    id: p.id ?? jobId(p.source ?? "jooble", p.url ?? "https://x/" + Math.random()),
    title: p.title ?? "Dev",
    company: p.company ?? "Acme",
    location: p.location ?? "Napoli",
    source: p.source ?? "jooble",
    url: p.url ?? "https://x",
    snippet: p.snippet ?? "",
    salary: p.salary,
    postedAt: p.postedAt,
  };
}

describe("jobId", () => {
  it("is stable and depends on source + url", () => {
    expect(jobId("indeed", "https://a")).toBe(jobId("indeed", "https://a"));
    expect(jobId("indeed", "https://a")).not.toBe(jobId("jooble", "https://a"));
  });
});

describe("dedupe", () => {
  it("collapses same title+company+location (case-insensitive), keeping the first", () => {
    const a = make({ url: "https://a", title: "AI Developer", company: "Acme", location: "Napoli", source: "jooble" });
    const b = make({ url: "https://b", title: "ai developer", company: "ACME", location: "napoli", source: "indeed" });
    const out = dedupe([a, b]);
    expect(out).toHaveLength(1);
    expect(out[0].url).toBe("https://a");
  });

  it("keeps distinct postings", () => {
    const a = make({ title: "AI Developer", company: "Acme" });
    const b = make({ title: "Data Engineer", company: "Acme" });
    expect(dedupe([a, b])).toHaveLength(2);
  });
});

describe("rank", () => {
  it("orders exact title, then all-words-in-title, then the rest", () => {
    const exact = make({ title: "AI Developer", postedAt: "2026-01-01" });
    const words = make({ title: "Senior AI Developer", postedAt: "2026-08-01" });
    const other = make({ title: "Data Engineer", postedAt: "2026-08-10" });
    const out = rank("AI Developer", [other, words, exact]);
    expect(out.map((r) => r.title)).toEqual(["AI Developer", "Senior AI Developer", "Data Engineer"]);
  });

  it("tie-breaks by postedAt desc within a tier", () => {
    const older = make({ title: "AI Developer Junior", postedAt: "2026-01-01" });
    const newer = make({ title: "AI Developer Senior", postedAt: "2026-08-01" });
    const out = rank("AI Developer", [older, newer]);
    expect(out.map((r) => r.title)).toEqual(["AI Developer Senior", "AI Developer Junior"]);
  });
});
