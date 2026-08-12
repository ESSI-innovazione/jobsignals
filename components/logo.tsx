export function LogoMark({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <span
      className={`inline-grid place-items-center rounded-md bg-indigo-600 text-white ${className}`}
      aria-hidden="true"
    >
      <svg
        width="60%"
        height="60%"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <circle cx="12" cy="14" r="2.2" fill="currentColor" stroke="none" />
        <path d="M7.5 9.5a6.4 6.4 0 0 1 9 0" />
        <path d="M4.8 6.8a10.2 10.2 0 0 1 14.4 0" />
      </svg>
    </span>
  );
}

export function LogoText() {
  return (
    <span className="flex items-center space-x-2 text-2xl font-medium text-indigo-500 dark:text-gray-100">
      <LogoMark />
      <span>
        Job<span className="text-gray-800 dark:text-indigo-400">Signal</span>
      </span>
    </span>
  );
}
