import Link from "next/link";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import type { Position } from "@/lib/sample-data";
import { companyById, formatDate, isNew } from "@/lib/sample-data";
import { SourceChip } from "./source-chip";

// Card in the Nextly style (gray-100 / trueGray-800, rounded-2xl).
// The original posting is a stretched link covering the card; the company
// name is a separate link layered above it (no nested <a>).
export function PositionCard({ position }: { position: Position }) {
  const company = companyById(position.companyId);

  return (
    <div className="relative w-full bg-gray-100 rounded-2xl px-8 py-7 dark:bg-neutral-800 transition-colors hover:bg-gray-200/70 dark:hover:bg-neutral-700 focus-within:ring focus-within:ring-indigo-100 dark:focus-within:ring-indigo-900">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-xl font-bold tracking-tight text-gray-800 dark:text-white">
          <a
            href={position.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="focus:outline-none after:absolute after:inset-0 after:rounded-2xl"
          >
            {position.title}
          </a>
        </h3>
        {isNew(position.postedAt) && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            Nuova
          </span>
        )}
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-gray-500 dark:text-gray-300">
        {company && (
          <Link
            href={`/aziende/${company.id}`}
            className="relative z-10 font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            {company.name}
          </Link>
        )}
        <span aria-hidden="true">·</span>
        <span className="rounded-full bg-white px-3 py-0.5 text-xs font-semibold text-gray-600 dark:bg-neutral-900 dark:text-gray-300">
          {position.zone}
        </span>
      </div>

      <p className="mt-3 text-gray-500 dark:text-gray-300 line-clamp-2">
        {position.description}
      </p>

      <div className="flex flex-wrap items-center gap-4 pt-4 mt-4 text-sm text-gray-400 border-t border-gray-200 dark:border-neutral-700 dark:text-gray-400">
        <SourceChip source={position.source} />
        <span>Pubblicata il {formatDate(position.postedAt)}</span>
        <span className="inline-flex items-center gap-1 ml-auto font-medium text-indigo-600 dark:text-indigo-400">
          Apri annuncio
          <ArrowTopRightOnSquareIcon className="w-4 h-4" />
        </span>
      </div>
    </div>
  );
}
