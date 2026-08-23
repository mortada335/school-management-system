import { useState, useEffect, useRef } from "react";

export interface ComboboxOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  options?: ComboboxOption[];
  fetcher?: (queryStr: string) => Promise<ComboboxOption[]>;
  disabled?: boolean;
  className?: string;
}

export function Combobox({
  value,
  onChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyText = "No options found.",
  options: staticOptions,
  fetcher,
  disabled = false,
  className = "",
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<ComboboxOption[]>(staticOptions || []);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (staticOptions) {
      const id = setTimeout(() => setOptions(staticOptions), 0);
      return () => clearTimeout(id);
    }
  }, [staticOptions]);

  useEffect(() => {
    if (!fetcher) return;
    let active = true;
    const id = setTimeout(() => { if (active) setLoading(true); }, 0);
    fetcher(query)
      .then((res) => {
        if (active) {
          setOptions(res);
          setLoading(false);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
        clearTimeout(id);
      });
    return () => { active = false; clearTimeout(id); };
  }, [query, fetcher]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value);

  const filteredOptions = fetcher
    ? options
    : options.filter(
        (o) =>
          o.label.toLowerCase().includes(query.toLowerCase()) ||
          (o.sublabel && o.sublabel.toLowerCase().includes(query.toLowerCase()))
      );

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-10 w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 transition-colors"
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-400"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-gray-200 bg-white p-1 shadow-2xl text-gray-900 dark:border-white/10 dark:bg-gray-900 dark:text-white">
          <div className="p-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500"
              autoFocus
            />
          </div>
          <div className="mt-1 divide-y divide-gray-100 dark:divide-white/5">
            {loading ? (
              <div className="py-4 text-center text-xs text-gray-500 dark:text-gray-400">Loading options...</div>
            ) : filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-gray-400 dark:text-gray-500">{emptyText}</div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`flex w-full flex-col text-left px-3 py-2 text-xs transition-colors rounded-md ${
                    opt.value === value
                      ? "bg-indigo-600 text-white font-medium"
                      : "hover:bg-gray-100 text-gray-700 hover:text-gray-900 dark:hover:bg-white/10 dark:text-gray-300 dark:hover:text-white"
                  }`}
                >
                  <span className="font-medium">{opt.label}</span>
                  {opt.sublabel && (
                    <span className="text-[10px] text-gray-400 dark:text-gray-400">{opt.sublabel}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
