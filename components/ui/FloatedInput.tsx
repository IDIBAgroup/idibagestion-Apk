"use client";

import React from "react";

interface FloatedInputProps {
  id: string;
  name: string;
  /** Optional: a select (via `options`) has no input type. Defaults to "text". */
  type?: "text" | "email" | "password" | "tel" | "number" | "date" | "time";
  value: string;
  onChange: (value: string) => void;
  label: string;
  /** Optional: selects and date/time pickers supply their own affordance. */
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  hasError?: boolean;
  className?: string;
  /** Shorter height for dense forms (e.g. slide-over sidebars) */
  compact?: boolean;
  autoComplete?: string;
  describedBy?: string;
  min?: number;
  max?: number;
  step?: number;
  /** When provided, renders a select instead of a text input */
  options?: Array<{ value: string; label: string }>;
}

/**
 * Floating label input for login screens. Small label at top,
 * bold value while typing, left icon with divider — no drop shadow.
 */
export function FloatedInput({
  id,
  name,
  type = "text",
  value,
  onChange,
  label,
  placeholder = "",
  required = false,
  disabled = false,
  leftIcon,
  rightIcon,
  hasError = false,
  className = "",
  compact = false,
  options,
  autoComplete,
  describedBy,
  min,
  max,
  step,
}: FloatedInputProps) {
  return (
    <div className={className}>
      <div
        className={`flex items-center rounded border bg-[var(--bg-card)] px-4 transition-all ${
          compact ? "h-[52px] py-2" : "h-14 py-2.5"
        } ${
          hasError
            ? "border-[var(--accent-danger)] focus-within:border-[var(--accent-danger)]"
            : "border-[var(--glass-border)] hover:border-[var(--glass-border-hover)] focus-within:border-transparent focus-within:ring-2 focus-within:ring-[var(--text-primary)]"
        }`}
      >
        {leftIcon && (
          <>
            <div
              className={`flex shrink-0 items-center justify-center ${
                hasError ? "text-[var(--accent-danger)]" : "text-[var(--text-muted)]"
              }`}
            >
              {leftIcon}
            </div>
            <div
              className={`-my-2.5 ml-2 self-stretch border-l border-dashed ${
                hasError ? "border-[var(--accent-danger)]/20" : "border-[var(--glass-border)]"
              }`}
            />
          </>
        )}
        <div className="relative ml-3 flex min-h-9 min-w-0 flex-1 flex-col pt-3">
          <label
            htmlFor={id}
            className={`pointer-events-none absolute left-0 top-0 whitespace-nowrap text-[10px] ${
              hasError ? "text-[var(--accent-danger)]" : "text-[var(--text-muted)]"
            }`}
          >
            {label}
          </label>
          {options ? (
            <select
              id={id}
              name={name}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              required={required}
              disabled={disabled}
              aria-invalid={hasError || undefined}
              aria-describedby={describedBy}
              className="mt-1 w-full border-0 bg-transparent p-0 text-sm font-bold text-[var(--text-primary)] outline-none"
            >
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              data-focus-managed
              autoComplete={autoComplete}
              min={min}
              max={max}
              step={step}
              id={id}
              name={name}
              type={type}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              required={required}
              disabled={disabled}
              aria-invalid={hasError || undefined}
              aria-describedby={describedBy}
              className={`mt-1 w-full border-0 bg-transparent p-0 text-sm font-bold outline-none placeholder:text-[var(--text-muted)] ${
                hasError ? "text-[var(--accent-danger)]" : "text-[var(--text-primary)]"
              }`}
            />
          )}
        </div>
        {rightIcon}
      </div>
    </div>
  );
}

export default FloatedInput;
