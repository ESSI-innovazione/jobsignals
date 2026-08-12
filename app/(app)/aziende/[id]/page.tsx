import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowTopRightOnSquareIcon,
  CheckIcon,
  MapPinIcon,
  IdentificationIcon,
} from "@heroicons/react/24/outline";
import { Container } from "@/components/container";
import { SourceChip } from "@/components/source-chip";
import {
  companyById,
  positions,
  sourceLabels,
  formatDate,
  type Source,
} from "@/lib/sample-data";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

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

function HBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="grid items-center grid-cols-[110px_1fr_28px] gap-3">
      <span className="text-sm font-medium text-gray-500 truncate dark:text-gray-300">{label}</span>
      <div className="h-3 overflow-hidden rounded bg-white dark:bg-neutral-900">
        <div className="h-full rounded" style={{ width: `${max ? (value / max) * 100 : 0}%`, backgroundColor: color }} />
      </div>
      <span className="text-sm font-bold text-right text-gray-800 tabular-nums dark:text-white">{value}</span>
    </div>
  );
}

const sourceColors: Record<Source, string> = {
  linkedin: "#0a66c2",
  indeed: "#2557a7",
  website: "#059669",
};

const MONTHS = ["Mar", "Apr", "Mag", "Giu", "Lug", "Ago"];
const MONTH_KEYS = ["2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08"];

