import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, CheckCircle2, AlertCircle, Clock, FileText, Lock, Calculator, Archive, BookOpen, ArrowRight, Settings, ChevronRight, Download, FileSpreadsheet } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { registerExposePdfFont } from '@/lib/pdf-font';
import { GlassCard } from '@/components/shared/GlassCard';
import { useUIStore } from '@/stores/uiStore';
import { useBrandingStore } from '@/stores/brandingStore';
import { getAll } from '@/lib/db';

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

// SYSCOHADA Balance data structure for export
function getBalanceData() {
  return [
    { code: '101', label: 'Capital social', debit: 0, credit: 50000000, net: 50000000 },
    { code: '121', label: 'Resultat d\'exercice', debit: 0, credit: 85200000, net: 85200000 },
    { code: '161', label: 'Emprunts obligataires', debit: 0, credit: 120000000, net: 120000000 },
    { code: '162', label: 'Emprunts et dettes aupres des etablissements de credit', debit: 0, credit: 85000000, net: 85000000 },
    { code: '211', label: 'Frais de developpement', debit: 15000000, credit: 0, net: 15000000 },
    { code: '212', label: 'Brevets, licences, logiciels', debit: 8500000, credit: 0, net: 8500000 },
    { code: '244', label: 'Materiel de transport', debit: 42000000, credit: 0, net: 42000000 },
    { code: '245', label: 'Materiel de bureau et informatique', debit: 38500000, credit: 0, net: 38500000 },
    { code: '281', label: 'Amort. immobilisations incorporelles', debit: 0, credit: 4750000, net: 4750000 },
    { code: '2815', label: 'Amort. materiel de bureau et info', debit: 0, credit: 9200000, net: 9200000 },
    { code: '401', label: 'Fournisseurs', debit: 0, credit: 38500000, net: 38500000 },
    { code: '411', label: 'Clients', debit: 142500000, credit: 0, net: 142500000 },
    { code: '416', label: 'Clients douteux', debit: 2500000, credit: 0, net: 2500000 },
    { code: '431', label: 'Organismes sociaux (CNPS)', debit: 0, credit: 6200000, net: 6200000 },
    { code: '4451', label: 'TVA collectee', debit: 0, credit: 25200000, net: 25200000 },
    { code: '4452', label: 'TVA deductible', debit: 7800000, credit: 0, net: 7800000 },
    { code: '521', label: 'Banques locales', debit: 45200000, credit: 0, net: 45200000 },
    { code: '601', label: 'Achats stockes - Matieres premieres', debit: 125000000, credit: 0, net: 125000000 },
    { code: '607', label: 'Achats de marchandises', debit: 45000000, credit: 0, net: 45000000 },
    { code: '621', label: 'Sous-traitance generale', debit: 35000000, credit: 0, net: 35000000 },
    { code: '628', label: 'Fournitures de bureau', debit: 8500000, credit: 0, net: 8500000 },
    { code: '631', label: 'Frais bancaires', debit: 3200000, credit: 0, net: 3200000 },
    { code: '633', label: 'Frais de formation du personnel', debit: 7500000, credit: 0, net: 7500000 },
    { code: '661', label: 'Salaires et appointements', debit: 156000000, credit: 0, net: 156000000 },
    { code: '664', label: 'Charges sociales (CNPS)', debit: 28500000, credit: 0, net: 28500000 },
    { code: '681', label: 'Dotations aux amortissements', debit: 13950000, credit: 0, net: 13950000 },
    { code: '701', label: 'Ventes de marchandises', debit: 0, credit: 487000000, net: 487000000 },
    { code: '706', label: 'Services vendus', debit: 0, credit: 125000000, net: 125000000 },
    { code: '77', label: 'Revenus financiers', debit: 0, credit: 3500000, net: 3500000 },
    { code: '80', label: 'Resultat d\'exercice', debit: 0, credit: 0, net: 0 },
  ];
}

