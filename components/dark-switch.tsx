// Dark-mode toggle adapted from the Nextly template (Web3Templates, MIT).
"use client";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";

export function DarkSwitch() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-5 h-5" aria-hidden="true" />;

  const dark = theme === "dark";
  return (
    <button
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="flex items-center text-gray-500 rounded-full outline-none dark:text-gray-300 hover:text-indigo-500 dark:hover:text-indigo-400 focus-visible:ring focus-visible:ring-indigo-100 dark:focus-visible:ring-indigo-900"
    >
      <span className="sr-only">{dark ? "Tema chiaro" : "Tema scuro"}</span>
      {dark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
    </button>
  );
}
