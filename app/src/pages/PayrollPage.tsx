import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Download, Calculator, FileText, Shield, TrendingUp, AlertTriangle, Info } from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useUIStore } from '@/stores/uiStore';
import { getAll } from '@/lib/db';

// CNPS RATES (Cameroon legislation)
const CNPS_RATES = {
  pensionEmployee: 4.2,
  pensionEmployer: 4.2,
  atmp: 1.75,
  familyAllowances: 1.5,
  crtv: 1.5,
  cac: 1.0,
  cfc: 0.5,
};

// IRPP brackets (Cameroon progressive tax)
const IRPP_BRACKETS = [
  { limit: 0, rate: 0 },
  { limit: 2000000, rate: 10 },
  { limit: 3000000, rate: 15 },
  { limit: 5000000, rate: 25 },
  { limit: 10000000, rate: 35 },
];

function calculateIRPP(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;
  let tax = 0;
  let remaining = taxableIncome;
  let previousLimit = 0;
  for (const bracket of IRPP_BRACKETS) {
    if (remaining <= 0) break;
    if (bracket.rate === 0) { previousLimit = bracket.limit; continue; }
    const taxableAtThisBracket = Math.min(remaining, bracket.limit - previousLimit);
    tax += taxableAtThisBracket * (bracket.rate / 100);
    remaining -= taxableAtThisBracket;
    previousLimit = bracket.limit;
  }
  if (remaining > 0) tax += remaining * 0.35;
  return Math.round(tax);
}

