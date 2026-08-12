import { Container } from "@/components/container";
import { SectionTitle } from "@/components/section-title";
import { PositionCard } from "@/components/position-card";
import { companies, openPositions } from "@/lib/sample-data";

function Kpi({ value, label, note }: { value: string; label: string; note?: string }) {
  return (
    <div className="px-8 py-6 bg-gray-100 rounded-2xl dark:bg-neutral-800">
      <div className="text-3xl font-bold tracking-tight text-gray-800 tabular-nums dark:text-white">
        {value}
      </div>
      <div className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-300">
        {label}
      </div>
      {note && (
        <div className="inline-block px-3 py-0.5 mt-3 text-xs font-semibold text-indigo-700 bg-indigo-100 rounded-full dark:bg-indigo-900 dark:text-indigo-200">
          {note}
        </div>
      )}
    </div>
  );
}

export default function PosizioniPage() {
  const open = openPositions();

  return (
    <Container className="max-w-4xl">
      <SectionTitle align="left" preTitle="Feed" title="Posizioni aperte">
        Le offerte di lavoro più recenti pubblicate dalle aziende monitorate.
        Clicca una posizione per aprire l&apos;annuncio originale.
      </SectionTitle>

      <div className="grid grid-cols-1 gap-4 mt-6 mb-8 sm:grid-cols-3">
        <Kpi value={String(open.length)} label="Posizioni aperte" note="+5 questa settimana" />
        <Kpi value={String(companies.length)} label="Aziende monitorate" note="+1 questo mese" />
        <Kpi value="3" label="Fonti attive" note="LinkedIn · Indeed · Siti" />
      </div>

      <div className="flex flex-col gap-4">
        {open.map((p) => (
          <PositionCard key={p.id} position={p} />
        ))}
      </div>
    </Container>
  );
}
