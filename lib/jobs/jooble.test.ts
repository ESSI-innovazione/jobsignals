import { describe, it, expect, vi, afterEach } from "vitest";
import { stripHtml, mapJoobleJob, searchJooble } from "./jooble";

afterEach(() => vi.restoreAllMocks());

describe("stripHtml", () => {
  it("removes tags and collapses whitespace", () => {
    expect(stripHtml("<b>AI</b>   <i>Dev</i>")).toBe("AI Dev");
  });
});

describe("mapJoobleJob", () => {
  it("maps Jooble fields to JobResult", () => {
    const r = mapJoobleJob({
      title: "AI Developer",
      location: "Napoli",
      snippet: "<p>Great <b>role</b></p>",
      salary: "",
      source: "Indeed",
      type: "Full-time",
      link: "https://jooble.org/desc/1",
      company: "Acme",
      updated: "2026-08-11T10:00:00.0000000",
      id: 123,
    });
    expect(r).toMatchObject({
      title: "AI Developer",
      company: "Acme",
      location: "Napoli",
      source: "jooble",
      url: "https://jooble.org/desc/1",
      snippet: "Great role",
      postedAt: "2026-08-11",
    });
    expect(r.salary).toBeUndefined();
    expect(r.id).toHaveLength(16);
  });
});

describe("searchJooble", () => {
  it("returns [] and does not fetch when no API key", async () => {
    const spy = vi.spyOn(globalThis, "fetch");
    const out = await searchJooble("dev", "Italia", { apiKey: undefined });
    expect(out).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });

  it("POSTs to the keyed endpoint and maps jobs", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ jobs: [{ title: "Dev", link: "https://j/1", company: "Acme", location: "Roma", snippet: "hi", salary: "", updated: "2026-08-01T00:00:00" }] }), { status: 200 })
    );
    const out = await searchJooble("dev", "Italia", { apiKey: "KEY123" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://jooble.org/api/KEY123",
      expect.objectContaining({ method: "POST" })
    );
    expect(out).toHaveLength(1);
    expect(out[0].source).toBe("jooble");
  });

  it("throws on non-2xx", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("nope", { status: 403 }));
    await expect(searchJooble("dev", "Italia", { apiKey: "KEY123" })).rejects.toThrow(/403/);
  });
});
