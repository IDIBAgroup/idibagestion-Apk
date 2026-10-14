import React from "react";
import { AlertCircle, CheckCircle2, Clock, Info, MinusCircle, RotateCcw, Sparkles, Tag, type LucideIcon } from 'lucide-react';

export type BadgeVariant =
  | "new"
  | "returning"
  | "paid"
  | "unpaid"
  | "completed"
  | "pending"
  | "active"
  | "inactive"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "purple"
  | "orange"
  | "pink"
  | "blue"
  | "gray"
  | "yellow"
  | "red"
  | "sky"
  | "teal"
  | "rose";

interface BadgeProps {
  variant: BadgeVariant;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const palette: Record<BadgeVariant, string> = {
  new: "bg-[var(--badge-info)] text-[var(--badge-info-foreground)] border-[var(--badge-info-border)]",
  returning:
    "bg-[var(--badge-success)] text-[var(--badge-success-foreground)] border-[var(--badge-success-border)]",
  paid: "bg-[var(--badge-success)] text-[var(--badge-success-foreground)] border-[var(--badge-success-border)]",
  unpaid:
    "bg-[var(--badge-danger)] text-[var(--badge-danger-foreground)] border-[var(--badge-danger-border)]",
  completed:
    "bg-[var(--badge-success)] text-[var(--badge-success-foreground)] border-[var(--badge-success-border)]",
  pending:
    "bg-[var(--badge-warning)] text-[var(--badge-warning-foreground)] border-[var(--badge-warning-border)]",
  active:
    "bg-[var(--badge-success)] text-[var(--badge-success-foreground)] border-[var(--badge-success-border)]",
  inactive:
    "bg-[var(--badge-neutral)] text-[var(--badge-neutral-foreground)] border-[var(--badge-neutral-border)]",
  success:
    "bg-[var(--badge-success)] text-[var(--badge-success-foreground)] border-[var(--badge-success-border)]",
  warning:
    "bg-[var(--badge-warning)] text-[var(--badge-warning-foreground)] border-[var(--badge-warning-border)]",
  error:
    "bg-[var(--badge-danger)] text-[var(--badge-danger-foreground)] border-[var(--badge-danger-border)]",
  info: "bg-[var(--badge-info)] text-[var(--badge-info-foreground)] border-[var(--badge-info-border)]",
  purple:
    "bg-[var(--badge-violet)] text-[var(--badge-violet-foreground)] border-[var(--badge-violet-border)]",
  orange:
    "bg-[var(--accent-primary-soft)] text-[var(--accent-primary)] border-[var(--accent-primary)]/25",
  pink: "bg-[var(--badge-pink)] text-[var(--badge-pink-foreground)] border-[var(--badge-pink-border)]",
  blue: "bg-[var(--badge-info)] text-[var(--badge-info-foreground)] border-[var(--badge-info-border)]",
  gray: "bg-[var(--badge-neutral)] text-[var(--badge-neutral-foreground)] border-[var(--badge-neutral-border)]",
  yellow:
    "bg-[var(--badge-warning)] text-[var(--badge-warning-foreground)] border-[var(--badge-warning-border)]",
  red: "bg-[var(--badge-danger)] text-[var(--badge-danger-foreground)] border-[var(--badge-danger-border)]",
  sky: "bg-[var(--badge-sky)] text-[var(--badge-sky-foreground)] border-[var(--badge-sky-border)]",
  teal: "bg-[var(--badge-teal)] text-[var(--badge-teal-foreground)] border-[var(--badge-teal-border)]",
  rose: "bg-[var(--badge-rose)] text-[var(--badge-rose-foreground)] border-[var(--badge-rose-border)]",
};

// Every badge has an icon; callers can supply a domain-specific one.
const variantIcons: Partial<Record<BadgeVariant, LucideIcon>> = {
  new: Sparkles, returning: RotateCcw,
  paid: CheckCircle2, unpaid: AlertCircle, completed: CheckCircle2,
  pending: Clock, active: CheckCircle2, inactive: MinusCircle,
  success: CheckCircle2, warning: AlertCircle, error: AlertCircle, info: Info,
};

const sizeClass = {
  sm: "px-2 py-0.5 text-xs gap-1",
  md: "px-3 py-1.5 text-xs gap-1.5",
  lg: "px-4 py-2 text-sm gap-2",
};

export function Badge({
  variant,
  children,
  icon,
  className = "",
  size = "md",
}: BadgeProps) {
  const DefaultIcon = variantIcons[variant] ?? Tag;
  return (
    <span
      className={`inline-flex shrink-0 whitespace-nowrap items-center justify-center rounded border font-semibold ${palette[variant]} ${sizeClass[size]} ${className}`}
    >
      {icon !== false && (
        <span aria-hidden="true" className="flex shrink-0 items-center text-current">
          {icon || <DefaultIcon size={size === "sm" ? 12 : size === "lg" ? 16 : 14} strokeWidth={2.5} />}
        </span>
      )}
      {children}
    </span>
  );
}
