import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, DollarSign, PieChart, FileText,
  Calendar, Download, Filter, ChevronDown, Users, Receipt,
  FileSpreadsheet, BarChart, ArrowUpRight, ArrowDownRight,
  Clock,
} from 'lucide-react';
import {
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell,
  AreaChart, Area, LineChart, Line,
} from 'recharts';
import { GlassCard } from '@/components/shared/GlassCard';
import { useUIStore } from '@/stores/uiStore';
import { getAll } from '@/lib/db';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { registerExposePdfFont } from '@/lib/pdf-font';

const COLORS = ['var(--chart-orange)', 'var(--chart-blue)', 'var(--chart-purple)', 'var(--chart-green)', 'var(--chart-amber)', '#EC4899', '#06B6D4'];

export function RapportsPage() {
  const { setCurrentPageTitle, showToast } = useUIStore();
  const [period, setPeriod] = useState('2024');
  const [reportType, setReportType] = useState<'overview' | 'revenue' | 'expenses' | 'clients'>('overview');

  useEffect(() => { setCurrentPageTitle('Rapports Financiers'); }, [setCurrentPageTitle]);

  const invoices = getAll('invoices');
  const expenses = getAll('expenses');
  const quotes = getAll('quotes');
  const clients = getAll('clients');
  const formatXAF = (a: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(a);

  // KPIs
  const totalRevenue = invoices.filter((i: any) => i.status === 'paid').reduce((s: number, i: any) => s + i.total, 0);
  const pendingRevenue = invoices.filter((i: any) => i.status === 'pending').reduce((s: number, i: any) => s + i.total, 0);
  const totalExpenses = expenses.reduce((s: number, e: any) => s + e.amount, 0);
  const totalQuotes = quotes.reduce((s: number, q: any) => s + q.total, 0);
  const acceptedQuotes = quotes.filter((q: any) => q.status === 'accepted' || q.status === 'converted').reduce((s: number, q: any) => s + q.total, 0);
  const margin = totalRevenue - totalExpenses;
  const marginRate = totalRevenue > 0 ? ((margin / totalRevenue) * 100).toFixed(1) : '0';

  // Revenue by month
  const revenueByMonth = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aout', 'Sept', 'Oct', 'Nov', 'Dec'];
    return months.map((m, i) => ({
      month: m,
      revenue: invoices.filter((inv: any) => inv.status === 'paid' && new Date(inv.date).getMonth() === i).reduce((s: number, inv: any) => s + inv.total, 0),
      pending: invoices.filter((inv: any) => inv.status === 'pending' && new Date(inv.date).getMonth() === i).reduce((s: number, inv: any) => s + inv.total, 0),
    }));
  }, [invoices]);

  // Expenses by category
  const expensesByCategory = useMemo(() => {
    const cats: Record<string, number> = {};
    expenses.forEach((e: any) => { cats[e.category] = (cats[e.category] || 0) + e.amount; });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  // Top clients
  const topClients = useMemo(() => {
    const clientRevenue: Record<string, number> = {};
    invoices.filter((i: any) => i.status === 'paid').forEach((i: any) => {
      clientRevenue[i.clientName] = (clientRevenue[i.clientName] || 0) + i.total;
    });
    return Object.entries(clientRevenue).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [invoices]);

  // Quote conversion funnel
  const quoteFunnel = [
    { stage: 'Emis', count: quotes.length, value: quotes.reduce((s: number, q: any) => s + q.total, 0) },
    { stage: 'Acceptes', count: quotes.filter((q: any) => q.status === 'accepted' || q.status === 'converted').length, value: acceptedQuotes },
    { stage: 'Convertis', count: quotes.filter((q: any) => q.status === 'converted').length, value: quotes.filter((q: any) => q.status === 'converted').reduce((s: number, q: any) => s + q.total, 0) },
  ];

  const exportPDF = async (title: string, headers: string[], rows: any[][]) => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    await registerExposePdfFont(doc);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFillColor(8, 28, 45);
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setFillColor(31, 180, 114);
    doc.rect(14, 31, 24, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('Expose', 'bold');
    doc.setFontSize(9);
    doc.text('IDIBA GROUP  /  RAPPORT FINANCIER', 14, 12);
    doc.setFontSize(18);
    doc.text(title, 14, 23);
    doc.setFont('Expose', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(218, 229, 236);
    doc.text(`Exercice ${period}  •  Édité le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - 14, 22, { align: 'right' });
    autoTable(doc, {
      head: [headers], body: rows, startY: 43, margin: { left: 14, right: 14, bottom: 18 },
      styles: { font: 'Expose', fontSize: 9, cellPadding: 3.2, textColor: [34, 49, 61], lineColor: [225, 232, 237], lineWidth: 0.15 },
      headStyles: { font: 'Expose', fillColor: [8, 28, 45], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [242, 248, 246] },
      didDrawPage: () => {
        doc.setDrawColor(221, 230, 235);
        doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);
        doc.setFont('Expose', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 128);
        doc.text('IDIBA Group  •  Document de gestion', 14, pageHeight - 7);
        doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - 14, pageHeight - 7, { align: 'right' });
      },
    });
    doc.save(`rapport-${title.toLowerCase().replace(/\s+/g, '-')}.pdf`);
    showToast('Rapport PDF exporte', 'success');
  };

  const exportRevenuePDF = () => {
    exportPDF('Chiffre d\'affaires', ['Mois', 'CA Encaisse', 'En attente'], revenueByMonth.map(r => [r.month, formatXAF(r.revenue), formatXAF(r.pending)]));
  };

  const exportExpensePDF = () => {
    exportPDF('Depenses', ['Categorie', 'Montant'], expensesByCategory.map(e => [e.name, formatXAF(e.value)]));
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Rapports Financiers</h2>
          <p className="text-xs text-[var(--text-muted)]">Analyse et visualisation des performances</p>
        </div>
        <div className="flex gap-2">
          <select value={period} onChange={e => setPeriod(e.target.value)} className="h-9 px-3 glass-input text-sm">
            <option value="2024">2024</option>
            <option value="2023">2023</option>
          </select>
          <div className="flex gap-1 bg-[var(--bg-elevated)] rounded-lg p-0.5">
            {[{ k: 'overview', l: 'Vue globale', i: <PieChart size={12} /> }, { k: 'revenue', l: 'CA', i: <TrendingUp size={12} /> }, { k: 'expenses', l: 'Depenses', i: <DollarSign size={12} /> }, { k: 'clients', l: 'Clients', i: <Users size={12} /> }].map(t => (
              <button key={t.k} onClick={() => setReportType(t.k as any)} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md ${reportType === t.k ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}>{t.i} {t.l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          { label: 'CA Encaisse', value: formatXAF(totalRevenue), icon: <TrendingUp size={16} />, color: 'var(--accent-primary)', trend: '+12%' },
          { label: 'En attente', value: formatXAF(pendingRevenue), icon: <Clock size={16} />, color: 'var(--accent-warning)', trend: '' },
          { label: 'Depenses', value: formatXAF(totalExpenses), icon: <DollarSign size={16} />, color: 'var(--accent-danger)', trend: '-5%' },
          { label: 'Marge', value: formatXAF(margin), icon: <BarChart3 size={16} />, color: 'var(--accent-secondary)', trend: `${marginRate}%` },
          { label: 'Devis emis', value: formatXAF(totalQuotes), icon: <FileText size={16} />, color: 'var(--accent-purple)', trend: '' },
          { label: 'Taux conversion', value: `${totalQuotes > 0 ? ((acceptedQuotes / totalQuotes) * 100).toFixed(1) : 0}%`, icon: <ArrowUpRight size={16} />, color: 'var(--accent-primary)', trend: '' },
        ].map((s, i) => (
          <GlassCard key={s.label} delay={i * 0.05}>
            <div className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.color + '20', color: s.color }}>{s.icon}</div>
                {s.trend && <span className="text-[10px] text-[var(--accent-primary)]">{s.trend}</span>}
              </div>
              <p className="text-sm font-bold text-[var(--text-primary)]">{s.value}</p>
              <p className="text-[10px] text-[var(--text-muted)]">{s.label}</p>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Report Content */}
      {(reportType === 'overview' || reportType === 'revenue') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <GlassCard delay={0.1}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2"><BarChart size={14} className="text-[var(--accent-primary)]" /> Chiffre d'affaires par mois</h3>
                <button onClick={exportRevenuePDF} className="text-[10px] text-[var(--accent-primary)] hover:underline flex items-center gap-1"><Download size={10} /> PDF</button>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <ReBarChart data={revenueByMonth} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" />
                  <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 1000000).toFixed(0)}M`} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border-hover)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontSize: 11 }} formatter={(v: number) => formatXAF(v)} />
                  <Bar dataKey="revenue" fill="var(--chart-orange)" radius={[4, 4, 0, 0]} name="Encaisse" />
                  <Bar dataKey="pending" fill="var(--chart-blue)" radius={[4, 4, 0, 0]} name="En attente" />
                </ReBarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard delay={0.15}>
            <div className="p-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2"><TrendingUp size={14} className="text-[var(--accent-secondary)]" /> Tendance CA</h3>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" />
                  <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 1000000).toFixed(0)}M`} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border-hover)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontSize: 11 }} formatter={(v: number) => formatXAF(v)} />
                  <Area type="monotone" dataKey="revenue" stroke="var(--chart-orange)" fill="color-mix(in srgb, var(--chart-orange) 12%, transparent)" strokeWidth={2} name="CA" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>
      )}

      {(reportType === 'overview' || reportType === 'expenses') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <GlassCard delay={0.2}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2"><PieChart size={14} className="text-[var(--accent-warning)]" /> Depenses par categorie</h3>
                <button onClick={exportExpensePDF} className="text-[10px] text-[var(--accent-primary)] hover:underline flex items-center gap-1"><Download size={10} /> PDF</button>
              </div>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={140} height={140}>
                  <RePieChart>
                    <Pie data={expensesByCategory} cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={2} dataKey="value">
                      {expensesByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                  </RePieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1.5">
                  {expensesByCategory.map((e, i) => (
                    <div key={e.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-[10px] text-[var(--text-secondary)] flex-1">{e.name}</span>
                      <span className="text-[10px] text-[var(--text-primary)]">{formatXAF(e.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard delay={0.25}>
            <div className="p-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2"><FileText size={14} className="text-[var(--accent-primary)]" /> Entonnoir de conversion devis</h3>
              <div className="space-y-3">
                {quoteFunnel.map((stage, i) => (
                  <div key={stage.stage}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[var(--text-secondary)]">{stage.stage}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[var(--text-primary)]">{stage.count}</span>
                        <span className="text-[10px] text-[var(--text-muted)]">{formatXAF(stage.value)}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${stage.count > 0 ? (stage.count / quoteFunnel[0].count) * 100 : 0}%` }} transition={{ duration: 1, delay: i * 0.2 }} className="h-full rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-primary-hover)]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {(reportType === 'overview' || reportType === 'clients') && (
        <GlassCard delay={0.3}>
          <div className="p-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2"><Users size={14} className="text-[var(--accent-primary)]" /> Top 5 clients par CA</h3>
            <div className="space-y-2">
              {topClients.map((c, i) => (
                <div key={c.name} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[var(--accent-primary)] w-5">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[var(--text-primary)]">{c.name}</span>
                      <span className="text-xs font-medium text-[var(--accent-primary)]">{formatXAF(c.value)}</span>
                    </div>
                    <div className="h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--accent-primary)] rounded-full" style={{ width: `${(c.value / topClients[0].value) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
