"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Container } from "@/components/container";
import { SectionTitle } from "@/components/section-title";
import { FilterSelect, type FilterOption } from "@/components/filter-select";
import { JobResultCard } from "@/components/job-result-card";
import { jobSourceLabels, type JobResult, type JobSource } from "@/lib/jobs/types";
import { italianRegions } from "@/lib/sample-data";

type SourceStatus = "ok" | "error" | "skipped";

const DATE_FILTERS: FilterOption[] = [
  { value: "any", label: "Qualsiasi data" },
  { value: "24h", label: "Ultime 24 ore" },
  { value: "7d", label: "Ultima settimana" },
  { value: "30d", label: "Ultimo mese" },
];

// Each category maps to one representative keyword the live engine searches for.
const CATEGORIES: { value: string; label: string; query: string }[] = [
  { value: "all", label: "Tutte le categorie", query: "" },
  { value: "software", label: "Sviluppo software", query: "developer" },
  { value: "data-ai", label: "Data & AI", query: "data engineer" },
  { value: "devops", label: "DevOps & Cloud", query: "devops" },
  { value: "hr", label: "Risorse umane", query: "recruiter" },
  { value: "business", label: "Business & Analisi", query: "business analyst" },
];

const REGION_OPTIONS: FilterOption[] = [
  { value: "all", label: "Tutte le regioni" },
  { value: "Remoto", label: "Remoto" },
  ...italianRegions.map((r) => ({ value: r, label: r })),
];

// Recency filter applied to a result's postedAt (client-side, no refetch).
function withinDate(postedAt: string | undefined, filter: string): boolean {
  if (filter === "any") return true;
  if (!postedAt) return false; // undated results drop out when a recency filter is on
  const days = filter === "24h" ? 1 : filter === "7d" ? 7 : 30;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return postedAt >= cutoff.toISOString().slice(0, 10);
}

// The location string sent to the engine for a given region selection.
function whereFor(region: string): string {
  if (region === "all") return "Italia";
  if (region === "Remoto") return "Remote";
  return region;
}

