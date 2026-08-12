export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center p-8 bg-gradient-to-br from-[#490A19] via-[#5a1228] to-[#490A19]">
      <div className="text-center text-white max-w-xl">
        <div className="mx-auto mb-6 grid size-16 place-items-center rounded-2xl bg-white/10">
          <svg
            width="34"
            height="34"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="14" r="2.2" fill="#fff" stroke="none" />
            <path d="M7.5 9.5a6.4 6.4 0 0 1 9 0" />
            <path d="M4.8 6.8a10.2 10.2 0 0 1 14.4 0" />
          </svg>
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight">
          Job<span className="text-[#e9a8bb]">Signal</span>
        </h1>
        <p className="mt-3 text-lg font-semibold text-[#f3d9e0]">
          TimeVision internal
        </p>
        <p className="mt-4 text-sm text-[#d9b3bf]">
          Il radar delle posizioni aperte nelle aziende che segui — LinkedIn,
          Indeed e siti aziendali, in un unico posto.
        </p>
      </div>
    </main>
  );
}
