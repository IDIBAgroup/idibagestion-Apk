"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Extra classes for the trigger button */
  triggerClassName?: string;
}

/**
 * A custom (non-native) dropdown — button trigger + popover list, closes on
 * outside-click / Escape. Used to replace native <select> elements.
 */
export default function CustomDropdown({
  value,
  onChange,
  options,
  placeholder = "Sélectionner…",
  disabled = false,
  className = "",
  triggerClassName = "",
}: CustomDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-label={placeholder}
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between gap-2 rounded border bg-[var(--bg-card)] px-3 py-2 text-left text-sm transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${
          open
            ? "border-[var(--text-primary)] ring-2 ring-[var(--text-primary)]/20"
            : "border-[var(--glass-border)] hover:border-[var(--glass-border)]"
        } ${triggerClassName}`}
      >
        <span
          className={`truncate ${selected ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}
        >
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-[var(--text-muted)] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-[70] mt-1 max-h-64 w-full overflow-y-auto rounded border border-[var(--glass-border)] bg-[var(--bg-card)] py-1 shadow-lg">
          {options.length === 0 && (
            <div className="px-3 py-2 text-sm text-[var(--text-muted)]">Aucune option</div>
          )}
          {options.map((o) => {
            const active = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors ${
                  active
                    ? "bg-[var(--bg-card-hover)] font-medium text-[var(--text-primary)]"
                    : "text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
                }`}
              >
                <span className="truncate">{o.label}</span>
                {active && (
                  <Check size={15} className="shrink-0 text-[var(--text-primary)]" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