export default function PosizioniPage() {
  const [text, setText] = useState("");
  const [category, setCategory] = useState("all");
  const [region, setRegion] = useState("all");
  const [dateFilter, setDateFilter] = useState("any");

  const [queryLabel, setQueryLabel] = useState("");
  const [results, setResults] = useState<JobResult[]>([]);
  const [sources, setSources] = useState<Record<string, SourceStatus>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [searched, setSearched] = useState(false);

  async function runSearch(nextText: string, nextCategory: string, nextRegion: string) {
    const cat = CATEGORIES.find((c) => c.value === nextCategory);
    const keywords = nextText.trim() || cat?.query || "";
    if (!keywords) {
      setSearched(false);
      setResults([]);
      setSources({});
      setError(false);
      return;
    }
    setQueryLabel(keywords);
    setLoading(true);
    setError(false);
    setSearched(true);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(keywords)}&where=${encodeURIComponent(
          whereFor(nextRegion)
        )}`
      );
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as {
        results: JobResult[];
        sources: Record<string, SourceStatus>;
      };
      setResults(data.results);
      setSources(data.sources);
    } catch {
      setError(true);
      setResults([]);
      setSources({});
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(
    () => results.filter((r) => withinDate(r.postedAt, dateFilter)),
    [results, dateFilter]
  );

  const okSources = Object.entries(sources)
    .filter(([, s]) => s === "ok")
    .map(([name]) => jobSourceLabels[name as JobSource] ?? name);
  const degraded = Object.entries(sources)
    .filter(([, s]) => s === "error")
    .map(([name]) => jobSourceLabels[name as JobSource] ?? name);

  const hasFilters =
    text.trim() !== "" || category !== "all" || region !== "all" || dateFilter !== "any";

  function reset() {
    setText("");
    setCategory("all");
    setRegion("all");
    setDateFilter("any");
    setSearched(false);
    setResults([]);
    setSources({});
    setError(false);
  }

  return (
    <Container className="max-w-4xl">
      <SectionTitle align="left" preTitle="Ricerca dal vivo" title="Posizioni aperte">
        Cerca le offerte di lavoro pubblicate ora su Indeed e Jooble. Digita un ruolo o
        scegli una categoria; clicca una posizione per aprire l&apos;annuncio originale.
      </SectionTitle>

      {/* Filter bar */}
      <div className="px-8 py-6 mt-6 bg-gray-100 rounded-2xl dark:bg-neutral-800">
        <form
          className="relative mb-4"
          onSubmit={(e) => {
            e.preventDefault();
            runSearch(text, category, region);
          }}
        >
          <MagnifyingGlassIcon className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 pointer-events-none left-5 top-1/2" />
          <input
            id="f-testo"
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Cerca una posizione, es. Developer"
            aria-label="Cerca una posizione"
            className="w-full py-4 pl-12 pr-5 text-lg text-gray-800 bg-white border border-gray-200 rounded-md shadow-sm placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:ring focus:ring-indigo-100 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:focus:ring-indigo-900"
          />
        </form>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FilterSelect
            label="Data pubblicazione"
            value={dateFilter}
            onChange={setDateFilter}
            options={DATE_FILTERS}
          />
          <FilterSelect
            label="Categoria"
            value={category}
            onChange={(v) => {
              setCategory(v);
              runSearch(text, v, region);
            }}
            options={CATEGORIES.map(({ value, label }) => ({ value, label }))}
          />
          <FilterSelect
            label="Regione"
            value={region}
            onChange={(v) => {
              setRegion(v);
              runSearch(text, category, v);
            }}
            options={REGION_OPTIONS}
          />
        </div>
        {hasFilters && (
          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={reset}
              className="text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Azzera filtri
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="pb-10 mt-6">
        {!searched ? (
          <div className="px-8 text-center bg-gray-100 rounded-2xl py-14 dark:bg-neutral-800">
            <p className="text-xl font-medium text-gray-800 dark:text-white">
              Cerca una posizione o scegli una categoria
            </p>
            <p className="mt-2 text-gray-500 dark:text-gray-300">
              Le offerte vengono recuperate dal vivo da Indeed e Jooble.
            </p>
          </div>
        ) : loading ? (
          <p className="text-center text-gray-500 py-14 dark:text-gray-300">
            Ricerca in corso…
          </p>
        ) : error ? (
          <div className="px-8 text-center bg-gray-100 rounded-2xl py-14 dark:bg-neutral-800">
            <p className="text-xl font-medium text-gray-800 dark:text-white">
              Si è verificato un errore durante la ricerca.
            </p>
            <p className="mt-2 text-gray-500 dark:text-gray-300">
              Riprova tra qualche istante.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-8 text-center bg-gray-100 rounded-2xl py-14 dark:bg-neutral-800">
            <p className="text-xl font-medium text-gray-800 dark:text-white">
              Nessuna posizione trovata per “{queryLabel}”.
            </p>
            <p className="mt-2 text-gray-500 dark:text-gray-300">
              Prova con un titolo più generico o allarga i filtri di data e regione.
            </p>
          </div>
        ) : (
          <>
            {degraded.length > 0 && (
              <p className="mb-4 text-sm text-amber-600 dark:text-amber-400">
                Alcune fonti non sono disponibili in questo momento ({degraded.join(", ")}).
                I risultati potrebbero essere parziali.
              </p>
            )}
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-300">
              <strong className="text-gray-800 dark:text-white">{filtered.length}</strong>{" "}
              {filtered.length === 1 ? "posizione trovata" : "posizioni trovate"}
              {okSources.length > 0 && <> · fonti: {okSources.join(", ")}</>}
            </p>
            <div className="flex flex-col gap-4">
              {filtered.map((job) => (
                <JobResultCard key={job.id} job={job} />
              ))}
            </div>
          </>
        )}

        <div className="mt-10 text-center">
          <Link
            href="/"
            className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            ← Torna alla ricerca principale
          </Link>
        </div>
      </div>
    </Container>
  );
}