// Bilan data (Assets & Liabilities)
function getBilanData() {
  return {
    actif: [
      { poste: 'Immobilisations incorporelles', brut: 23500000, amort: 4750000, net: 18750000 },
      { poste: 'Immobilisations corporelles', brut: 80500000, amort: 9200000, net: 71300000 },
      { poste: 'Clients et comptes rattaches', brut: 145000000, prov: 0, net: 145000000 },
      { poste: 'Autres creances', brut: 53000000, prov: 0, net: 53000000 },
      { poste: 'Tresorerie et equivalents', brut: 45200000, prov: 0, net: 45200000 },
    ],
    passif: [
      { poste: 'Capital social', montant: 50000000 },
      { poste: 'Resultats reportes', montant: 85200000 },
      { poste: 'Autres reserves', montant: 0 },
      { poste: 'Emprunts et dettes financieres', montant: 205000000 },
      { poste: 'Fournisseurs et comptes rattaches', montant: 38500000 },
      { poste: 'Dettes sociales et fiscales', montant: 31400000 },
      { poste: 'Autres dettes', montant: 8250000 },
    ]
  };
}

function getCompteResultat() {
  return {
    charges: [
      { poste: 'Achats de marchandises', montant: 170000000 },
      { poste: 'Charges externes', montant: 46700000 },
      { poste: 'Impots et taxes', montant: 8500000 },
      { poste: 'Charges de personnel', montant: 184500000 },
      { poste: 'Dotations aux amortissements', montant: 13950000 },
      { poste: 'Autres charges', montant: 12500000 },
    ],
    produits: [
      { poste: 'Ventes de marchandises', montant: 487000000 },
      { poste: 'Prestations de services', montant: 125000000 },
      { poste: 'Revenus financiers', montant: 3500000 },
      { poste: 'Autres produits', montant: 2750000 },
    ]
  };
}

