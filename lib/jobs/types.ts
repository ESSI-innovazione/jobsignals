export type JobSource = "jooble" | "indeed" | "linkedin" | "website";

export interface JobResult {
  id: string; // stable hash of source + url (dedupe / React key)
  title: string;
  company: string; // may be empty from some sources
  location: string;
  source: JobSource; // how we obtained it
  url: string; // original posting link (opens in a new tab)
  snippet: string; // short plain-text description
  salary?: string; // free-text, source-provided; often absent
  postedAt?: string; // ISO date (YYYY-MM-DD) if derivable
}

export const jobSourceLabels: Record<JobSource, string> = {
  jooble: "Jooble",
  indeed: "Indeed",
  linkedin: "LinkedIn",
  website: "Sito aziendale",
};
