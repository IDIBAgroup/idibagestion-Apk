import { useId, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export type StatColor = 'primary' | 'secondary' | 'warning' | 'purple' | 'danger' | 'muted' | 'success' | 'blue';

const COLOR_VAR: Record<StatColor, string> = {
  primary: 'var(--chart-orange)',
  secondary: 'var(--chart-blue)',
  blue: 'var(--chart-blue)',
  success: 'var(--chart-green)',
  warning: 'var(--chart-amber)',
  purple: 'var(--chart-purple)',
  danger: 'var(--accent-danger)',
  muted: 'var(--text-muted)',
};

interface Bar {
  label: string;
  value: number;
  color?: StatColor;
}

interface StatCardProps {
  title: string;
  href: string;
  value: string;
  metaLabel: string;
  /** Percent change vs previous period; omit when there is nothing to compare against. */
  trendValue?: number;
  trendLabel?: string;
  bars?: Bar[];
  lineSeries?: number[];
  color?: StatColor;
}

const BAR_W = 30;
const BAR_GAP = 8;
const BAR_H = 70;
const LINE_W = 180;
const LINE_H = 70;
const LINE_PAD = 8;

export function StatCard({
  title, href, value, metaLabel, trendValue, trendLabel = 'vs mois dernier',
  bars = [], lineSeries = [], color = 'primary',
}: StatCardProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [hovered, setHovered] = useState<Bar | null>(null);
  const hasTrend = typeof trendValue === 'number';
  const positive = (trendValue ?? 0) >= 0;
  const maxBar = Math.max(0, ...bars.map((b) => b.value));
  const hasBars = bars.length > 0 && maxBar > 0;
  const hasLine = lineSeries.length > 1 && lineSeries.some((v) => v > 0);
  const barsWidth = bars.length * (BAR_W + BAR_GAP) - BAR_GAP;

  const min = Math.min(...lineSeries);
  const range = Math.max(1e-6, Math.max(...lineSeries) - min);
  const points = hasLine
    ? lineSeries.map((v, i) => ({
        x: LINE_PAD + (i / (lineSeries.length - 1)) * (LINE_W - LINE_PAD * 2),
        y: LINE_H - LINE_PAD - ((v - min) / range) * (LINE_H - LINE_PAD * 2),
      }))
    : [];
  const path = points.reduce((d, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    return `${d} Q ${prev.x} ${prev.y} ${(prev.x + p.x) / 2} ${(prev.y + p.y) / 2}`;
  }, '') + (points.length ? ` T ${points[points.length - 1].x} ${points[points.length - 1].y}` : '');
  const area = points.length
    ? `${path} L ${points[points.length - 1].x} ${LINE_H} L ${points[0].x} ${LINE_H} Z`
    : '';

  const patternFor = (c: StatColor) => `${uid}-${c}`;
  const usedColors = Array.from(new Set(bars.map((b) => b.color ?? color)));

  return (
    <div className="relative p-0">
      <p className="text-[clamp(1rem,2.1vw,1.25rem)] leading-snug text-[var(--text-primary)]">{title}</p>

      <div className="absolute right-0 top-0 z-10 -translate-y-1/2 translate-x-1/2">
        <Link
          href={href}
          aria-label={`Voir ${title.toLowerCase()}`}
          className="flex h-9 w-9 items-center justify-center rounded border border-[var(--glass-border-hover)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-colors hover:bg-[var(--accent-primary)]/[0.08] md:h-10 md:w-10"
        >
          <ArrowUpRight size={16} />
        </Link>
      </div>

      <div className="mt-2 leading-none">
        <span className="text-[clamp(1.6rem,2.8vw,2.3rem)] font-semibold leading-none text-[var(--text-primary)] tabular-nums">
          {value}
        </span>
      </div>

      <div className="mt-2 h-[92px]">
        {hasBars ? (
          <div className="relative flex h-full items-end pb-4 pl-3 pt-3">
            <svg
              viewBox={`0 0 ${barsWidth} ${BAR_H}`}
              preserveAspectRatio="xMinYMax meet"
              fill="none"
              className="h-[70px] max-w-full"
              style={{ width: `${barsWidth}px` }}
              role="img"
              aria-label={bars.map((b) => `${b.label}: ${b.value}`).join(', ')}
            >
              <defs>
                {usedColors.map((c) => (
                  <pattern key={c} id={patternFor(c)} patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(-45)">
                    <rect width="4" height="4" fill={COLOR_VAR[c]} />
                    <line x1="0" y1="0" x2="0" y2="4" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
                  </pattern>
                ))}
              </defs>
              {bars.map((bar, i) => {
                const h = Math.max(2, Math.round((bar.value / maxBar) * BAR_H));
                const x = i * (BAR_W + BAR_GAP);
                return (
                  <g key={`${bar.label}-${i}`} onMouseEnter={() => setHovered(bar)} onMouseLeave={() => setHovered(null)}>
                    <rect x={x - 4} y={0} width={BAR_W + 8} height={BAR_H} fill="transparent" />
                    <rect x={x} y={BAR_H - h} width={BAR_W} height={h} rx="2" fill={`url(#${patternFor(bar.color ?? color)})`} />
                  </g>
                );
              })}
            </svg>
            {hovered && (
              <div className="absolute right-3 top-0 z-10 rounded-lg bg-[var(--accent-primary)] px-3 py-1.5 text-[11px] font-medium text-white shadow-lg">
                <span className="block font-semibold">{hovered.label}</span>
                <span className="block">{hovered.value.toLocaleString('fr-FR')}</span>
              </div>
            )}
          </div>
        ) : hasLine ? (
          <div className="flex h-full w-full items-center px-2">
            <svg viewBox={`0 0 ${LINE_W} ${LINE_H}`} preserveAspectRatio="xMinYMid meet" fill="none" className="h-[74px] w-full">
              <defs>
                <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="0" y2={LINE_H} gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor={COLOR_VAR[color]} stopOpacity="0.35" />
                  <stop offset="100%" stopColor={COLOR_VAR[color]} stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0.25, 0.5, 0.75].map((t) => (
                <line key={t} x1={LINE_PAD} x2={LINE_W - LINE_PAD} y1={LINE_H - LINE_PAD - t * (LINE_H - LINE_PAD * 2)} y2={LINE_H - LINE_PAD - t * (LINE_H - LINE_PAD * 2)} stroke="var(--glass-border)" strokeWidth="1" />
              ))}
              <path d={area} fill={`url(#${uid}-fill)`} />
              <path d={path} stroke={COLOR_VAR[color]} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              {points.map((p, i) => (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r="4.2" fill="var(--bg-card)" />
                  <circle cx={p.x} cy={p.y} r="2.6" fill={COLOR_VAR[color]} />
                </g>
              ))}
            </svg>
          </div>
        ) : (
          <div className="flex h-full items-center px-2">
            <div className="flex w-full max-w-[180px] flex-col gap-2">
              <div className="h-px w-full border-t border-dashed border-[var(--glass-border-hover)]" />
              <span className="text-xs text-[var(--text-muted)]">Aucune activité sur la période</span>
            </div>
          </div>
        )}
      </div>

      <div className="-mx-5 mt-1 h-px bg-[var(--divider)]" />

      <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-muted)] sm:text-sm">
        <span className="truncate">{metaLabel}</span>
        {hasTrend && (
          <span className={`ml-3 flex items-center gap-1 font-medium ${positive ? 'text-[var(--accent-success)]' : 'text-[var(--accent-danger)]'}`}>
            <span>{positive ? '↑' : '↓'}</span>
            <span>{Math.abs(trendValue as number).toFixed(1)}%</span>
            <span className="text-[11px] font-normal text-[var(--text-muted)] sm:text-xs">{trendLabel}</span>
          </span>
        )}
      </div>
    </div>
  );
}
