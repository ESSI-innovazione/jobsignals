"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Container } from "@/components/container";
import { PositionCard } from "@/components/position-card";
import { LogoMark } from "@/components/logo";
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
  const results = useMemo(() => search(query), [query]);

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
        <LogoMark className="w-14 h-14" />
        <div className="mt-5 text-5xl font-bold leading-none tracking-tight text-gray-800 lg:text-6xl dark:text-white">
          Job<span className="text-indigo-600 dark:text-indigo-400">Signal</span>
        </div>
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.35em] text-gray-500 dark:text-gray-300">
          TimeVision
        </p>
        <h1 className="mt-8 text-3xl font-bold leading-snug tracking-tight text-gray-800 lg:text-4xl dark:text-white">
          Cosa stai cercando?
        </h1>
        <p className="py-4 text-lg leading-normal text-gray-500 lg:text-xl dark:text-gray-300">
          Digita un ruolo e trova subito le posizioni aperte migliori.
        </p>

        <form
          className="flex flex-col w-full max-w-2xl gap-3 mt-4 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(input);
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
