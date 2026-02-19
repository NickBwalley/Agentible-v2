"use client";

import { useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";

export interface MultiSelectWithTagsProps {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  label: string;
  placeholder?: string;
  id?: string;
}

export function MultiSelectWithTags({
  options,
  value,
  onChange,
  label,
  placeholder = "Select…",
  id,
}: MultiSelectWithTagsProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggle = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
    } else {
      onChange([...value, option]);
    }
  };

  const remove = (option: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== option));
  };

  return (
    <div ref={containerRef} className="relative">
      <Label className="text-white/90 mb-2 block">{label}</Label>
      <button
        type="button"
        id={id}
        onClick={() => setOpen(!open)}
        className="flex min-h-10 w-full flex-wrap items-center gap-2 rounded-md border border-white/20 bg-white/5 px-3 py-2 text-left text-sm text-white placeholder-white/40 focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
      >
        {value.length > 0 ? (
          <>
            {value.map((v) => (
              <span
                key={v}
                className="inline-flex items-center gap-1 rounded bg-white/15 px-2 py-0.5 text-sm text-white"
              >
                {v}
                <button
                  type="button"
                  onClick={(e) => remove(v, e)}
                  className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded hover:bg-white/20"
                  aria-label={`Remove ${v}`}
                >
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </span>
            ))}
          </>
        ) : (
          <span className="text-white/50">{placeholder}</span>
        )}
        <span className="ml-auto shrink-0">
          <svg
            className={`h-4 w-4 opacity-70 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </span>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 max-h-60 w-full min-w-[16rem] overflow-auto rounded-md border border-white/10 bg-[#111827] py-1 shadow-lg">
          {options.map((option) => (
            <label
              key={option}
              className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm text-white hover:bg-white/10"
            >
              <input
                type="checkbox"
                checked={value.includes(option)}
                onChange={() => toggle(option)}
                className="h-4 w-4 rounded border-white/30 text-[#2563EB] focus:ring-[#2563EB]"
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
