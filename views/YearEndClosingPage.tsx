import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, CheckCircle2, AlertCircle, Clock, FileText, Lock, Calculator, Archive, BookOpen, ArrowRight, Settings, ChevronRight, Download, FileSpreadsheet } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { registerExposePdfFont } from '@/lib/pdf-font';
import { GlassCard } from '@/components/shared/GlassCard';
import { useUIStore } from '@/stores/uiStore';
import { useBrandingStore } from '@/stores/brandingStore';
import { addAndNotify, getAll, updateAndNotify } from '@/lib/db';
import type { AccountingEntry, Asset } from '@/types';

const STEP_ICONS: Record<string, React.ReactNode> = {
  inventaire: <Archive size={16} />,
  depreciation: <Calculator size={16} />,
  provisions: <AlertCircle size={16} />,
  regularisation: <Settings size={16} />,
  balance: <BookOpen size={16} />,
  resultat: <FileText size={16} />,
  reouverture: <ArrowRight size={16} />,
  liasse: <Lock size={16} />,
};

const STEP_LABELS: Record<string, string> = {
  inventaire: 'Inventaire physique',
  depreciation: 'Dotations aux amortissements',
  provisions: 'Constitution des provisions',
  regularisation: 'Regularisations',
  balance: 'Balance de verification',
  resultat: 'Determination du resultat',
  reouverture: 'Reouverture',
  liasse: 'Liasse fiscale',
};

function accountTotals(entries: AccountingEntry[]) {
  const totals = new Map<string, { code: string; label: string; debit: number; credit: number }>();
  entries.forEach((entry) => {
    const current = totals.get(entry.accountCode) || { code: entry.accountCode, label: entry.accountLabel, debit: 0, credit: 0 };
    current.debit += entry.debit;
    current.credit += entry.credit;
    totals.set(entry.accountCode, current);
  });
  return [...totals.values()].sort((a, b) => a.code.localeCompare(b.code, 'fr', { numeric: true }));
}

function getBalanceData(entries: AccountingEntry[]) {
  return accountTotals(entries).map((account) => ({ ...account, net: Math.abs(account.debit - account.credit) }));
}

function getBilanData(entries: AccountingEntry[]) {
  const accounts = accountTotals(entries);
  return {
    actif: accounts.filter((account) => /^[2345]/.test(account.code) && account.debit > account.credit).map((account) => ({ poste: `${account.code} · ${account.label}`, brut: account.debit, amort: 0, prov: 0, net: account.debit - account.credit })),
    passif: accounts.filter((account) => (/^1/.test(account.code) || /^[45]/.test(account.code)) && account.credit > account.debit).map((account) => ({ poste: `${account.code} · ${account.label}`, montant: account.credit - account.debit })),
  };
}

function getCompteResultat(entries: AccountingEntry[]) {
  const accounts = accountTotals(entries);
  return {
    charges: accounts.filter((account) => /^6/.test(account.code) && account.debit > account.credit).map((account) => ({ poste: `${account.code} · ${account.label}`, montant: account.debit - account.credit })),
    produits: accounts.filter((account) => /^7/.test(account.code) && account.credit > account.debit).map((account) => ({ poste: `${account.code} · ${account.label}`, montant: account.credit - account.debit })),
  };
}