export default async function AziendaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = companyById(id);
  if (!company) notFound();

  const all = positions.filter((p) => p.companyId === company.id);
  const open = all
    .filter((p) => p.status === "open")
    .sort((a, b) => b.postedAt.localeCompare(a.postedAt));

  const bySource = (["linkedin", "indeed", "website"] as Source[]).map((s) => ({
    source: s,
    count: open.filter((p) => p.source === s).length,
  }));
  const topSource = [...bySource].sort((a, b) => b.count - a.count)[0];
  const maxSource = Math.max(...bySource.map((b) => b.count), 1);

  const zones = [...new Set(open.map((p) => p.zone))].map((z) => ({
    zone: z,
    count: open.filter((p) => p.zone === z).length,
  }));
  const maxZone = Math.max(...zones.map((z) => z.count), 1);

  const perMonth = MONTH_KEYS.map(
    (m) => all.filter((p) => p.postedAt.startsWith(m)).length
  );
  const maxMonth = Math.max(...perMonth, 1);
  const pts = perMonth
    .map((v, i) => `${32 + i * 56},${130 - (v / maxMonth) * 100}`)
    .join(" L");

  return (
    <Container className="max-w-5xl">
      <p className="mb-4 text-sm font-medium text-gray-400">
        <Link href="/aziende" className="text-indigo-600 hover:underline dark:text-indigo-400">
          Aziende
        </Link>{" "}
        / {company.name}
      </p>

      {/* Identity header — LinkedIn-style */}
      <div className="flex flex-wrap items-start gap-6 px-8 py-8 bg-gray-100 rounded-2xl dark:bg-neutral-800">
        <span className="grid w-16 h-16 text-xl font-bold text-white bg-indigo-600 rounded-2xl place-items-center shrink-0">
          {initials(company.name)}
        </span>
        <div className="flex-1 min-w-[240px]">
          <h1 className="text-2xl font-bold tracking-tight text-gray-800 lg:text-3xl dark:text-white">
            {company.name}
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-300">
            {company.shortDescription}
          </p>
          <div className="flex flex-wrap items-center mt-3 text-sm text-gray-500 gap-x-5 gap-y-1 dark:text-gray-400">
            <span>{company.sector}</span>
            <span className="inline-flex items-center gap-1">
              <IdentificationIcon className="w-4 h-4" />
              P.IVA {company.vatNumber}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPinIcon className="w-4 h-4" />
              {company.address}
            </span>
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Sito web
              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
            </a>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-700 bg-indigo-100 rounded-full dark:bg-indigo-900 dark:text-indigo-200">
          <CheckIcon className="w-4 h-4" />
          Azienda seguita
        </span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 mt-6 sm:grid-cols-3">
        <Kpi value={String(open.length)} label="Posizioni aperte ora" note="+2 nell'ultimo mese" />
        <Kpi value={String(all.length)} label="Posizioni pubblicate nel 2026" note="da marzo 2026" />
        <Kpi
          value={sourceLabels[topSource.source]}
          label="Fonte principale"
          note={`${topSource.count} posizioni su ${open.length}`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 mt-4 lg:grid-cols-2">
        <div className="px-8 py-6 bg-gray-100 rounded-2xl dark:bg-neutral-800">
          <h2 className="font-bold text-gray-800 dark:text-white">
            Posizioni pubblicate per mese
          </h2>
          <p className="text-sm text-gray-400">Marzo – Agosto 2026</p>
          <svg viewBox="0 0 340 160" className="w-full mt-4" role="img" aria-label="Grafico a linea: posizioni pubblicate per mese">
            <g stroke="currentColor" strokeWidth="1" className="text-gray-200 dark:text-neutral-700">
              {[130, 96, 62, 28].map((y) => (
                <line key={y} x1="24" y1={y} x2="316" y2={y} />
              ))}
            </g>
            <path d={`M${pts} L312,130 L32,130 Z`} fill="#6366f1" opacity="0.12" />
            <path d={`M${pts}`} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {perMonth.map((v, i) => (
              <circle
                key={i}
                cx={32 + i * 56}
                cy={130 - (v / maxMonth) * 100}
                r="4"
                fill="#6366f1"
                stroke="#fff"
                strokeWidth="2"
              />
            ))}
            <g fontSize="10" className="fill-gray-400" textAnchor="middle">
              {MONTHS.map((m, i) => (
                <text key={m} x={32 + i * 56} y="150">
                  {m}
                </text>
              ))}
            </g>
          </svg>
        </div>

        <div className="px-8 py-6 bg-gray-100 rounded-2xl dark:bg-neutral-800">
          <h2 className="font-bold text-gray-800 dark:text-white">
            Posizioni aperte per fonte
          </h2>
          <p className="text-sm text-gray-400">{open.length} posizioni totali</p>
          <div className="flex flex-col gap-3 mt-4">
            {bySource.map((b) => (
              <HBar
                key={b.source}
                label={sourceLabels[b.source]}
                value={b.count}
                max={maxSource}
                color={sourceColors[b.source]}
              />
            ))}
          </div>
          <h2 className="mt-8 font-bold text-gray-800 dark:text-white">Per zona</h2>
          <p className="text-sm text-gray-400">Sedi delle posizioni aperte</p>
          <div className="flex flex-col gap-3 mt-4">
            {zones.map((z) => (
              <HBar key={z.zone} label={z.zone} value={z.count} max={maxZone} color="#6366f1" />
            ))}
          </div>
        </div>
      </div>

      {/* Openings table */}
      <div className="px-8 py-6 mt-4 mb-8 bg-gray-100 rounded-2xl dark:bg-neutral-800">
        <h2 className="font-bold text-gray-800 dark:text-white">
          Posizioni aperte ({open.length})
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs tracking-wider text-left text-gray-400 uppercase">
                <th className="px-3 pb-2 font-semibold">Posizione</th>
                <th className="px-3 pb-2 font-semibold">Zona</th>
                <th className="px-3 pb-2 font-semibold">Fonte</th>
                <th className="px-3 pb-2 font-semibold">Pubblicata</th>
                <th className="px-3 pb-2" />
              </tr>
            </thead>
            <tbody>
              {open.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-gray-200 dark:border-neutral-700"
                >
                  <td className="px-3 py-3 font-semibold text-gray-800 dark:text-white">
                    {p.title}
                  </td>
                  <td className="px-3 py-3 text-gray-500 dark:text-gray-300">{p.zone}</td>
                  <td className="px-3 py-3">
                    <SourceChip source={p.source} />
                  </td>
                  <td className="px-3 py-3 text-gray-500 dark:text-gray-300">
                    {formatDate(p.postedAt)}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <a
                      href={p.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      Apri ↗
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Container>
  );
}
