"use client";
import { Loader2 } from 'lucide-react';
export const primaryButton =
  "inline-flex h-10 items-center justify-center gap-2 rounded bg-[var(--text-primary)] px-5 text-sm font-semibold text-white hover:bg-black disabled:opacity-50";
export const secondaryButton =
  "inline-flex h-10 items-center justify-center gap-2 rounded border border-[var(--glass-border)] px-5 text-sm font-semibold hover:bg-[var(--bg-card-hover)] disabled:opacity-50";
export function FormFooter({
  pending,
  onClose,
  form,
  label = "Enregistrer",
}: {
  pending: boolean;
  onClose: () => void;
  form: string;
  label?: string;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onClose}
        disabled={pending}
        className={secondaryButton}
      >
        Annuler
      </button>
      <button
        type="submit"
        form={form}
        disabled={pending}
        className={primaryButton}
      >
        {pending && <Loader2 className="animate-spin" size={16} />}{" "}
        {pending ? "Enregistrement…" : label}
      </button>
    </>
  );
}
export function TextField({
  label,
  value,
  onChange,
  required = false,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  rows?: number;
}) {
  return (
    <label className="block text-xs font-medium text-[var(--text-muted)]">
      {label}
      <textarea
        dir="auto"
        required={required}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 block w-full rounded border border-[var(--glass-border)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)]"
      />
    </label>
  );
}
export function ErrorNotice({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return message ? (
    <div
      role="alert"
      className="border-b border-[var(--accent-danger)]/20 bg-[var(--accent-danger)]/5 px-5 py-3 text-sm text-[var(--accent-danger)]"
    >
      {message}
      {onRetry && (
        <button type="button" onClick={onRetry} className="ml-3 underline">
          Try again
        </button>
      )}
    </div>
  ) : null;
}
