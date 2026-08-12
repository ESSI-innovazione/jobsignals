// Sample data for UI review — mirrors the SPEC.md data model (§4).
// Replaced by Supabase queries when the schema milestone ships.

export type Source = "linkedin" | "indeed" | "website";

export interface Company {
  id: string;
  name: string;
  sector: string;
  zone: string;
  vatNumber: string;
  address: string;
  shortDescription: string;
  website: string;
}

export interface Position {
  id: string;
  companyId: string;
  title: string;
  description: string;
  zone: string;
  source: Source;
  sourceUrl: string;
  postedAt: string; // ISO date
  status: "open" | "closed";
}

export const companies: Company[] = [
  {
    id: "neapolis-tech",
    name: "Neapolis Tech S.r.l.",
    sector: "Software & AI",
    zone: "Napoli",
    vatNumber: "07141850635",
    address: "Centro Direzionale, Isola F2 — 80143 Napoli (NA)",
    shortDescription:
      "Software house napoletana specializzata in AI e piattaforme SaaS per clienti enterprise.",
    website: "https://example.com",
  },
  {
    id: "vesuvio-analytics",
    name: "Vesuvio Analytics",
    sector: "Data & BI",
    zone: "Napoli",
    vatNumber: "08233470639",
    address: "Via Toledo 156 — 80134 Napoli (NA)",
    shortDescription:
      "Consulenza data-driven: analytics, machine learning e BI per retail e utilities nel Sud Italia.",
    website: "https://example.com",
  },
  {
    id: "partenope-hr",
    name: "Partenope HR Solutions",
    sector: "Risorse umane",
    zone: "Salerno",
    vatNumber: "05617890651",
    address: "Corso Vittorio Emanuele 45 — 84123 Salerno (SA)",
    shortDescription:
      "Agenzia per il lavoro: ricerca e selezione, somministrazione e formazione del personale.",
    website: "https://example.com",
  },
  {
    id: "costiera-digital",
    name: "Costiera Digital",
    sector: "Digital agency",
    zone: "Sorrento (NA)",
    vatNumber: "09415520637",
    address: "Via degli Aranci 12 — 80067 Sorrento (NA)",
    shortDescription:
      "Digital agency della Costiera: e-commerce, portali turistici e piattaforme web su misura.",
    website: "https://example.com",
  },
  {
    id: "sannio-software",
    name: "Sannio Software",
    sector: "Software gestionale",
    zone: "Benevento",
    vatNumber: "01733310625",
    address: "Via Port'Arsa 8 — 82100 Benevento (BN)",
    shortDescription:
      "Gestionali per PMI dal 1998: ERP, contabilità e soluzioni verticali per il manifatturiero.",
    website: "https://example.com",
  },
  {
    id: "reggia-logistics",
    name: "Reggia Logistics",
    sector: "Logistica",
    zone: "Caserta",
    vatNumber: "04528760611",
    address: "S.S. Sannitica 87, Km 22 — 81020 San Nicola la Strada (CE)",
    shortDescription:
      "Operatore logistico integrato: magazzino, distribuzione e supply chain per il Centro-Sud.",
    website: "https://example.com",
  },
];

