import type { Source } from "@/lib/sample-data";
import { sourceLabels } from "@/lib/sample-data";

function SourceIcon({ source }: { source: Source }) {
  if (source === "linkedin")
    return (
      <span className="inline-grid w-5 h-5 place-items-center rounded bg-src-linkedin text-[10px] font-extrabold text-white">
        in
      </span>
    );
  if (source === "indeed")
    return (
      <span className="inline-grid w-5 h-5 place-items-center rounded bg-src-indeed font-serif text-[13px] italic font-extrabold text-white">
        i
      </span>
    );
  return (
    <span className="inline-grid w-5 h-5 place-items-center rounded bg-src-website text-white">
      <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18-2.5-2.6-2.5-15.4 0-18z" />
      </svg>
    </span>
  );
}

export function SourceChip({ source }: { source: Source }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
      <SourceIcon source={source} />
      {sourceLabels[source]}
    </span>
  );
}
