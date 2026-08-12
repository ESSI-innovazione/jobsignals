import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import type { JobResult } from "@/lib/jobs/types";
import { jobSourceLabels } from "@/lib/jobs/types";

function formatDate(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso + "T12:00:00");
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("it-IT", { dateStyle: "long" }).format(d);
}

export function JobResultCard({ job }: { job: JobResult }) {
  const date = formatDate(job.postedAt);
  return (
    <div className="relative w-full bg-gray-100 rounded-2xl px-8 py-7 dark:bg-neutral-800 transition-colors hover:bg-gray-200/70 dark:hover:bg-neutral-700 focus-within:ring focus-within:ring-indigo-100 dark:focus-within:ring-indigo-900">
      <h3 className="text-xl font-bold tracking-tight text-gray-800 dark:text-white">
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="focus:outline-none after:absolute after:inset-0 after:rounded-2xl"
        >
          {job.title}
        </a>
      </h3>

      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-gray-500 dark:text-gray-300">
        {job.company && <span className="font-medium">{job.company}</span>}
        {job.location && (
          <>
            <span aria-hidden="true">·</span>
            <span className="rounded-full bg-white px-3 py-0.5 text-xs font-semibold text-gray-600 dark:bg-neutral-900 dark:text-gray-300">
              {job.location}
            </span>
          </>
        )}
        {job.salary && (
          <>
            <span aria-hidden="true">·</span>
            <span className="text-sm font-medium text-green-700 dark:text-green-400">{job.salary}</span>
          </>
        )}
      </div>

      {job.snippet && (
        <p className="mt-3 text-gray-500 dark:text-gray-300 line-clamp-2">{job.snippet}</p>
      )}

      <div className="flex flex-wrap items-center gap-4 pt-4 mt-4 text-sm text-gray-400 border-t border-gray-200 dark:border-neutral-700">
        <span className="font-medium text-gray-500 dark:text-gray-400">
          {jobSourceLabels[job.source]}
        </span>
        {date && <span>Pubblicata il {date}</span>}
        <span className="inline-flex items-center gap-1 ml-auto font-medium text-indigo-600 dark:text-indigo-400">
          Apri annuncio
          <ArrowTopRightOnSquareIcon className="w-4 h-4" />
        </span>
      </div>
    </div>
  );
}
