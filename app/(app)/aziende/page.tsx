import Link from "next/link";
import { Container } from "@/components/container";
import { SectionTitle } from "@/components/section-title";
import { companies, positions } from "@/lib/sample-data";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default function AziendePage() {
  const withCounts = companies
    .map((c) => ({
      ...c,
      openCount: positions.filter(
        (p) => p.companyId === c.id && p.status === "open"
      ).length,
    }))
    .sort((a, b) => b.openCount - a.openCount || a.name.localeCompare(b.name));

  return (
    <Container className="max-w-5xl">
      <SectionTitle align="left" preTitle="Monitoraggio" title="Aziende">
        Le aziende monitorate da TimeVision. Apri una scheda per vedere il
        profilo con l&apos;andamento delle posizioni.
      </SectionTitle>

      <div className="grid grid-cols-1 gap-4 mt-6 md:grid-cols-2">
        {withCounts.map((c) => (
          <Link
            key={c.id}
            href={`/aziende/${c.id}`}
            className="flex items-center gap-5 px-8 bg-gray-100 rounded-2xl py-7 dark:bg-neutral-800 transition-colors hover:bg-gray-200/70 dark:hover:bg-neutral-700 focus:outline-none focus-visible:ring focus-visible:ring-indigo-100 dark:focus-visible:ring-indigo-900"
          >
            <span className="grid w-12 h-12 text-base font-bold text-white bg-indigo-600 rounded-xl place-items-center shrink-0">
              {initials(c.name)}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-bold text-gray-800 dark:text-white">
                {c.name}
              </span>
              <span className="block text-sm text-gray-500 dark:text-gray-300">
                {c.sector} · {c.zone}
              </span>
            </span>
            <span className="text-right">
              <span className="block text-2xl font-bold text-gray-800 tabular-nums dark:text-white">
                {c.openCount}
              </span>
              <span className="block text-xs font-medium text-gray-400">
                posizioni
              </span>
            </span>
          </Link>
        ))}
      </div>
    </Container>
  );
}
