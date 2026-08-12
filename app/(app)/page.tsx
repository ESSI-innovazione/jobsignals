"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Container } from "@/components/container";
import { PositionCard } from "@/components/position-card";
import { LogoMark } from "@/components/logo";
import { openPositions, type Position } from "@/lib/sample-data";

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
    <Container className="max-w-4xl">
      {/* Hero, Nextly-style */}
      <div className="flex flex-col items-center pt-10 text-center lg:pt-16">
        <LogoMark className="w-14 h-14" />
        <h1 className="mt-6 text-4xl font-bold leading-snug tracking-tight text-gray-800 lg:text-5xl lg:leading-tight dark:text-white">
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
  );
}
