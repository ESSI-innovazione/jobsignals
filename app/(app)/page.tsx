"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Container } from "@/components/container";
import { PositionCard } from "@/components/position-card";
import { SourceChip } from "@/components/source-chip";
import { TimeVisionLogo } from "@/components/timevision-logo";
import { companyById } from "@/lib/sample-data";
import { CanvasRevealEffect } from "@/components/ui/sign-in-flow-1";
import { ImageStreamHero } from "@/components/ui/image-stream-hero";
import { openPositions, type Position } from "@/lib/sample-data";

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

interface TieredResults {
  exact: Position[];
  similar: Position[];
  description: Position[];
  total: number;
}

// Relevance tiers per SPEC §6.1: exact title → all query words in title → description match.
function search(q: string): TieredResults {
  const query = q.trim().toLowerCase();
  const words = query.split(/\s+/).filter(Boolean);
  const exact: Position[] = [];
  const similar: Position[] = [];
  const description: Position[] = [];

  if (words.length > 0) {
    for (const p of openPositions()) {
      const title = p.title.toLowerCase();
      if (title === query) exact.push(p);
      else if (words.every((w) => title.includes(w))) similar.push(p);
      else if (words.some((w) => p.description.toLowerCase().includes(w)))
        description.push(p);
    }
  }
  return {
    exact,
    similar,
    description,
    total: exact.length + similar.length + description.length,
  };
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9àèéìíòóùú]+/)
    .filter(Boolean);
}

// Live "top 5" ranking for the search-as-you-type dropdown: cosine
// similarity between the query and each open position, with title tokens
// weighted 3x over description tokens, plus a boost for exact/contained
// title matches so intuitive matches always float to the top.
function rankTop(q: string, limit = 5): { position: Position; score: number }[] {
  const query = q.trim().toLowerCase();
  const qTokens = tokenize(query);
  if (qTokens.length === 0) return [];

  const qv = new Map<string, number>();
  qTokens.forEach((t) => qv.set(t, (qv.get(t) ?? 0) + 1));
  const qNorm = Math.sqrt(
    [...qv.values()].reduce((sum, v) => sum + v * v, 0)
  );

  return openPositions()
    .map((position) => {
      const dv = new Map<string, number>();
      tokenize(position.title).forEach((t) => dv.set(t, (dv.get(t) ?? 0) + 3));
      tokenize(position.description).forEach((t) =>
        dv.set(t, (dv.get(t) ?? 0) + 1)
      );
      const dNorm = Math.sqrt(
        [...dv.values()].reduce((sum, v) => sum + v * v, 0)
      );
      let dot = 0;
      qv.forEach((v, t) => {
        dot += v * (dv.get(t) ?? 0);
      });
      let score = dNorm > 0 ? dot / (qNorm * dNorm) : 0;

      const title = position.title.toLowerCase();
      if (title === query) score += 1;
      else if (title.includes(query)) score += 0.5;

      return { position, score };
    })
    .filter((x) => x.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.position.postedAt.localeCompare(a.position.postedAt)
    )
    .slice(0, limit);
}

function TierLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 mt-10 mb-5">
      <span className="text-sm font-bold tracking-wider text-indigo-600 uppercase dark:text-indigo-400">
        {children}
      </span>
      <span className="flex-1 h-px bg-gray-100 dark:bg-neutral-700" />
    </div>
  );
}

export default function HomePage() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const results = useMemo(() => search(query), [query]);
  const suggestions = useMemo(() => rankTop(input), [input]);
  const showSuggestions = focused && input.trim().length >= 2;

  return (
    // The background layer is FIXED so it covers the whole viewport (behind
    // navbar and footer too). It follows the theme toggle: dark = the
    // reference image (black with a violet glow from below), light = white
    // with a soft lavender glow. Content uses its normal light/dark styles.
    <div className="relative flex-1 w-full">
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
        className="relative z-10 h-[520px] w-full sm:h-[580px]"
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
            setQuery(input);
            setFocused(false);
          }}
        >
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 pointer-events-none left-5 top-1/2" />
            <input
              type="search"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="es. AI Developer"
              aria-label="Cerca un ruolo"
              autoFocus
              autoComplete="off"
              className="w-full py-4 pl-12 pr-5 text-lg text-gray-800 bg-white border border-gray-200 rounded-md shadow-sm placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:ring focus:ring-indigo-100 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:focus:ring-indigo-900"
            />

            {/* Google-style live suggestions: top 5 by cosine similarity */}
            {showSuggestions && (
              <div className="absolute left-0 right-0 z-20 mt-2 overflow-hidden text-left bg-white border border-gray-200 rounded-md shadow-lg top-full dark:bg-neutral-800 dark:border-neutral-700">
                {suggestions.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-gray-500 dark:text-gray-300">
                    Nessuna posizione trovata per “{input.trim()}”.
                  </p>
                ) : (
                  <>
                    {suggestions.map(({ position: p }) => (
                      <a
                        key={p.id}
                        href={p.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onMouseDown={(e) => e.preventDefault()}
                        className="flex items-center gap-3 px-5 py-3 transition-colors border-b border-gray-100 hover:bg-gray-50 dark:border-neutral-700 dark:hover:bg-neutral-700"
                      >
                        <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-semibold text-gray-800 truncate dark:text-white">
                            {p.title}
                          </span>
                          <span className="block text-xs text-gray-500 truncate dark:text-gray-300">
                            {companyById(p.companyId)?.name} · {p.zone}
                          </span>
                        </span>
                        <SourceChip source={p.source} />
                      </a>
                    ))}
                    <button
                      type="submit"
                      onMouseDown={(e) => e.preventDefault()}
                      className="w-full px-5 py-3 text-sm font-semibold text-left text-indigo-600 bg-gray-50 hover:bg-gray-100 dark:bg-neutral-900 dark:text-indigo-400 dark:hover:bg-neutral-700"
                    >
                      Vedi tutti i risultati per “{input.trim()}” →
                    </button>
                  </>
                )}
              </div>
            )}
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
      {/* Results */}
      {query.trim() !== "" && (
        <div className="pb-10">
          {results.total === 0 ? (
            <div className="px-8 mt-14 text-center bg-gray-100 rounded-2xl py-14 dark:bg-neutral-800">
              <p className="text-xl font-medium text-gray-800 dark:text-white">
                Nessuna posizione trovata per “{query.trim()}”.
              </p>
              <p className="mt-2 text-gray-500 dark:text-gray-300">
                Prova con un titolo più generico (es. “Developer” invece di
                “React Developer Senior”).
              </p>
            </div>
          ) : (
            <>
              {results.exact.length > 0 && (
                <>
                  <TierLabel>Corrispondenza esatta</TierLabel>
                  <div className="flex flex-col gap-4">
                    {results.exact.map((p) => (
                      <PositionCard key={p.id} position={p} />
                    ))}
                  </div>
                </>
              )}
              {results.similar.length > 0 && (
                <>
                  <TierLabel>Corrispondenze simili</TierLabel>
                  <div className="flex flex-col gap-4">
                    {results.similar.map((p) => (
                      <PositionCard key={p.id} position={p} />
                    ))}
                  </div>
                </>
              )}
              {results.description.length > 0 && (
                <>
                  <TierLabel>Dalle descrizioni</TierLabel>
                  <div className="flex flex-col gap-4">
                    {results.description.map((p) => (
                      <PositionCard key={p.id} position={p} />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
          <div className="mt-10 text-center">
            <Link
              href="/posizioni"
              className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Vedi tutte le posizioni aperte →
            </Link>
          </div>
        </div>
      )}
      </Container>
    </div>
  );
}
