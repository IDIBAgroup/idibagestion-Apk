import type { ReactNode } from 'react';

export function ChartCard({
  title, subtitle, total, action, children,
}: {
  title: string;
  subtitle?: string;
  total?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex h-full min-w-0 flex-col bg-[var(--bg-card)] p-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] md:text-xl">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-[var(--text-muted)]">{subtitle}</p>}
        </div>
        {total && <span className="text-xl font-bold text-[var(--text-primary)]">{total}</span>}
        {action}
      </div>
      <div className="-mx-6 mb-6 border-b border-[var(--divider)]" />
      {children}
    </section>
  );
}
