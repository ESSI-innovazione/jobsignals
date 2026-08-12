"use client";
import { useState } from "react";
import { Container } from "@/components/container";
import { SectionTitle } from "@/components/section-title";
import { SourceChip } from "@/components/source-chip";
import {
  companies,
  companyById,
  positions as seedPositions,
  formatDate,
  type Position,
  type Source,
} from "@/lib/sample-data";

const TODAY = "2026-08-12";
const WEEK_START = "2026-08-08";

const inputCls =
  "w-full px-4 py-2.5 text-gray-800 bg-white border border-gray-200 rounded-md placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:ring focus:ring-indigo-100 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:focus:ring-indigo-900";
const labelCls =
  "block mb-1.5 text-sm font-semibold text-gray-500 dark:text-gray-300";

function StatusPill({ status }: { status: Position["status"] }) {
  return status === "open" ? (
    <span className="inline-flex px-3 py-0.5 text-xs font-semibold text-indigo-700 bg-indigo-100 rounded-full dark:bg-indigo-900 dark:text-indigo-200">
      Aperta
    </span>
  ) : (
    <span className="inline-flex px-3 py-0.5 text-xs font-semibold text-gray-500 bg-white rounded-full dark:bg-neutral-900 dark:text-gray-400">
      Chiusa
    </span>
  );
}