export function YearEndClosingPage() {
  const { setCurrentPageTitle, showToast } = useUIStore();
  const { companyName } = useBrandingStore();
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => { setCurrentPageTitle('Cloture d\'Exercice'); }, [setCurrentPageTitle]);

  const closingEntries = getAll('closingEntries');
  const completedSteps = closingEntries.filter((s: any) => s.status === 'completed').length;
  const totalSteps = closingEntries.length;
  const progress = (completedSteps / totalSteps) * 100;

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '-';
  const formatXAF = (a: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(a);
  const formatN = (a: number) => new Intl.NumberFormat('fr-FR').format(a);

  const handleRunAutomation = () => {
    setIsRunning(true);
    showToast('Automatisation lancee...', 'info');
    setTimeout(() => {
      showToast('Etapes automatisees executees avec succes', 'success');
      setIsRunning(false);
    }, 3000);
  };

  // Export PDF Balance
  const exportBalancePDF = async () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    await registerExposePdfFont(doc);
    const data = getBalanceData();
    const totalDebit = data.reduce((s, r) => s + r.debit, 0);
    const totalCredit = data.reduce((s, r) => s + r.credit, 0);

    doc.setFontSize(16);
    doc.text(`BALANCE DES COMPTES - EXERCICE 2024`, 148, 15, { align: 'center' });
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

    doc.save(`Balance_2024_${companyName.replace(/\s/g, '_')}.pdf`);
    showToast('Balance exportee en PDF', 'success');
  };

  // Export PDF Bilan
  const exportBilanPDF = async () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    await registerExposePdfFont(doc);
    const { actif, passif } = getBilanData();
    const totalActif = actif.reduce((s, r) => s + r.net, 0);
    const totalPassif = passif.reduce((s, r) => s + r.montant, 0);

    doc.setFontSize(16);
    doc.text(`BILAN AU 31/12/2024`, 105, 15, { align: 'center' });
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

    doc.save(`Bilan_2024_${companyName.replace(/\s/g, '_')}.pdf`);
    showToast('Bilan exporte en PDF', 'success');
  };

  // Export PDF Compte de Resultat
  const exportResultatPDF = async () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    await registerExposePdfFont(doc);
    const { charges, produits } = getCompteResultat();
    const totalCharges = charges.reduce((s, r) => s + r.montant, 0);
    const totalProduits = produits.reduce((s, r) => s + r.montant, 0);
    const resultat = totalProduits - totalCharges;

    doc.setFontSize(16);
    doc.text(`COMPTE DE RESULTAT - EXERCICE 2024`, 105, 15, { align: 'center' });
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

    doc.save(`Compte_Resultat_2024_${companyName.replace(/\s/g, '_')}.pdf`);
    showToast('Compte de resultat exporte en PDF', 'success');
  };

  // Export CSV
  const exportCSV = (type: 'balance' | 'bilan' | 'resultat') => {
    let csv = '';
    if (type === 'balance') {
      const data = getBalanceData();
      csv = 'Code,Libelle,Debit,Credit,Solde\n';
      data.forEach(r => { csv += `${r.code},"${r.label}",${r.debit},${r.credit},${r.net}\n`; });
      const td = data.reduce((s, r) => s + r.debit, 0);
      const tc = data.reduce((s, r) => s + r.credit, 0);
      csv += `,TOTAUX,${td},${tc},`;
    } else if (type === 'bilan') {
      const { actif, passif } = getBilanData();
      csv = 'BILAN AU 31/12/2024\n\nACTIF\nPoste,Brut,Amort/Prov,Net\n';
      actif.forEach(r => { csv += `"${r.poste}",${r.brut},${r.amort || r.prov},${r.net}\n`; });
      csv += `TOTAL ACTIF,${actif.reduce((s, r) => s + r.net, 0)}\n\nPASSIF\nPoste,Montant\n`;
      passif.forEach(r => { csv += `"${r.poste}",${r.montant}\n`; });
      csv += `TOTAL PASSIF,${passif.reduce((s, r) => s + r.montant, 0)}`;
    } else {
      const { charges, produits } = getCompteResultat();
      csv = 'COMPTE DE RESULTAT - EXERCICE 2024\n\nCHARGES\nPoste,Montant\n';
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
    link.download = `${type}_2024_${companyName.replace(/\s/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Export CSV ${type} telecharge`, 'success');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-lg font-semibold text-[var(--text-primary)]">Travaux de Fin d\'Exercice 2024</h2><p className="text-xs text-[var(--text-muted)]">Conformite SYSCOHADA — Sequence obligatoire</p></div>
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
              <p className="text-[10px] text-[var(--text-muted)]">Balance au 31/12/2024 — 30 comptes</p>
              <div className="flex gap-2 mt-auto">
                <button onClick={exportBalancePDF} className="flex-1 btn-secondary h-8 text-[10px] justify-center"><Download size={10} /> PDF</button>
                <button onClick={() => exportCSV('balance')} className="flex-1 btn-secondary h-8 text-[10px] justify-center"><FileSpreadsheet size={10} /> CSV</button>
              </div>
            </div>
            {/* Bilan */}
            <div className="glass-card-compact p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2"><Archive size={14} className="text-[var(--accent-purple)]" /><span className="text-sm font-medium text-[var(--text-primary)]">Bilan</span></div>
              <p className="text-[10px] text-[var(--text-muted)]">Actif / Passif au 31/12/2024</p>
              <div className="flex gap-2 mt-auto">
                <button onClick={exportBilanPDF} className="flex-1 btn-secondary h-8 text-[10px] justify-center"><Download size={10} /> PDF</button>
                <button onClick={() => exportCSV('bilan')} className="flex-1 btn-secondary h-8 text-[10px] justify-center"><FileSpreadsheet size={10} /> CSV</button>
              </div>
            </div>
            {/* Compte de resultat */}
            <div className="glass-card-compact p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2"><FileText size={14} className="text-[var(--accent-primary)]" /><span className="text-sm font-medium text-[var(--text-primary)]">Compte de resultat</span></div>
              <p className="text-[10px] text-[var(--text-muted)]">Charges / Produits exercice 2024</p>
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
                  <button onClick={() => showToast(`Etape "${STEP_LABELS[step.step]}" marquee comme completee`, 'success')} className="btn-secondary h-8 text-xs">Valider</button>
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
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Resume cloture exercice 2024</h3>
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