export function PayrollPage() {
  const { setCurrentPageTitle } = useUIStore();
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('Juin');

  useEffect(() => { setCurrentPageTitle('Paie & CNPS'); }, [setCurrentPageTitle]);

  const payroll = getAll('payroll');
  const employees = getAll('employees');

  const filtered = payroll.filter((p: any) => p.month === selectedMonth && p.employeeName.toLowerCase().includes(search.toLowerCase()));

  const totals = filtered.reduce((acc: any, p: any) => ({
    gross: acc.gross + p.grossSalary,
    cnpsEmp: acc.cnpsEmp + p.cnpsEmployee,
    cnpsEmpr: acc.cnpsEmpr + p.cnpsEmployer,
    crtv: acc.crtv + p.crtv,
    cac: acc.cac + p.cac,
    cfc: acc.cfc + p.cfc,
    irpp: acc.irpp + p.irpp,
    net: acc.net + p.netSalary,
    employerCost: acc.employerCost + p.employerCost,
  }), { gross: 0, cnpsEmp: 0, cnpsEmpr: 0, crtv: 0, cac: 0, cfc: 0, irpp: 0, net: 0, employerCost: 0 });

  const formatXAF = (a: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(a);

  const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  return (
    <div className="space-y-4">
      {/* CNPS Info Banner */}
      <div className="glass-card-compact p-4 bg-gradient-to-r from-[var(--accent-primary)]/5 to-[var(--accent-secondary)]/5 border border-[var(--accent-primary)]/10">
        <div className="flex items-center gap-2 mb-2">
          <Shield size={16} className="text-[var(--accent-primary)]" />
          <span className="text-sm font-semibold text-[var(--text-primary)]">Cotisations CNPS — Législation Camerounaise</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 text-[10px]">
          {Object.entries({ 'Pension Sal.': '4.2%', 'Pension Pat.': '4.2%', 'AT/MP': '1.75%', 'Prest. Fam.': '1.5%', 'CRTV': '1.5%', 'CAC': '1.0%', 'CFC': '0.5%' }).map(([label, val]) => (
            <div key={label} className="flex justify-between p-1.5 rounded bg-[var(--bg-elevated)]">
              <span className="text-[var(--text-muted)]">{label}</span><span className="text-[var(--text-primary)] font-medium">{val}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2 text-[10px] text-[var(--text-muted)]">
          <Info size={10} />
          <span>Taux employeur total CNPS: 9.45% | Taux salarié: 4.2% | Plafond: 750 000 XAF/mois (base cotisable)</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <GlassCard><div className="p-3"><p className="text-[10px] text-[var(--text-muted)] uppercase">Masse salariale brute</p><p className="text-lg font-bold text-[var(--text-primary)]">{formatXAF(totals.gross)}</p></div></GlassCard>
        <GlassCard><div className="p-3"><p className="text-[10px] text-[var(--text-muted)] uppercase">CNPS (salarié + patron)</p><p className="text-lg font-bold text-[var(--accent-secondary)]">{formatXAF(totals.cnpsEmp + totals.cnpsEmpr)}</p></div></GlassCard>
        <GlassCard><div className="p-3"><p className="text-[10px] text-[var(--text-muted)] uppercase">IRPP collecté</p><p className="text-lg font-bold text-[var(--accent-warning)]">{formatXAF(totals.irpp)}</p></div></GlassCard>
        <GlassCard><div className="p-3"><p className="text-[10px] text-[var(--text-muted)] uppercase">Coût total employeur</p><p className="text-lg font-bold text-[var(--accent-primary)]">{formatXAF(totals.employerCost)}</p></div></GlassCard>
      </div>

      {/* IRPP Calculator */}
      <GlassCard>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calculator size={16} className="text-[var(--accent-primary)]" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Calculateur IRPP (Barème progressif Cameroun)</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[10px]">
            {[
              { min: 0, max: 2000000, rate: '10%', color: '#2DD4A8' },
              { min: 2000001, max: 3000000, rate: '15%', color: '#3B82F6' },
              { min: 3000001, max: 5000000, rate: '25%', color: '#8B5CF6' },
              { min: 5000001, max: 10000000, rate: '35%', color: '#F59E0B' },
              { min: 10000001, max: Infinity, rate: '35%+', color: '#EF4444' },
            ].map(b => (
              <div key={b.rate} className="p-2 rounded-lg border border-[var(--glass-border)] text-center">
                <p className="font-bold" style={{ color: b.color }}>{b.rate}</p>
                <p className="text-[var(--text-muted)] mt-0.5">{b.min === 0 ? '0' : formatXAF(b.min)} — {b.max === Infinity ? '∞' : formatXAF(b.max)}</p>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Month selector + Search */}
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-1 flex-wrap">
          {['Mai', 'Juin'].map(m => (
            <button key={m} onClick={() => setSelectedMonth(m)} className={`px-3 py-1.5 text-xs rounded-lg ${selectedMonth === m ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] font-medium' : 'text-[var(--text-muted)]'}`}>{m}</button>
          ))}
        </div>
        <div className="flex-1 min-w-[200px] relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full h-9 pl-9 pr-4 glass-input text-sm" />
        </div>
      </div>

      {/* Payroll Table */}
      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--divider)]">
                <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-3 py-3">Employé</th>
                <th className="text-right text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-3 py-3">Brut</th>
                <th className="text-right text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-3 py-3">CNPS Sal.</th>
                <th className="text-right text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-3 py-3">CNPS Pat.</th>
                <th className="text-right text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-3 py-3">IRPP</th>
                <th className="text-right text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-3 py-3">Autres</th>
                <th className="text-right text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-3 py-3">Net</th>
                <th className="text-right text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-3 py-3">Coût Pat.</th>
                <th className="text-center text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-3 py-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p: any, i: number) => (
                <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-[var(--divider)] hover:bg-white/[0.02] transition-colors">
                  <td className="px-3 py-2.5"><p className="text-xs font-medium text-[var(--text-primary)]">{p.employeeName}</p></td>
                  <td className="px-3 py-2.5 text-xs text-right text-[var(--text-primary)]">{formatXAF(p.grossSalary)}</td>
                  <td className="px-3 py-2.5 text-xs text-right text-[var(--accent-secondary)]">{formatXAF(p.cnpsEmployee)}</td>
                  <td className="px-3 py-2.5 text-xs text-right text-[var(--accent-purple)]">{formatXAF(p.cnpsEmployer)}</td>
                  <td className="px-3 py-2.5 text-xs text-right text-[var(--accent-warning)]">{formatXAF(p.irpp)}</td>
                  <td className="px-3 py-2.5 text-xs text-right text-[var(--text-muted)]">{formatXAF(p.crtv + p.cac + p.cfc + p.advancePayment + p.otherDeductions)}</td>
                  <td className="px-3 py-2.5 text-xs text-right font-semibold text-[var(--accent-primary)]">{formatXAF(p.netSalary)}</td>
                  <td className="px-3 py-2.5 text-xs text-right font-medium text-[var(--text-primary)]">{formatXAF(p.employerCost)}</td>
                  <td className="px-3 py-2.5 text-center"><StatusBadge status={p.status} /></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* CNPS Declaration Summary */}
      <GlassCard>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} className="text-[var(--accent-warning)]" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Déclaration CNPS mensuelle — {selectedMonth} 2024</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-[var(--bg-elevated)]"><p className="text-[10px] text-[var(--text-muted)]">Effectif déclaré</p><p className="text-sm font-bold text-[var(--text-primary)]">{employees.length} salariés</p></div>
            <div className="p-3 rounded-lg bg-[var(--bg-elevated)]"><p className="text-[10px] text-[var(--text-muted)]">Total cotisations CNPS</p><p className="text-sm font-bold text-[var(--accent-primary)]">{formatXAF(totals.cnpsEmp + totals.cnpsEmpr)}</p></div>
            <div className="p-3 rounded-lg bg-[var(--bg-elevated)]"><p className="text-[10px] text-[var(--text-muted)]">Taxes annexes (CRTV+CAC+CFC)</p><p className="text-sm font-bold text-[var(--text-secondary)]">{formatXAF(totals.crtv + totals.cac + totals.cfc)}</p></div>
            <div className="p-3 rounded-lg bg-[var(--bg-elevated)]"><p className="text-[10px] text-[var(--text-muted)]">IRPP à verser</p><p className="text-sm font-bold text-[var(--accent-warning)]">{formatXAF(totals.irpp)}</p></div>
          </div>
          <div className="flex gap-2 mt-3">
            <button className="btn-secondary h-8 text-xs"><Download size={12} /> CNPS DSN</button>
            <button className="btn-secondary h-8 text-xs"><FileText size={12} /> Déclaration IRPP</button>
            <button className="btn-secondary h-8 text-xs"><FileText size={12} /> Fiches de paie</button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
