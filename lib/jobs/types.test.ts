import { describe, it, expect } from "vitest";
import { jobSourceLabels } from "./types";

describe("jobSourceLabels", () => {
  it("has an Italian-facing label for every source", () => {
    expect(jobSourceLabels.jooble).toBe("Jooble");
    expect(jobSourceLabels.indeed).toBe("Indeed");
    expect(jobSourceLabels.website).toBe("Sito aziendale");
    expect(jobSourceLabels.linkedin).toBe("LinkedIn");
  });
});
