"use client";
import { useState } from "react";
import { Switch } from "@headlessui/react";
import { Container } from "@/components/container";
import { SectionTitle } from "@/components/section-title";
import { SourceChip } from "@/components/source-chip";
import { companies, sourceLabels, type Source } from "@/lib/sample-data";

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <Switch
      checked={checked}
      onChange={onChange}
      className={`${
        checked ? "bg-indigo-600" : "bg-gray-300 dark:bg-neutral-600"
      } relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring focus-visible:ring-indigo-100 dark:focus-visible:ring-indigo-900`}
    >
      <span className="sr-only">{label}</span>
      <span
        className={`${
          checked ? "translate-x-6" : "translate-x-1"
        } inline-block h-4 w-4 rounded-full bg-white transition-transform`}
      />
    </Switch>
  );
}

function PrefSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="px-8 py-7 mt-4 bg-gray-100 rounded-2xl dark:bg-neutral-800">
      <h2 className="font-bold text-gray-800 dark:text-white">{title}</h2>
      <p className="mt-1 mb-4 text-sm text-gray-500 dark:text-gray-300">
        {description}
      </p>
      {children}
    </section>
  );
}

function PrefRow({
  children,
  right,
}: {
  children: React.ReactNode;
  right: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-t border-gray-200 dark:border-neutral-700">
      <div className="flex-1 font-medium text-gray-800 dark:text-gray-100">
        {children}
      </div>
      {right}
    </div>
  );
}

export default function NotifichePage() {
  const [master, setMaster] = useState(true);
  const [roles, setRoles] = useState([
    { name: "AI Developer", enabled: true },
    { name: "Data Engineer", enabled: true },
    { name: "HR Specialist", enabled: false },
    { name: "Full-Stack Developer", enabled: false },
  ]);
  const [newRole, setNewRole] = useState("");
  const [followedCompanies, setFollowedCompanies] = useState<Record<string, boolean>>({
    "neapolis-tech": true,
    "vesuvio-analytics": true,
  });
  const [sources, setSources] = useState<Record<Source, boolean>>({
    linkedin: true,
    indeed: true,
    website: true,
  });
  const [saved, setSaved] = useState(false);

  function addRole(e: React.FormEvent) {
    e.preventDefault();
    const name = newRole.trim();
    if (!name) return;
    setRoles((prev) => {
      const existing = prev.find(
        (r) => r.name.toLowerCase() === name.toLowerCase()
      );
      if (existing)
        return prev.map((r) => (r === existing ? { ...r, enabled: true } : r));
      return [...prev, { name, enabled: true }];
    });
    setNewRole("");
  }

  return (
    <Container className="max-w-3xl">
      <SectionTitle align="left" preTitle="Preferenze" title="Notifiche email">
        Riceverai una email quando compaiono nuove posizioni che corrispondono a
        ciò che segui. Attiva o disattiva gli avvisi per ruolo, azienda e fonte.
      </SectionTitle>

      {/* Master toggle */}
      <section className="flex items-center gap-4 px-8 mt-6 bg-gray-100 rounded-2xl py-7 dark:bg-neutral-800">
        <div className="flex-1">
          <h2 className="font-bold text-gray-800 dark:text-white">
            Notifiche attive
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
            Invio a maria.esposito@timevision.it quando vengono rilevate nuove
            posizioni.
          </p>
        </div>
        <Toggle
          checked={master}
          onChange={setMaster}
          label="Attiva o disattiva tutte le notifiche"
        />
      </section>

      <PrefSection
        title="Ruoli seguiti"
        description="Ricevi un avviso quando una qualsiasi azienda pubblica una posizione con questo titolo."
      >
        {roles.map((role, i) => (
          <PrefRow
            key={role.name}
            right={
              <Toggle
                checked={role.enabled}
                onChange={(v) =>
                  setRoles((prev) =>
                    prev.map((r, j) => (i === j ? { ...r, enabled: v } : r))
                  )
                }
                label={`Notifiche per ${role.name}`}
              />
            }
          >
            {role.name}
          </PrefRow>
        ))}
        <form onSubmit={addRole} className="flex gap-3 mt-4">
          <input
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            placeholder="Aggiungi un ruolo da seguire, es. “DevOps Engineer”"
            aria-label="Nuovo ruolo da seguire"
            className="flex-1 px-4 py-2.5 text-gray-800 bg-white border border-gray-200 rounded-md placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:ring focus:ring-indigo-100 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:focus:ring-indigo-900"
          />
          <button
            type="submit"
            className="px-5 py-2.5 text-sm font-semibold text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-200 dark:hover:bg-indigo-800"
          >
            Aggiungi
          </button>
        </form>
      </PrefSection>

      <PrefSection
        title="Aziende seguite"
        description="Ricevi un avviso per ogni nuova posizione pubblicata da queste aziende, qualunque sia il ruolo."
      >
        {companies.map((c) => (
          <PrefRow
            key={c.id}
            right={
              <Toggle
                checked={!!followedCompanies[c.id]}
                onChange={(v) =>
                  setFollowedCompanies((prev) => ({ ...prev, [c.id]: v }))
                }
                label={`Notifiche per ${c.name}`}
              />
            }
          >
            {c.name}{" "}
            <span className="text-sm font-normal text-gray-400">· {c.zone}</span>
          </PrefRow>
        ))}
      </PrefSection>

      <PrefSection
        title="Fonti"
        description="Limita gli avvisi alle fonti che ti interessano."
      >
        {(Object.keys(sourceLabels) as Source[]).map((s) => (
          <PrefRow
            key={s}
            right={
              <Toggle
                checked={sources[s]}
                onChange={(v) => setSources((prev) => ({ ...prev, [s]: v }))}
                label={`Notifiche da ${sourceLabels[s]}`}
              />
            }
          >
            <SourceChip source={s} />
          </PrefRow>
        ))}
      </PrefSection>

      <div className="flex items-center justify-end gap-4 mt-6 mb-8">
        {saved && (
          <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            Preferenze salvate ✓
          </span>
        )}
        <button
          type="button"
          onClick={() => {
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
          }}
          className="px-8 py-3 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
        >
          Salva preferenze
        </button>
      </div>
    </Container>
  );
}
