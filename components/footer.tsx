// Footer structure adapted from the Nextly template (Web3Templates, MIT).
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Container } from "./container";
import { LogoText } from "./logo";

const navigation = [
  { label: "Home", href: "/" },
  { label: "Posizioni", href: "/posizioni" },
  { label: "Aziende", href: "/aziende" },
  { label: "Gestione", href: "/gestione" },
  { label: "Notifiche", href: "/notifiche" },
];

export function Footer() {
  // On the home route the page has a full-screen dark canvas background:
  // force the footer's dark styles there so it blends in.
  const isHome = usePathname() === "/";
  return (
    <div className={cn("relative mt-auto", isHome && "dark")}>
      <Container>
        <div className="grid max-w-screen-xl grid-cols-1 gap-10 pt-10 mx-auto mt-5 border-t border-gray-100 dark:border-neutral-700 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <LogoText />
            <div className="max-w-md mt-4 text-gray-500 dark:text-gray-400">
              Piattaforma interna TimeVision per monitorare le posizioni aperte
              pubblicate da altre aziende su LinkedIn, Indeed e siti aziendali.
            </div>
          </div>

          <div>
            <div className="flex flex-wrap w-full -mt-2 -ml-3 lg:ml-0">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="w-full px-4 py-2 text-gray-500 rounded-md dark:text-gray-300 hover:text-indigo-500 focus:text-indigo-500 focus:bg-indigo-100 focus:outline-none dark:focus:bg-neutral-700"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 text-gray-500 dark:text-gray-400 text-sm">
            <p>
              Uso interno riservato al team TimeVision.
              <br />
              Problemi di accesso? Scrivi a{" "}
              <a
                href="mailto:innovazione@timevision.it"
                className="text-indigo-500 hover:underline"
              >
                innovazione@timevision.it
              </a>
            </p>
          </div>
        </div>

        <div className="my-10 text-sm text-center text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} TimeVision — JobSignal. Design basato sul
          template{" "}
          <a
            href="https://github.com/web3templates/nextly-template"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-500 hover:underline"
          >
            Nextly
          </a>{" "}
          di Surjith S M / Web3Templates (MIT).
        </div>
      </Container>
    </div>
  );
}
