import Link from "next/link";
import { LogoMark } from "@/components/logo";
import { DarkSwitch } from "@/components/dark-switch";

// Login in the Nextly hero style: headline left, form card right.
export default function LoginPage() {
  return (
    <div className="relative flex flex-col min-h-screen">
      <div className="absolute top-6 right-6">
        <DarkSwitch />
      </div>
      <div className="container flex flex-wrap items-center flex-1 p-8 mx-auto xl:px-0">
        {/* Brand side */}
        <div className="flex items-center w-full lg:w-1/2">
          <div className="max-w-2xl mb-8">
            <span className="flex items-center space-x-3 text-3xl font-medium text-indigo-500 dark:text-gray-100">
              <LogoMark className="w-10 h-10" />
              <span>
                Job<span className="text-gray-800 dark:text-indigo-400">Signal</span>
              </span>
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-snug tracking-tight text-gray-800 lg:text-4xl xl:text-5xl xl:leading-tight dark:text-white">
              Il radar delle posizioni aperte nelle aziende che segui.
            </h1>
            <p className="py-5 text-xl leading-normal text-gray-500 lg:text-xl dark:text-gray-300">
              Piattaforma interna TimeVision per monitorare le offerte di lavoro
              pubblicate da altre aziende su LinkedIn, Indeed e sui loro siti —
              in un unico posto.
            </p>
          </div>
        </div>

        {/* Form side */}
        <div className="flex items-center justify-center w-full lg:w-1/2">
          <form className="w-full max-w-md px-10 py-10 bg-gray-100 rounded-2xl dark:bg-neutral-800">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Accedi
            </h2>
            <p className="mt-1 mb-6 text-sm text-gray-500 dark:text-gray-300">
              Accesso riservato al team TimeVision.
            </p>
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block mb-1.5 text-sm font-semibold text-gray-500 dark:text-gray-300"
              >
                Email aziendale
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="nome.cognome@timevision.it"
                className="w-full px-4 py-3 text-gray-800 bg-white border border-gray-200 rounded-md placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:ring focus:ring-indigo-100 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:focus:ring-indigo-900"
              />
            </div>
            <div className="mb-6">
              <label
                htmlFor="password"
                className="block mb-1.5 text-sm font-semibold text-gray-500 dark:text-gray-300"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-4 py-3 text-gray-800 bg-white border border-gray-200 rounded-md placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:ring focus:ring-indigo-100 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:focus:ring-indigo-900"
              />
            </div>
            <Link
              href="/"
              className="block w-full px-8 py-3 text-lg font-medium text-center text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              Accedi
            </Link>
            <p className="mt-5 text-xs text-center text-gray-400">
              Problemi di accesso? Scrivi a innovazione@timevision.it
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
