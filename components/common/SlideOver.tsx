"use client";

import { useEffect, useId, useRef } from "react";
import { X } from 'lucide-react';

interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}

export default function SlideOver({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = "max-w-lg",
}: SlideOverProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    // Native modality keeps keyboard focus inside and restores it to the trigger.
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={`fixed inset-y-0 left-auto right-0 m-0 h-dvh max-h-none w-full ${width} bg-[var(--bg-card)] p-0 text-[var(--text-primary)] shadow-2xl backdrop:bg-black/40`}
    >
      <div className="flex h-full flex-col">
        <div className="flex shrink-0 items-start justify-between border-b border-[var(--glass-border)] px-6 py-5">
          <div>
            <h2 id={titleId} className="text-lg font-semibold">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-sm text-[var(--text-muted)]">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            aria-label="Fermer le panneau"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
          >
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>
        {footer && (
          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-[var(--glass-border)] px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </dialog>
  );
}
