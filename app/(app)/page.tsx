"use client";
import { useState } from "react";
import Link from "next/link";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Container } from "@/components/container";
import { TimeVisionLogo } from "@/components/timevision-logo";
import { CanvasRevealEffect } from "@/components/ui/sign-in-flow-1";
import { ImageStreamHero } from "@/components/ui/image-stream-hero";
import { JobResultCard } from "@/components/job-result-card";
import type { JobResult } from "@/lib/jobs/types";

type SourceStatus = "ok" | "error" | "skipped";

// Corridor images: TimeVision photos (www.timevision.it, self-hosted in
// /public/hero) interleaved with the three source-brand tiles.
const HERO_IMAGES = [
  { src: "/hero/tv-2148721299.webp" },
  { src: "/hero/linkedin.svg" },
  { src: "/hero/tv-2149241039.webp" },
  { src: "/hero/tv-614.webp" },
  { src: "/hero/indeed.svg" },
  { src: "/hero/tv-2148908931.webp" },
  { src: "/hero/tv-396755.webp" },
  { src: "/hero/website.svg" },
  { src: "/hero/tv-2149283319.webp" },
  { src: "/hero/tv-3144.webp" },
];

export default function HomePage() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<JobResult[]>([]);
  const [sources, setSources] = useState<Record<string, SourceStatus>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [searched, setSearched] = useState(false);

  async function runSearch(q: string) {
    const term = q.trim();
    if (!term) return;
    setQuery(term);
    setLoading(true);
    setError(false);
    setSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { results: JobResult[]; sources: Record<string, SourceStatus> };
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

  const degraded = Object.entries(sources)
    .filter(([, s]) => s === "error")
    .map(([name]) => (name === "indeed" ? "Indeed" : name === "jooble" ? "Jooble" : name));

  return (
    // The background layer is FIXED so it covers the whole viewport (behind
    // navbar and footer too). It follows the theme toggle: dark = the
    // reference image (black with a violet glow from below), light = white
    // with a soft lavender glow. Content uses its normal light/dark styles.
    <div className="relative flex-1 w-full flex flex-col">
      <div className="fixed inset-0 -z-10 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 bg-white dark:bg-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_140%_90%_at_50%_120%,#c4b5fd_0%,#ddd6fe_25%,#ede9fe_50%,#ffffff_82%)] dark:bg-[radial-gradient(ellipse_140%_90%_at_50%_120%,#7c3aed_0%,#5b21b6_25%,#3b0764_50%,#17053a_68%,#000000_88%)]" />
        {/* Subtle dot-matrix reveal on top of the gradient (violet: visible on both themes) */}
        <CanvasRevealEffect
          animationSpeed={3}
          containerClassName="bg-transparent"
          colors={[
            [139, 92, 246],
            [124, 58, 237],
          ]}
          dotSize={4}
          opacities={[0.06, 0.06, 0.08, 0.08, 0.1, 0.1, 0.12, 0.14, 0.16, 0.18]}
          showGradient={false}
          reverse={false}
        />
      </div>

      {/* Hero: image-stream corridor of TimeVision photos + source tiles */}
      <ImageStreamHero
        images={HERO_IMAGES}
        cards={9}
        speed={18}
        axis={55}
        // 88px = navbar height (p-6 + 40px content): the hero fills the rest
        // of the first screen so the footer starts below the fold.
        className="relative z-10 w-full flex-1 min-h-[520px] sm:min-h-[calc(100svh-88px)]"
      >
        {/* readability scrim over the corridor's centre */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_60%_65%_at_50%_50%,rgba(255,255,255,0.9)_0%,rgba(255,255,255,0.45)_55%,transparent_78%)] dark:bg-[radial-gradient(ellipse_60%_65%_at_50%_50%,rgba(0,0,0,0.85)_0%,rgba(0,0,0,0.4)_55%,transparent_78%)]"
        />
        <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-6 text-center">
        <TimeVisionLogo className="h-12 w-auto text-[#034b72] lg:h-14 dark:text-white" />
        <div className="mt-6 text-5xl font-bold leading-none tracking-tight text-gray-800 lg:text-6xl dark:text-white">
          Job<span className="text-indigo-600 dark:text-indigo-400">Signal</span>
        </div>
        <h1 className="mt-8 text-3xl font-bold leading-snug tracking-tight text-gray-800 lg:text-4xl dark:text-white">
          Cosa stai cercando?
        </h1>
        <div className="py-3" />

        <form
          className="flex flex-col w-full max-w-2xl gap-3 mt-4 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            runSearch(input);
          }}
        >
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 pointer-events-none left-5 top-1/2" />
            <input
              type="search"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="es. AI Developer"
              aria-label="Cerca un ruolo"
              autoFocus
              autoComplete="off"
              className="w-full py-4 pl-12 pr-5 text-lg text-gray-800 bg-white border border-gray-200 rounded-md shadow-sm placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:ring focus:ring-indigo-100 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:focus:ring-indigo-900"
            />
          </div>
          <button
            type="submit"
            className="px-8 py-4 text-lg font-medium text-center text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            Cerca
          </button>
        </form>
        <p className="mt-4 text-sm text-gray-400 dark:text-gray-500">
          es. AI Developer · Data Engineer · HR Specialist
        </p>
        </div>
      </ImageStreamHero>

      <Container className="relative z-10 max-w-4xl">
        {searched && (
          <div className="pb-10">
            {loading ? (
              <p className="mt-14 text-center text-gray-500 dark:text-gray-300">
                Ricerca in corso…
              </p>
            ) : error ? (
              <div className="px-8 mt-14 text-center bg-gray-100 rounded-2xl py-14 dark:bg-neutral-800">
                <p className="text-xl font-medium text-gray-800 dark:text-white">
                  Si è verificato un errore durante la ricerca.
                </p>
                <p className="mt-2 text-gray-500 dark:text-gray-300">Riprova tra qualche istante.</p>
              </div>
            ) : results.length === 0 ? (
              <div className="px-8 mt-14 text-center bg-gray-100 rounded-2xl py-14 dark:bg-neutral-800">
                <p className="text-xl font-medium text-gray-800 dark:text-white">
                  Nessuna posizione trovata per “{query}”.
                </p>
                <p className="mt-2 text-gray-500 dark:text-gray-300">
                  Prova con un titolo più generico (es. “Developer” invece di “React Developer Senior”).
                </p>
              </div>
            ) : (
              <>
                {degraded.length > 0 && (
                  <p className="mt-8 text-sm text-amber-600 dark:text-amber-400">
                    Alcune fonti non sono disponibili in questo momento ({degraded.join(", ")}). I risultati potrebbero essere parziali.
                  </p>
                )}
                <p className="mt-8 mb-4 text-sm font-medium text-gray-500 dark:text-gray-300">
                  {results.length} posizioni trovate per “{query}”
                </p>
                <div className="flex flex-col gap-4">
                  {results.map((job) => (
                    <JobResultCard key={job.id} job={job} />
                  ))}
                </div>
              </>
            )}
            <div className="mt-10 text-center">
              <Link href="/posizioni" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                Vedi tutte le posizioni aperte →
              </Link>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