export const positions: Position[] = [
  {
    id: "p1",
    companyId: "neapolis-tech",
    title: "AI Developer",
    description:
      "Cerchiamo un AI Developer con esperienza in LLM, RAG e Python per il nostro team R&D. Progetti su NLP in italiano per clienti enterprise. Ibrido, 2 giorni in sede.",
    zone: "Napoli",
    source: "linkedin",
    sourceUrl: "https://www.linkedin.com/jobs/",
    postedAt: "2026-08-11",
    status: "open",
  },
  {
    id: "p2",
    companyId: "vesuvio-analytics",
    title: "Senior AI Developer",
    description:
      "Guiderai lo sviluppo di modelli di machine learning per la previsione della domanda nel retail. Stack: Python, scikit-learn, MLflow, Azure ML.",
    zone: "Napoli",
    source: "website",
    sourceUrl: "https://example.com/careers",
    postedAt: "2026-07-28",
    status: "open",
  },
  {
    id: "p3",
    companyId: "costiera-digital",
    title: "AI Software Developer",
    description:
      "Integrazione di modelli generativi in piattaforme e-commerce e portali turistici. TypeScript, Node.js e API LLM.",
    zone: "Sorrento (NA)",
    source: "indeed",
    sourceUrl: "https://it.indeed.com/",
    postedAt: "2026-07-24",
    status: "open",
  },
  {
    id: "p4",
    companyId: "vesuvio-analytics",
    title: "Data Engineer",
    description:
      "Pipeline dati su Azure e dbt a supporto dei team AI: modellazione, orchestrazione e data quality per progetti retail e utilities.",
    zone: "Napoli",
    source: "indeed",
    sourceUrl: "https://it.indeed.com/",
    postedAt: "2026-08-10",
    status: "open",
  },
  {
    id: "p5",
    companyId: "partenope-hr",
    title: "HR Specialist",
    description:
      "HR Specialist per gestione del ciclo di selezione, onboarding e amministrazione del personale. Gradita esperienza con agenzie per il lavoro.",
    zone: "Salerno",
    source: "website",
    sourceUrl: "https://example.com/careers",
    postedAt: "2026-08-09",
    status: "open",
  },
  {
    id: "p6",
    companyId: "costiera-digital",
    title: "Full-Stack Developer",
    description:
      "Sviluppo di piattaforme e-commerce e portali turistici con React, Node.js e PostgreSQL. Team giovane, remote-friendly.",
    zone: "Sorrento (NA)",
    source: "linkedin",
    sourceUrl: "https://www.linkedin.com/jobs/",
    postedAt: "2026-08-08",
    status: "open",
  },
  {
    id: "p7",
    companyId: "neapolis-tech",
    title: "DevOps Engineer",
    description:
      "Gestione infrastruttura cloud (AWS, Kubernetes, Terraform) e CI/CD per prodotti SaaS. On-call ruotato, buoni pasto e welfare.",
    zone: "Napoli",
    source: "website",
    sourceUrl: "https://example.com/careers",
    postedAt: "2026-08-07",
    status: "open",
  },
  {
    id: "p8",
    companyId: "partenope-hr",
    title: "Recruiter Junior",
    description:
      "Primo impiego nel recruiting: screening CV, colloqui telefonici e gestione database candidati. Formazione interna e percorso di crescita.",
    zone: "Salerno",
    source: "indeed",
    sourceUrl: "https://it.indeed.com/",
    postedAt: "2026-08-06",
    status: "closed",
  },
  {
    id: "p9",
    companyId: "reggia-logistics",
    title: "Business Analyst",
    description:
      "Analisi dei processi logistici e reporting direzionale. Richiesti Excel avanzato, Power BI e conoscenza base di SQL.",
    zone: "Caserta",
    source: "linkedin",
    sourceUrl: "https://www.linkedin.com/jobs/",
    postedAt: "2026-08-05",
    status: "open",
  },
  {
    id: "p10",
    companyId: "sannio-software",
    title: "Backend Developer (Java)",
    description:
      "Sviluppo di gestionali per PMI con Java 21, Spring Boot e Oracle. Contratto CCNL Metalmeccanico, livello commisurato all'esperienza.",
    zone: "Benevento",
    source: "indeed",
    sourceUrl: "https://it.indeed.com/",
    postedAt: "2026-08-01",
    status: "open",
  },
];

export const sourceLabels: Record<Source, string> = {
  linkedin: "LinkedIn",
  indeed: "Indeed",
  website: "Sito aziendale",
};

export function companyById(id: string): Company | undefined {
  return companies.find((c) => c.id === id);
}

export function openPositions(): Position[] {
  return positions
    .filter((p) => p.status === "open")
    .sort((a, b) => b.postedAt.localeCompare(a.postedAt));
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("it-IT", { dateStyle: "long" }).format(
    new Date(iso + "T12:00:00")
  );
}

export function isNew(iso: string): boolean {
  // sample data is static, so "new" = the two most recent postings
  return iso >= "2026-08-10";
}
