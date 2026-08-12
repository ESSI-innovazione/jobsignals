"use client";
import {
  Field,
  Label,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/24/outline";

export interface FilterOption {
  value: string;
  label: string;
}

// Platform-styled dropdown (native <select> popups can't be themed).
export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
}) {
  const selected = options.find((o) => o.value === value) ?? options[0];

  return (
    <Field>
      <Label className="block mb-1.5 text-sm font-semibold text-gray-500 dark:text-gray-300">
        {label}
      </Label>
      <Listbox value={value} onChange={onChange}>
        <ListboxButton className="flex items-center justify-between w-full gap-2 px-4 py-2.5 text-left text-gray-800 bg-white border border-gray-200 rounded-md focus:outline-none data-[focus]:border-indigo-500 data-[focus]:ring data-[focus]:ring-indigo-100 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:data-[focus]:ring-indigo-900">
          <span className="truncate">{selected.label}</span>
          <ChevronUpDownIcon className="w-4 h-4 text-gray-400 shrink-0" />
        </ListboxButton>
        <ListboxOptions
          anchor="bottom start"
          transition
          className="z-30 w-[var(--button-width)] rounded-md border border-gray-200 bg-white p-1 shadow-lg [--anchor-gap:6px] focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
        >
          {options.map((o) => (
            <ListboxOption
              key={o.value}
              value={o.value}
              className="group flex cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 data-[focus]:bg-indigo-100 data-[focus]:text-indigo-800 dark:text-gray-200 dark:data-[focus]:bg-indigo-900 dark:data-[focus]:text-indigo-100"
            >
              {o.label}
              <CheckIcon className="invisible w-4 h-4 text-indigo-600 group-data-[selected]:visible dark:text-indigo-400" />
            </ListboxOption>
          ))}
        </ListboxOptions>
      </Listbox>
    </Field>
  );
}
