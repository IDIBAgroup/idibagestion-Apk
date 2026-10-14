"use client";

import { useEffect, useRef, useId } from "react";
import { Check, Minus } from 'lucide-react';

/** Accent colours. "primary" follows the active panel theme. */
export type CheckboxColor = "primary" | "green" | "blue" | "purple" | "orange";

interface CustomCheckboxProps {
  checked?: boolean;
  label?: string;
  disabled?: boolean;
  indeterminate?: boolean;
  onChange?: (checked: boolean) => void;
  id?: string;
  className?: string;
  /**
   * Defaults to the panel theme. Set it where the surrounding UI uses a fixed
   * accent — the POS selection rows are green regardless of panel colour, and
   * a themed (red) tick inside them would look like an error.
   */
  color?: CheckboxColor;
}

const COLORS: Record<CheckboxColor, { on: string; off: string }> = {
  primary: {
    on: "border-[var(--text-primary)] bg-[var(--text-primary)] shadow-black/20",
    off: "border-[var(--glass-border)] bg-[var(--bg-card)] hover:border-[var(--text-primary)]/50",
  },
  green: {
    on: "border-[var(--accent-success)] bg-[var(--accent-success)]",
    off: "border-[var(--glass-border)] bg-[var(--bg-card)] hover:border-[var(--accent-success)]/50",
  },
  blue: {
    on: "border-[var(--accent-info)] bg-[var(--accent-info)]",
    off: "border-[var(--glass-border)] bg-[var(--bg-card)] hover:border-[var(--accent-info)]/50",
  },
  purple: {
    on: "border-[var(--accent-purple)] bg-[var(--accent-purple)]",
    off: "border-[var(--glass-border)] bg-[var(--bg-card)] hover:border-[var(--accent-purple)]/50",
  },
  orange: {
    on: "border-[var(--accent-primary)] bg-[var(--accent-primary)]",
    off: "border-[var(--glass-border)] bg-[var(--bg-card)] hover:border-[var(--accent-primary)]/50",
  },
};

/**
 * Adapted from Bringam’s CustomCheckbox — 20px rounded box with animated
 * check/indeterminate states.
 */
export function CustomCheckbox({
  checked = false,
  label,
  disabled = false,
  indeterminate = false,
  onChange,
  id,
  className = "",
  color = "primary",
}: CustomCheckboxProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  const on = checked || indeterminate;

  return (
    <div className={`relative ${className}`}>
      <input
        ref={inputRef}
        id={inputId}
        data-focus-managed
        type="checkbox"
        aria-label={label}
        disabled={disabled}
        checked={checked}
        onChange={() => onChange?.(!checked)}
        className="peer sr-only"
      />
      <label
        htmlFor={inputId}
        className={`flex items-center justify-center rounded peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--text-primary)] ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
        onClick={(e) => {
          e.preventDefault();
          if (!disabled) onChange?.(!checked);
        }}
      >
        <div
          className={`relative flex h-5 w-5 transform items-center justify-center rounded border-2 transition-all duration-200 hover:scale-110 active:scale-95 ${
            on ? `shadow-sm ${COLORS[color].on}` : COLORS[color].off
          }`}
        >
          {indeterminate ? (
            <Minus size={12} className="text-white" />
          ) : checked ? (
            <Check size={12} className="text-white" />
          ) : null}
        </div>
      </label>
    </div>
  );
}