function PositionsTable({
  rows,
  onToggle,
}: {
  rows: Position[];
  onToggle: (id: string) => void;
}) {
  if (rows.length === 0)
    return (
      <p className="px-3 py-4 text-sm text-gray-400">Nessuna posizione.</p>
    );
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs tracking-wider text-left text-gray-400 uppercase">
            <th className="px-3 pb-2 font-semibold">Posizione</th>
            <th className="px-3 pb-2 font-semibold">Azienda</th>
            <th className="px-3 pb-2 font-semibold">Zona</th>
            <th className="px-3 pb-2 font-semibold">Fonte</th>
            <th className="px-3 pb-2 font-semibold">Pubblicata</th>
            <th className="px-3 pb-2 font-semibold">Stato</th>
            <th className="px-3 pb-2" />
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} className="border-t border-gray-200 dark:border-neutral-700">
              <td className="px-3 py-3 font-semibold text-gray-800 dark:text-white">
                {p.title}
              </td>
              <td className="px-3 py-3 text-gray-500 dark:text-gray-300">
                {companyById(p.companyId)?.name}
              </td>
              <td className="px-3 py-3 text-gray-500 dark:text-gray-300">{p.zone}</td>
              <td className="px-3 py-3">
                <SourceChip source={p.source} />
              </td>
              <td className="px-3 py-3 text-gray-500 dark:text-gray-300 whitespace-nowrap">
                {formatDate(p.postedAt)}
              </td>
              <td className="px-3 py-3">
                <StatusPill status={p.status} />
              </td>
              <td className="px-3 py-3 text-right whitespace-nowrap">
                <button
                  type="button"
                  className="px-3 py-1.5 mr-2 text-xs font-semibold text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-200 dark:hover:bg-indigo-800"
                >
                  Modifica
                </button>
                <button
                  type="button"
                  onClick={() => onToggle(p.id)}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-500 bg-white border border-gray-200 rounded-md hover:text-indigo-600 hover:border-indigo-200 dark:bg-neutral-900 dark:border-neutral-700 dark:text-gray-300"
                >
                  {p.status === "open" ? "Chiudi" : "Riapri"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function GestionePage() {
  const [rows, setRows] = useState<Position[]>(
    [...seedPositions].sort((a, b) => b.postedAt.localeCompare(a.postedAt))
  );
  const [title, setTitle] = useState("");
  const [companyId, setCompanyId] = useState(companies[0].id);
  const [zone, setZone] = useState("");
  const [source, setSource] = useState<Source>("linkedin");
  const [url, setUrl] = useState("");
  const [date, setDate] = useState(TODAY);
  const [description, setDescription] = useState("");
  const [added, setAdded] = useState(false);

  function addPosition(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;
    setRows((prev) => [
      {
        id: `new-${Date.now()}`,
        companyId,
        title: title.trim(),
        description: description.trim(),
        zone: zone.trim() || "—",
        source,
        sourceUrl: url.trim(),
        postedAt: date,
        status: "open",
      },
      ...prev,
    ]);
    setTitle("");
    setZone("");
    setUrl("");
    setDescription("");
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  function toggle(id: string) {
    setRows((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status: p.status === "open" ? "closed" : "open" }
          : p
      )
    );
  }

  const today = rows.filter((p) => p.postedAt >= TODAY);
  const week = rows.filter((p) => p.postedAt >= WEEK_START && p.postedAt < TODAY);
  const older = rows.filter((p) => p.postedAt < WEEK_START);

  return (
    <Container className="max-w-5xl">
      <SectionTitle
        align="left"
        preTitle="Aggiornamento quotidiano"
        title="Gestione posizioni"
      >
        Aggiungi le posizioni trovate oggi e aggiorna quelle esistenti. Le
        modifiche sono subito visibili nel feed, nella ricerca e nei profili
        aziendali.
      </SectionTitle>

      {/* Add form */}
      <form
        onSubmit={addPosition}
        className="px-8 py-8 mt-6 bg-gray-100 rounded-2xl dark:bg-neutral-800"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="g-titolo" className={labelCls}>
              Titolo posizione *
            </label>
            <input
              id="g-titolo"
              className={inputCls}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="es. AI Developer"
              required
            />
          </div>
          <div>
            <label htmlFor="g-azienda" className={labelCls}>
              Azienda *
            </label>
            <select
              id="g-azienda"
              className={inputCls}
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="g-zona" className={labelCls}>
              Zona
            </label>
            <input
              id="g-zona"
              className={inputCls}
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              placeholder="es. Napoli"
            />
          </div>
          <div>
            <label htmlFor="g-fonte" className={labelCls}>
              Fonte *
            </label>
            <select
              id="g-fonte"
              className={inputCls}
              value={source}
              onChange={(e) => setSource(e.target.value as Source)}
            >
              <option value="linkedin">LinkedIn</option>
              <option value="indeed">Indeed</option>
              <option value="website">Sito aziendale</option>
            </select>
          </div>
          <div>
            <label htmlFor="g-url" className={labelCls}>
              URL annuncio *
            </label>
            <input
              id="g-url"
              type="url"
              className={inputCls}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              required
            />
          </div>
          <div>
            <label htmlFor="g-data" className={labelCls}>
              Data pubblicazione
            </label>
            <input
              id="g-data"
              type="date"
              className={inputCls}
              value={date}
              max={TODAY}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="md:col-span-3">
            <label htmlFor="g-desc" className={labelCls}>
              Descrizione
            </label>
            <textarea
              id="g-desc"
              rows={3}
              className={inputCls}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descrizione della posizione…"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-4 mt-5">
          {added && (
            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
              Posizione aggiunta ✓
            </span>
          )}
          <button
            type="submit"
            className="px-8 py-3 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            Aggiungi posizione
          </button>
        </div>
      </form>

      {/* Recent lists */}
      {[
        { label: "Oggi", data: today },
        { label: "Questa settimana", data: week },
        { label: "Precedenti", data: older },
      ].map(
        (group) =>
          group.data.length > 0 && (
            <section key={group.label}>
              <h2 className="mt-8 mb-3 text-sm font-bold tracking-wider text-gray-400 uppercase">
                {group.label}
              </h2>
              <div className="px-8 py-6 bg-gray-100 rounded-2xl dark:bg-neutral-800">
                <PositionsTable rows={group.data} onToggle={toggle} />
              </div>
            </section>
          )
      )}
      <div className="mb-8" />
    </Container>
  );
}
