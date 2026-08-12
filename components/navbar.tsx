// Navbar structure adapted from the Nextly template (Web3Templates, MIT).
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { DarkSwitch } from "./dark-switch";
import { LogoText } from "./logo";

const navigation = [
  { label: "Home", href: "/" },
  { label: "Posizioni", href: "/posizioni" },
  { label: "Aziende", href: "/aziende" },
  { label: "Gestione", href: "/gestione" },
  { label: "Notifiche", href: "/notifiche" },
];

export function Navbar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="w-full border-b border-gray-100 dark:border-neutral-800">
      <nav className="container relative flex flex-wrap items-center justify-between p-6 mx-auto lg:justify-between xl:px-1">
        <Link href="/">
          <LogoText />
        </Link>

        <div className="gap-3 mr-2 flex items-center ml-auto lg:ml-0 lg:order-2">
          <DarkSwitch />
          <div className="hidden mr-3 lg:flex">
            <Link
              href="/login"
              className="px-6 py-2 text-white bg-indigo-600 rounded-md md:ml-5 hover:bg-indigo-700"
            >
              Esci
            </Link>
          </div>
        </div>

        <Disclosure>
          {({ open }) => (
            <>
              <DisclosureButton
                aria-label="Apri il menu"
                className="px-2 py-1 ml-2 text-gray-500 rounded-md lg:hidden hover:text-indigo-500 focus:text-indigo-500 focus:bg-indigo-100 focus:outline-none dark:text-gray-300 dark:focus:bg-neutral-700"
              >
                {open ? (
                  <XMarkIcon className="w-6 h-6" />
                ) : (
                  <Bars3Icon className="w-6 h-6" />
                )}
              </DisclosureButton>
              <DisclosurePanel className="flex flex-wrap w-full my-5 lg:hidden">
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="w-full px-4 py-2 -ml-4 text-gray-500 rounded-md dark:text-gray-300 hover:text-indigo-500 focus:text-indigo-500 focus:bg-indigo-100 dark:focus:bg-neutral-800 focus:outline-none"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  href="/login"
                  className="w-full px-6 py-2 mt-3 text-center text-white bg-indigo-600 rounded-md"
                >
                  Esci
                </Link>
              </DisclosurePanel>
            </>
          )}
        </Disclosure>

        <div className="hidden text-center lg:flex lg:items-center">
          <ul className="items-center justify-end flex-1 pt-6 list-none lg:pt-0 lg:flex">
            {navigation.map((item) => (
              <li className="mr-3" key={item.href}>
                <Link
                  href={item.href}
                  className={`inline-block px-4 py-2 text-lg font-normal no-underline rounded-md hover:text-indigo-500 focus:text-indigo-500 focus:bg-indigo-100 focus:outline-none dark:focus:bg-neutral-800 ${
                    isActive(item.href)
                      ? "text-indigo-600 dark:text-indigo-400 font-medium"
                      : "text-gray-800 dark:text-gray-200"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </div>
  );
}
