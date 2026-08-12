"use client";
import { useMemo, useState } from "react";
import {
  MagnifyingGlassIcon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  SignalIcon,
} from "@heroicons/react/24/outline";
import { Container } from "@/components/container";
import { SectionTitle } from "@/components/section-title";
import { PositionCard } from "@/components/position-card";
import { FilterSelect, type FilterOption } from "@/components/filter-select";
import {
  companies,
  openPositions,
  italianRegions,
  regionOf,
} from "@/lib/sample-data";

// Sample data is static, so "today" is pinned for deterministic date filters.
const TODAY = "2026-08-12";

function cutoffFor(value: string): string | null {
  const days = value === "24h" ? 1 : value === "7d" ? 7 : value === "30d" ? 30 : null;
  if (days === null) return null;
  const d = new Date(TODAY + "T12:00:00");
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

const DATE_FILTERS: FilterOption[] = [
  { value: "any", label: "Qualsiasi data" },
  { value: "24h", label: "Ultime 24 ore" },
  { value: "7d", label: "Ultima settimana" },
  { value: "30d", label: "Ultimo mese" },
];

// Role categories matched against the position title.
const CATEGORIES = [
  { value: "all", label: "Tutte le categorie", keywords: [] as string[] },
  {
    value: "software",
    label: "Sviluppo software",
    keywords: ["developer", "sviluppatore", "software", "frontend", "backend", "full-stack", "fullstack", "java"],
  },
  {
    value: "data-ai",
    label: "Data & AI",
    keywords: ["data", "ai ", "ai developer", "machine learning", "analytics", "bi "],
  },
  {
    value: "devops",
    label: "DevOps & Cloud",
    keywords: ["devops", "cloud", "sre", "sistemista"],
  },
  {
    value: "hr",
    label: "Risorse umane",
    keywords: ["hr", "recruiter", "risorse umane", "people"],
  },
  {
    value: "business",
    label: "Business & Analisi",
    keywords: ["business", "analyst", "sales", "account", "project manager"],
  },
];

const REGION_OPTIONS: FilterOption[] = [
  { value: "all", label: "Tutte le regioni" },
  { value: "Remoto", label: "Remoto" },
  ...italianRegions.map((r) => ({ value: r, label: r })),
];

function StatChip({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-full dark:bg-neutral-800 dark:text-gray-300">
      <span className="text-indigo-600 dark:text-indigo-400">{icon}</span>
      {children}
    </span>
  );
}

export default function PosizioniPage() {
  const [text, setText] = useState("");
  const [dateFilter, setDateFilter] = useState("any");
  const [category, setCategory] = useState("all");
  const [region, setRegion] = useState("all");

  const open = openPositions();

  const filtered = useMemo(() => {
    const cutoff = cutoffFor(dateFilter);
    const cat = CATEGORIES.find((c) => c.value === category);
    const q = text.trim().toLowerCase();

    return open.filter((p) => {
      const title = p.title.toLowerCase();
      if (q && !title.includes(q)) return false;
      if (cutoff && p.postedAt < cutoff) return false;
      if (cat && cat.value !== "all" && !cat.keywords.some((k) => title.includes(k.trim())))
        return false;
      if (region !== "all") {
        const r = regionOf(p.zone);
        if (region === "Remoto" ? r !== "Remoto" : r !== region) return false;
      }
      return true;
    });
  }, [open, text, dateFilter, category, region]);

  const hasFilters =
    text.trim() !== "" || dateFilter !== "any" || category !== "all" || region !== "all";

  const newThisWeek = open.filter((p) => p.postedAt >= "2026-08-05").length;

  return (
    <Container className="max-w-4xl">
      <SectionTitle align="left" preTitle="Feed" title="Posizioni aperte">
        Le offerte di lavoro più recenti pubblicate dalle aziende monitorate.
        Clicca una posizione per aprire l&apos;annuncio originale.
      </SectionTitle>

      {/* Compact stats strip */}
      <div className="flex flex-wrap items-center gap-3 mt-6">
        <StatChip icon={<BriefcaseIcon className="w-4 h-4" />}>
          <strong className="text-gray-800 dark:text-white">{open.length}</strong>
          &nbsp;posizioni aperte
        </StatChip>
        <StatChip icon={<BuildingOffice2Icon className="w-4 h-4" />}>
          <strong className="text-gray-800 dark:text-white">{companies.length}</strong>
          &nbsp;aziende monitorate
        </StatChip>
        <StatChip icon={<SignalIcon className="w-4 h-4" />}>
          <strong className="text-gray-800 dark:text-white">{newThisWeek}</strong>
          &nbsp;nuove questa settimana
        </StatChip>
      </div>

      {/* Filter bar */}
      <div className="px-8 py-6 mt-5 bg-gray-100 rounded-2xl dark:bg-neutral-800">
        <div className="relative mb-4">
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
        </div>
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
            onChange={setCategory}
            options={CATEGORIES.map(({ value, label }) => ({ value, label }))}
          />
          <FilterSelect
            label="Regione"
            value={region}
            onChange={setRegion}
            options={REGION_OPTIONS}
          />
        </div>
        {hasFilters && (
          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={() => {
                setText("");
                setDateFilter("any");
                setCategory("all");
                setRegion("all");
              }}
              className="text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Azzera filtri
            </button>
          </div>
        )}
      </div>

      {/* Result count */}
      <p className="mt-6 mb-4 text-sm text-gray-500 dark:text-gray-300">
        <strong className="text-gray-800 dark:text-white">{filtered.length}</strong>{" "}
        {filtered.length === 1 ? "posizione" : "posizioni"} · ordinate per data di
        pubblicazione
      </p>

      {filtered.length === 0 ? (
        <div className="px-8 mb-8 text-center bg-gray-100 rounded-2xl py-14 dark:bg-neutral-800">
          <p className="text-xl font-medium text-gray-800 dark:text-white">
            Nessuna posizione corrisponde ai filtri.
          </p>
          <p className="mt-2 text-gray-500 dark:text-gray-300">
            Prova ad allargare la data, la categoria o la regione.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 mb-8">
          {filtered.map((p) => (
            <PositionCard key={p.id} position={p} />
          ))}
        </div>
      )}
    </Container>
  );
}