export function YearEndClosingPage() {
  const { setCurrentPageTitle, showToast } = useUIStore();
  const { companyName } = useBrandingStore();
  const [isRunning, setIsRunning] = useState(false);
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear() - 1);
  const [, setRefresh] = useState(0);

  useEffect(() => { setCurrentPageTitle('Cloture d\'Exercice'); }, [setCurrentPageTitle]);

  const closingEntries = getAll('closingEntries').filter((entry) => entry.fiscalYear === fiscalYear);
  const completedSteps = closingEntries.filter((s: any) => s.status === 'completed').length;
  const totalSteps = closingEntries.length;
  const progress = totalSteps ? (completedSteps / totalSteps) * 100 : 0;
  const periodEntries = () => (getAll('accountingEntries') as AccountingEntry[]).filter((entry) => entry.date.startsWith(String(fiscalYear)));

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '-';
  const formatXAF = (a: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(a);
  const formatN = (a: number) => new Intl.NumberFormat('fr-FR').format(a);

  const handleRunAutomation = () => {
    setIsRunning(true);
    const allEntries = getAll('accountingEntries') as AccountingEntry[];
    const assets = getAll('assets') as Asset[];
    let generated = 0;
    assets.filter((asset) => asset.status === 'active' && asset.usefulLifeYears && asset.acquisitionDate).forEach((asset) => {
      const alreadyPosted = (asset.depreciationPostedYears || []).includes(fiscalYear) || allEntries.some((entry) => entry.pieceNumber === `AMORT-${fiscalYear}-${asset.id}`);
      if (alreadyPosted) return;
      const acquired = new Date(`${asset.depreciationStartDate || asset.acquisitionDate}T00:00:00`);
      const yearStart = new Date(fiscalYear, 0, 1);
      const yearEnd = new Date(fiscalYear, 11, 31);
      if (acquired > yearEnd) return;
      const monthsInYear = Math.max(0, 12 - Math.max(0, acquired.getFullYear() === fiscalYear ? acquired.getMonth() : 0));
      const life = asset.usefulLifeYears || 0;
      if (!life) return;
      const annualRate = asset.depreciationMethod === 'degressive' ? Math.min(1, 2 / life) : 1 / life;
      const fullYearsBefore = Math.max(0, fiscalYear - acquired.getFullYear());
      const openingValue = asset.depreciationMethod === 'degressive' ? asset.value * Math.pow(1 - annualRate, fullYearsBefore) : asset.value;
      const amount = Math.min(Math.max(0, asset.value - (asset.depreciation || 0)), openingValue * annualRate * monthsInYear / 12);
      if (amount <= 0) return;
      const pieceNumber = `AMORT-${fiscalYear}-${asset.id}`;
      const label = `Dotation amortissement - ${asset.name}`;
      const accountLabel = asset.category.toLocaleLowerCase().includes('incorp') ? 'Amortissements des immobilisations incorporelles' : 'Amortissements des immobilisations corporelles';
      const expenseEntry: AccountingEntry = { id: `${pieceNumber}-D`, date: `${fiscalYear}-12-31`, journal: 'OD', pieceNumber, accountCode: '681', accountLabel: 'Dotations aux amortissements', label, debit: amount, credit: 0, companyId: asset.companyId };
      const reserveEntry: AccountingEntry = { id: `${pieceNumber}-C`, date: `${fiscalYear}-12-31`, journal: 'OD', pieceNumber, accountCode: asset.category.toLocaleLowerCase().includes('incorp') ? '281' : '284', accountLabel, label, debit: 0, credit: amount, companyId: asset.companyId };
      addAndNotify('accountingEntries', expenseEntry);
      addAndNotify('accountingEntries', reserveEntry);
      const cumulativeDepreciation = Math.min(asset.value, (asset.depreciation || 0) + amount);
      updateAndNotify('assets', asset.id, { depreciation: cumulativeDepreciation, netValue: asset.value - cumulativeDepreciation, depreciationPostedYears: [...(asset.depreciationPostedYears || []), fiscalYear] });
      generated += 1;
    });
    const existingStep = closingEntries.find((entry) => entry.step === 'depreciation');
    const step = { id: existingStep?.id || `closing-depreciation-${fiscalYear}`, fiscalYear, step: 'depreciation', description: `${generated} dotation(s) d’amortissement générée(s)`, status: 'completed' as const, automated: true, entries: allEntries.filter((entry) => entry.pieceNumber.startsWith(`AMORT-${fiscalYear}-`)), startedAt: new Date().toISOString(), completedAt: new Date().toISOString(), companyId: 'comp-1' };
    if (existingStep) updateAndNotify('closingEntries', existingStep.id, step);
    else addAndNotify('closingEntries', step);
    setRefresh((value) => value + 1);
    setIsRunning(false);
    showToast(generated ? `${generated} dotation(s) calculée(s), enregistrée(s) et ajoutée(s) aux écritures.` : 'Aucune dotation à générer : vérifiez les immobilisations, leur durée et la période sélectionnée.', generated ? 'success' : 'info');
  };

  // Export PDF Balance
  const exportBalancePDF = async () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    await registerExposePdfFont(doc);
    const data = getBalanceData(periodEntries());
    const totalDebit = data.reduce((s, r) => s + r.debit, 0);
    const totalCredit = data.reduce((s, r) => s + r.credit, 0);

    doc.setFontSize(16);
    doc.text(`BALANCE DES COMPTES - EXERCICE ${fiscalYear}`, 148, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`${companyName} - Conformite SYSCOHADA`, 148, 22, { align: 'center' });
    doc.text(`Date d\'edition: ${new Date().toLocaleDateString('fr-FR')}`, 148, 27, { align: 'center' });

    autoTable(doc, {
      startY: 32,
      head: [['Code', 'Libelle du compte', 'Debit', 'Credit', 'Solde']],
      body: data.map(r => [
        r.code,
        r.label,
        r.debit > 0 ? formatN(r.debit) : '',
        r.credit > 0 ? formatN(r.credit) : '',
        formatN(r.net),
      ]),
      foot: [['', 'TOTAUX', formatN(totalDebit), formatN(totalCredit), '']],
      theme: 'striped',
      styles: { font: 'Expose', fontSize: 9, cellPadding: 3 }, headStyles: { fillColor: [8, 28, 45], textColor: [255, 255, 255], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      footStyles: { fillColor: [8, 28, 45], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 15 }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
    });

    doc.save(`Balance_${fiscalYear}_${companyName.replace(/\s/g, '_')}.pdf`);
    showToast('Balance exportee en PDF', 'success');
  };

  // Export PDF Bilan
  const exportBilanPDF = async () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    await registerExposePdfFont(doc);
    const { actif, passif } = getBilanData(periodEntries());
    const totalActif = actif.reduce((s, r) => s + r.net, 0);
    const totalPassif = passif.reduce((s, r) => s + r.montant, 0);

    doc.setFontSize(16);
    doc.text(`BILAN AU 31/12/${fiscalYear}`, 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`${companyName} - Conformite SYSCOHADA`, 105, 22, { align: 'center' });

    // ACTIF
    doc.setFontSize(12);
    doc.text('ACTIF', 14, 32);
    autoTable(doc, {
      startY: 35,
      head: [['Poste', 'Brut', 'Amort./Prov.', 'Net']],
      body: actif.map(r => [r.poste, formatN(r.brut), formatN((r as any).amort ?? (r as any).prov ?? 0), formatN(r.net)]),
      foot: [['TOTAL ACTIF', '', '', formatN(totalActif)]],
      theme: 'striped',
      styles: { font: 'Expose', fontSize: 9, cellPadding: 3 }, headStyles: { fillColor: [8, 28, 45], textColor: [255, 255, 255], fontSize: 9 },
      footStyles: { fillColor: [8, 28, 45], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
    });

    // PASSIF
    const yAfterActif = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text('PASSIF', 14, yAfterActif);
    autoTable(doc, {
      startY: yAfterActif + 3,
      head: [['Poste', 'Montant']],
      body: passif.map(r => [r.poste, formatN(r.montant)]),
      foot: [['TOTAL PASSIF', formatN(totalPassif)]],
      theme: 'striped',
      styles: { font: 'Expose', fontSize: 9, cellPadding: 3 }, headStyles: { fillColor: [8, 28, 45], textColor: [255, 255, 255], fontSize: 9 },
      footStyles: { fillColor: [8, 28, 45], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'right' } },
    });

    doc.save(`Bilan_${fiscalYear}_${companyName.replace(/\s/g, '_')}.pdf`);
    showToast('Bilan exporte en PDF', 'success');
  };

  // Export PDF Compte de Resultat
  const exportResultatPDF = async () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    await registerExposePdfFont(doc);
    const { charges, produits } = getCompteResultat(periodEntries());
    const totalCharges = charges.reduce((s, r) => s + r.montant, 0);
    const totalProduits = produits.reduce((s, r) => s + r.montant, 0);
    const resultat = totalProduits - totalCharges;

    doc.setFontSize(16);
    doc.text(`COMPTE DE RESULTAT - EXERCICE ${fiscalYear}`, 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`${companyName} - Conformite SYSCOHADA`, 105, 22, { align: 'center' });

    // CHARGES
    doc.setFontSize(12);
    doc.text('CHARGES', 14, 32);
    autoTable(doc, {
      startY: 35,
      head: [['Poste', 'Montant']],
      body: charges.map(r => [r.poste, formatN(r.montant)]),
      foot: [['TOTAL CHARGES', formatN(totalCharges)]],
      theme: 'striped',
      styles: { font: 'Expose', fontSize: 9, cellPadding: 3 }, headStyles: { fillColor: [8, 28, 45], textColor: [255, 255, 255], fontSize: 9 },
      footStyles: { fillColor: [8, 28, 45], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'right' } },
    });

    const yAfterCharges = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text('PRODUITS', 14, yAfterCharges);
    autoTable(doc, {
      startY: yAfterCharges + 3,
      head: [['Poste', 'Montant']],
      body: produits.map(r => [r.poste, formatN(r.montant)]),
      foot: [['TOTAL PRODUITS', formatN(totalProduits)]],
      theme: 'striped',
      styles: { font: 'Expose', fontSize: 9, cellPadding: 3 }, headStyles: { fillColor: [8, 28, 45], textColor: [255, 255, 255], fontSize: 9 },
      footStyles: { fillColor: [8, 28, 45], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'right' } },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(11);
    doc.setTextColor(resultat >= 0 ? 45 : 239, resultat >= 0 ? 212 : 68, resultat >= 0 ? 168 : 68);
    doc.text(`RESULTAT NET : ${resultat >= 0 ? 'BENEFICE' : 'PERTE'} ${formatN(Math.abs(resultat))} XAF`, 14, finalY);

    doc.save(`Compte_Resultat_${fiscalYear}_${companyName.replace(/\s/g, '_')}.pdf`);
    showToast('Compte de resultat exporte en PDF', 'success');
  };

  // Export CSV
  const exportCSV = (type: 'balance' | 'bilan' | 'resultat') => {
    let csv = '';
    if (type === 'balance') {
      const data = getBalanceData(periodEntries());
      csv = 'Code,Libelle,Debit,Credit,Solde\n';
      data.forEach(r => { csv += `${r.code},"${r.label}",${r.debit},${r.credit},${r.net}\n`; });
      const td = data.reduce((s, r) => s + r.debit, 0);
      const tc = data.reduce((s, r) => s + r.credit, 0);
      csv += `,TOTAUX,${td},${tc},`;
    } else if (type === 'bilan') {
      const { actif, passif } = getBilanData(periodEntries());
      csv = `BILAN AU 31/12/${fiscalYear}\n\nACTIF\nPoste,Brut,Amort/Prov,Net\n`;
      actif.forEach(r => { csv += `"${r.poste}",${r.brut},${r.amort || r.prov},${r.net}\n`; });
      csv += `TOTAL ACTIF,${actif.reduce((s, r) => s + r.net, 0)}\n\nPASSIF\nPoste,Montant\n`;
      passif.forEach(r => { csv += `"${r.poste}",${r.montant}\n`; });
      csv += `TOTAL PASSIF,${passif.reduce((s, r) => s + r.montant, 0)}`;
    } else {
      const { charges, produits } = getCompteResultat(periodEntries());
      csv = `COMPTE DE RESULTAT - EXERCICE ${fiscalYear}\n\nCHARGES\nPoste,Montant\n`;
      charges.forEach(r => { csv += `"${r.poste}",${r.montant}\n`; });
      csv += `TOTAL CHARGES,${charges.reduce((s, r) => s + r.montant, 0)}\n\nPRODUITS\nPoste,Montant\n`;
      produits.forEach(r => { csv += `"${r.poste}",${r.montant}\n`; });
      const resultat = produits.reduce((s, r) => s + r.montant, 0) - charges.reduce((s, r) => s + r.montant, 0);
      csv += `TOTAL PRODUITS,${produits.reduce((s, r) => s + r.montant, 0)}\nRESULTAT NET,${resultat}`;
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type}_${fiscalYear}_${companyName.replace(/\s/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Export CSV ${type} telecharge`, 'success');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-lg font-semibold text-[var(--text-primary)]">Travaux de Fin d\'Exercice {fiscalYear}</h2><p className="text-xs text-[var(--text-muted)]">Conformité SYSCOHADA — séquence de clôture</p></div>
        <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">Exercice <input type="number" min="2000" max="2100" value={fiscalYear} onChange={(event) => setFiscalYear(Number(event.target.value))} className="glass-input h-9 w-24 px-2" /></label>
        <button onClick={handleRunAutomation} disabled={isRunning} className="btn-primary h-9 disabled:opacity-50">
          {isRunning ? <Clock size={16} className="animate-spin" /> : <Play size={16} />}
          {isRunning ? ' Execution...' : ' Lancer automatisation'}
        </button>
      </div>

      {/* Progress */}
      <GlassCard>
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[var(--text-primary)]">Progression globale</span>
            <span className="text-sm font-semibold text-[var(--accent-primary)]">{completedSteps}/{totalSteps} etapes</span>
          </div>
          <div className="h-2.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1 }} className="h-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-primary-hover)] rounded-full" />
          </div>
        </div>
      </GlassCard>

      {/* Document Exports */}
      <GlassCard>
        <div className="p-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
            <FileText size={16} className="text-[var(--accent-primary)]" />
            Documents comptables — Export SYSCOHADA
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Balance */}
            <div className="glass-card-compact p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2"><BookOpen size={14} className="text-[var(--accent-secondary)]" /><span className="text-sm font-medium text-[var(--text-primary)]">Balance des comptes</span></div>
              <p className="text-[10px] text-[var(--text-muted)]">Balance au 31/12/{fiscalYear} — {periodEntries().length} lignes comptables</p>
              <div className="flex gap-2 mt-auto">
                <button onClick={exportBalancePDF} className="flex-1 btn-secondary h-8 text-[10px] justify-center"><Download size={10} /> PDF</button>
                <button onClick={() => exportCSV('balance')} className="flex-1 btn-secondary h-8 text-[10px] justify-center"><FileSpreadsheet size={10} /> CSV</button>
              </div>
            </div>
            {/* Bilan */}
            <div className="glass-card-compact p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2"><Archive size={14} className="text-[var(--accent-purple)]" /><span className="text-sm font-medium text-[var(--text-primary)]">Bilan</span></div>
              <p className="text-[10px] text-[var(--text-muted)]">Actif / Passif au 31/12/{fiscalYear}</p>
              <div className="flex gap-2 mt-auto">
                <button onClick={exportBilanPDF} className="flex-1 btn-secondary h-8 text-[10px] justify-center"><Download size={10} /> PDF</button>
                <button onClick={() => exportCSV('bilan')} className="flex-1 btn-secondary h-8 text-[10px] justify-center"><FileSpreadsheet size={10} /> CSV</button>
              </div>
            </div>
            {/* Compte de resultat */}
            <div className="glass-card-compact p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2"><FileText size={14} className="text-[var(--accent-primary)]" /><span className="text-sm font-medium text-[var(--text-primary)]">Compte de resultat</span></div>
              <p className="text-[10px] text-[var(--text-muted)]">Charges / Produits exercice {fiscalYear}</p>
              <div className="flex gap-2 mt-auto">
                <button onClick={exportResultatPDF} className="flex-1 btn-secondary h-8 text-[10px] justify-center"><Download size={10} /> PDF</button>
                <button onClick={() => exportCSV('resultat')} className="flex-1 btn-secondary h-8 text-[10px] justify-center"><FileSpreadsheet size={10} /> CSV</button>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Steps Timeline */}
      <div className="space-y-3">
        {closingEntries.map((step: any, i: number) => {
          const isCompleted = step.status === 'completed';
          const isPending = step.status === 'pending';
          const isInProgress = step.status === 'in_progress';
          const isAutomated = step.automated;

          return (
            <motion.div key={step.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
              className={`glass-card-compact p-4 flex items-center gap-4 transition-all ${isCompleted ? 'border-l-2 border-l-[var(--accent-primary)]' : isPending ? 'border-l-2 border-l-[var(--text-muted)]' : 'border-l-2 border-l-[var(--accent-warning)]'}`}>

              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isCompleted ? 'bg-[var(--accent-primary)]/15' : isInProgress ? 'bg-[var(--accent-warning)]/15' : 'bg-[var(--bg-elevated)]'}`}>
                {isCompleted ? <CheckCircle2 size={20} className="text-[var(--accent-primary)]" /> :
                  isInProgress ? <Clock size={20} className="text-[var(--accent-warning)]" /> :
                    <span className="text-sm text-[var(--text-muted)]">{i + 1}</span>}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`${isCompleted ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}>{STEP_ICONS[step.step]}</span>
                  <h3 className={`text-sm font-medium ${isCompleted ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>{STEP_LABELS[step.step]}</h3>
                  {isAutomated && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">Automatique</span>}
                </div>
                <p className="text-xs text-[var(--text-muted)]">{step.description}</p>
                {step.completedAt && <p className="text-[10px] text-[var(--accent-primary)] mt-0.5">Complete le {formatDate(step.completedAt)}</p>}
                {step.errorMessage && <p className="text-[10px] text-[var(--accent-danger)] mt-0.5">{step.errorMessage}</p>}
              </div>

              <div className="shrink-0">
                {isPending && !isAutomated && (
                  <button onClick={() => { updateAndNotify('closingEntries', step.id, { status: 'completed', completedAt: new Date().toISOString() }); setRefresh((value) => value + 1); showToast(`Étape « ${STEP_LABELS[step.step] || step.step} » validée.`, 'success'); }} className="btn-secondary h-8 text-xs">Valider</button>
                )}
                {isPending && isAutomated && (
                  <span className="text-xs text-[var(--text-muted)] flex items-center gap-1"><Settings size={12} /> En attente</span>
                )}
                {isCompleted && <CheckCircle2 size={18} className="text-[var(--accent-primary)]" />}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary */}
      <GlassCard>
        <div className="p-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Résumé clôture exercice {fiscalYear}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div className="p-2 rounded-lg bg-[var(--bg-elevated)]"><p className="text-[10px] text-[var(--text-muted)]">Etapes completees</p><p className="text-lg font-bold text-[var(--accent-primary)]">{completedSteps}</p></div>
            <div className="p-2 rounded-lg bg-[var(--bg-elevated)]"><p className="text-[10px] text-[var(--text-muted)]">Etapes automatiques</p><p className="text-lg font-bold text-[var(--accent-secondary)]">{closingEntries.filter((s: any) => s.automated).length}</p></div>
            <div className="p-2 rounded-lg bg-[var(--bg-elevated)]"><p className="text-[10px] text-[var(--text-muted)]">En attente</p><p className="text-lg font-bold text-[var(--accent-warning)]">{closingEntries.filter((s: any) => s.status === 'pending').length}</p></div>
            <div className="p-2 rounded-lg bg-[var(--bg-elevated)]"><p className="text-[10px] text-[var(--text-muted)]">Taux completion</p><p className="text-lg font-bold text-[var(--text-primary)]">{Math.round(progress)}%</p></div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
