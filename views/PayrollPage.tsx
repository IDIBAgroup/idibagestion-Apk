import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Download, Calculator, FileText, Shield, TrendingUp, AlertTriangle,
  Info, X, Eye, Plus, User, Calendar, History, ArrowRight, Building2,
  CheckCircle2, DollarSign, Clock, RefreshCw, Layers, Send, FileSpreadsheet,
  Check, CreditCard, Award, Briefcase, FileCheck, Landmark, Printer
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useUIStore } from '@/stores/uiStore';
import { getAll, addAndNotify, updateAndNotify } from '@/lib/db';
import type { EmployeeContract, EmployeeLoan, Leave } from '@/types';

// CNPS RATES (Legislation Camerounaise / CEMAC)
const CNPS_RATES = {
  pensionEmployee: 4.2,
  pensionEmployer: 4.2,
  atmp: 1.75,
  familyAllowances: 1.5,
  crtv: 1.5,
  cac: 1.0,
  cfc: 0.5,
};

// Bareme IRPP progressif Cameroun
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

function calculatePayroll(gross: number) {
  const cappedGross = Math.min(gross, 750000);
  const cnpsEmployee = Math.round(cappedGross * 0.042);
  const cnpsEmployer = Math.round(cappedGross * 0.042);
  const atmp = Math.round(cappedGross * 0.0175);
  const family = Math.round(cappedGross * 0.015);
  const crtv = Math.round(gross * 0.015);
  const cac = Math.round(gross * 0.01);
  const cfc = Math.round(gross * 0.005);
  const taxable = gross - cnpsEmployee;
  const irpp = calculateIRPP(taxable);
  const net = gross - cnpsEmployee - irpp - crtv - cac - cfc;
  const employerCost = gross + cnpsEmployer + atmp + family;
  return { cnpsEmployee, cnpsEmployer, atmp, family, crtv, cac, cfc, irpp, net, employerCost };
}

// Calcul Inverse : Algorithme de convergence bisection
function reverseCalculatePayroll(targetNet: number) {
  if (targetNet <= 0) return { gross: 0, details: calculatePayroll(0) };
  let low = targetNet;
  let high = targetNet * 3.0;
  let bestGross = targetNet;
  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2;
    const calc = calculatePayroll(mid);
    if (Math.abs(calc.net - targetNet) < 1) {
      bestGross = mid;
      break;
    }
    if (calc.net < targetNet) low = mid;
    else high = mid;
    bestGross = mid;
  }
  const gross = Math.round(bestGross);
  return { gross, details: calculatePayroll(gross) };
}

export function PayrollPage() {
  const { setCurrentPageTitle, showToast } = useUIStore();
  const [activeMainTab, setActiveMainTab] = useState<'bulletins' | 'livre' | 'dipe' | 'inverse' | 'virement' | 'hr' | 'compta'>('bulletins');
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('Juin');
  const [showBulletin, setShowBulletin] = useState<any>(null);
  const [showNewPayroll, setShowNewPayroll] = useState(false);
  const [showHistory, setShowHistory] = useState<string | null>(null);
  
  // New Payroll Form
  const [newPayrollEmp, setNewPayrollEmp] = useState('');
  const [newPayrollGross, setNewPayrollGross] = useState('');
  const [newPayrollMonth, setNewPayrollMonth] = useState('Juillet');

  // Reverse Calculator State
  const [targetNetInput, setTargetNetInput] = useState<string>('500000');
  const [reverseResult, setReverseResult] = useState<any>(reverseCalculatePayroll(500000));

  // Bank Transfer Order State
  const [selectedBank, setSelectedBank] = useState('UBA Cameroun');

  // HR Sub-Tabs
  const [hrSubTab, setHrSubTab] = useState<'contracts' | 'leaves' | 'loans'>('contracts');
  const [showContractModal, setShowContractModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);

  // New Loan Form
  const [loanEmpId, setLoanEmpId] = useState('');
  const [loanType, setLoanType] = useState<'pret_equipement' | 'avance_salaire' | 'pret_immobilier' | 'pret_secours'>('avance_salaire');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanMonthly, setLoanMonthly] = useState('');

  // New Contract Form
  const [contractEmpId, setContractEmpId] = useState('');
  const [contractType, setContractType] = useState<'cdi' | 'cdd' | 'stage' | 'freelance'>('cdi');
  const [contractSalary, setContractSalary] = useState('');
  const [contractStart, setContractStart] = useState('');
  const [contractEnd, setContractEnd] = useState('');

  useEffect(() => { setCurrentPageTitle('Paie, CNPS & Gestion des Ressources Humaines'); }, [setCurrentPageTitle]);

  const payroll = getAll('payroll') || [];
  const employees = getAll('employees') || [];
  const contracts = (getAll('contracts') as EmployeeContract[]) || [];
  const leaves = (getAll('leaves') as Leave[]) || [];
  const loans = (getAll('loans') as EmployeeLoan[]) || [];

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

  const handleCreatePayroll = () => {
    if (!newPayrollEmp || !newPayrollGross) return;
    const emp = employees.find((e: any) => e.id === newPayrollEmp);
    if (!emp) return;
    const gross = Number(newPayrollGross);
    const calc = calculatePayroll(gross);
    const entry = {
      id: `pay-${Date.now()}`,
      employeeId: emp.id,
      employeeName: emp.fullName,
      month: newPayrollMonth,
      year: 2024,
      grossSalary: gross,
      cnpsEmployee: calc.cnpsEmployee,
      cnpsEmployer: calc.cnpsEmployer,
      crtv: calc.crtv,
      cac: calc.cac,
      cfc: calc.cfc,
      commissions: 0,
      overtime: 0,
      taxableIncome: gross - calc.cnpsEmployee,
      irpp: calc.irpp,
      taxCredit: 0,
      advancePayment: 0,
      otherDeductions: 0,
      netSalary: calc.net,
      employerCost: calc.employerCost,
      payslipGenerated: true,
      status: 'confirmed' as const,
      createdAt: new Date().toISOString(),
      companyId: 'comp-1',
    };
    addAndNotify('payroll', entry);
    setShowNewPayroll(false);
    setNewPayrollEmp('');
    setNewPayrollGross('');
    showToast('Bulletin de paie généré avec succès', 'success');
  };

  const handleApplyReversePayroll = () => {
    if (!reverseResult || reverseResult.gross <= 0) return;
    setNewPayrollGross(reverseResult.gross.toString());
    setShowNewPayroll(true);
    setActiveMainTab('bulletins');
    showToast(`Montant brut calculé (${formatXAF(reverseResult.gross)}) reporté sur le formulaire de paie`, 'info');
  };

  // DIPE CNPS Generator File Export
  const generateDipeCnpsFile = () => {
    let content = `DIPE_CNPS;IDIBA_GROUP_SARL;NIU_M0123456789C;MOIS_${selectedMonth.toUpperCase()}_2024;EFFECTIF_${filtered.length}\n`;
    content += `MATRICULE;NOM_PRENOM;NUMERO_CNPS;JOURS;SALAIRE_BRUT;PLAFOND_CNPS;COTIS_SALARIALE;COTIS_PATRONALE\n`;
    filtered.forEach((p: any) => {
      const capped = Math.min(p.grossSalary, 750000);
      content += `${p.employeeId};${p.employeeName};123-45678-9;30;${p.grossSalary};${capped};${p.cnpsEmployee};${p.cnpsEmployer}\n`;
    });
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DIPE_CNPS_${selectedMonth.toUpperCase()}_2024.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Fichier DIPE CNPS Magnétique généré avec succès', 'success');
  };

  // DIPE Impôts Generator File Export
  const generateDipeImpotsFile = () => {
    let content = `DIPE_IMPOTS;IDIBA_GROUP_SARL;NIU_M0123456789C;MOIS_${selectedMonth.toUpperCase()}_2024;EFFECTIF_${filtered.length}\n`;
    content += `MATRICULE;NOM_PRENOM;SALAIRE_BRUT;SALAIRE_IMPOSABLE;IRPP;CAC;CFC;CRTV;TOTAL_IMPOTS\n`;
    filtered.forEach((p: any) => {
      const totalTax = p.irpp + p.cac + p.cfc + p.crtv;
      content += `${p.employeeId};${p.employeeName};${p.grossSalary};${p.taxableIncome};${p.irpp};${p.cac};${p.cfc};${p.crtv};${totalTax}\n`;
    });
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DIPE_IMPOTS_DGI_${selectedMonth.toUpperCase()}_2024.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Fichier DIPE Impôts DGI généré avec succès', 'success');
  };

  // Bank Transfer Order Generator
  const generateBankTransferFile = () => {
    let content = `ORDRE_DE_VIREMENT_SALAIRES;IDIBA_GROUP_SARL;BANQUE_${selectedBank.replace(/\s+/g, '_')};MOIS_${selectedMonth.toUpperCase()}_2024\n`;
    content += `MATRICULE;BENEFICIAIRE;BANQUE_EMETTEUR;COMPTE_RIB;MONTANT_NET_XAF\n`;
    filtered.forEach((p: any) => {
      content += `${p.employeeId};${p.employeeName};${selectedBank};10033-00001-12345678901-45;${p.netSalary}\n`;
    });
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ORDRE_VIREMENT_${selectedBank.replace(/\s+/g, '_')}_${selectedMonth}_2024.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Ordre de virement bancaire (${selectedBank}) téléchargeable`, 'success');
  };

  // Payroll Accounting Entry Generation (SYSCOHADA)
  const handlePostPayrollAccounting = () => {
    if (filtered.length === 0) {
      showToast('Aucun bulletin de paie disponible pour ce mois', 'warning');
      return;
    }
    const dateStr = new Date().toISOString().split('T')[0];
    const pieceNo = `PAIE-${selectedMonth.toUpperCase()}-2024`;
    const totalTaxes = totals.irpp + totals.cac + totals.cfc + totals.crtv;
    const totalCnps = totals.cnpsEmp + totals.cnpsEmpr;

    const entries = [
      {
        id: `acc-${Date.now()}-1`,
        date: dateStr,
        journal: 'OD',
        pieceNumber: pieceNo,
        accountCode: '6611',
        accountLabel: 'Appointements et Salaires Bruts',
        label: `Masse salariale brute - Paie ${selectedMonth} 2024`,
        debit: totals.gross,
        credit: 0,
        companyId: 'comp-1',
      },
      {
        id: `acc-${Date.now()}-2`,
        date: dateStr,
        journal: 'OD',
        pieceNumber: pieceNo,
        accountCode: '6641',
        accountLabel: 'Charges Sociales Patronales (CNPS)',
        label: `Cotisations patronales CNPS - ${selectedMonth} 2024`,
        debit: totals.cnpsEmpr,
        credit: 0,
        companyId: 'comp-1',
      },
      {
        id: `acc-${Date.now()}-3`,
        date: dateStr,
        journal: 'OD',
        pieceNumber: pieceNo,
        accountCode: '422',
        accountLabel: 'Personnel, Rémunérations dues',
        label: `Nets à payer personnel - ${selectedMonth} 2024`,
        debit: 0,
        credit: totals.net,
        companyId: 'comp-1',
      },
      {
        id: `acc-${Date.now()}-4`,
        date: dateStr,
        journal: 'OD',
        pieceNumber: pieceNo,
        accountCode: '431',
        accountLabel: 'Sécurité Sociale (CNPS)',
        label: `Cotisations CNPS Salariales + Patronales - ${selectedMonth} 2024`,
        debit: 0,
        credit: totalCnps,
        companyId: 'comp-1',
      },
      {
        id: `acc-${Date.now()}-5`,
        date: dateStr,
        journal: 'OD',
        pieceNumber: pieceNo,
        accountCode: '4471',
        accountLabel: 'État, Impôts et Taxes retenus à la source',
        label: `IRPP, CAC, CFC, CRTV retenus sur salaires - ${selectedMonth} 2024`,
        debit: 0,
        credit: totalTaxes,
        companyId: 'comp-1',
      },
    ];

    entries.forEach(e => addAndNotify('accountingEntries', e));
    showToast(`Écritures de paie ${selectedMonth} 2024 comptabilisées avec succès !`, 'success');
  };

  // Create Loan
  const handleCreateLoan = () => {
    if (!loanEmpId || !loanAmount || !loanMonthly) return;
    const emp = employees.find((e: any) => e.id === loanEmpId);
    if (!emp) return;
    const amount = Number(loanAmount);
    const monthly = Number(loanMonthly);
    const loan: EmployeeLoan = {
      id: `loan-${Date.now()}`,
      employeeId: emp.id,
      employeeName: emp.fullName,
      loanType,
      totalAmount: amount,
      monthlyDeduction: monthly,
      remainingAmount: amount,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      status: 'active',
      companyId: 'comp-1',
      createdAt: new Date().toISOString(),
    };
    addAndNotify('loans', loan);
    setShowLoanModal(false);
    setLoanEmpId('');
    setLoanAmount('');
    setLoanMonthly('');
    showToast('Prêt au personnel créé avec succès', 'success');
  };

  // Create Contract
  const handleCreateContract = () => {
    if (!contractEmpId || !contractSalary || !contractStart) return;
    const emp = employees.find((e: any) => e.id === contractEmpId);
    if (!emp) return;
    const newContract: EmployeeContract = {
      id: `contract-${Date.now()}`,
      employeeId: emp.id,
      employeeName: emp.fullName,
      type: contractType,
      startDate: contractStart,
      endDate: contractEnd || undefined,
      salary: Number(contractSalary),
      position: emp.position || 'Collaborateur',
      department: emp.departmentName || 'Général',
      benefits: ['Assurance Santé', 'Téléphone Pro'],
      status: 'active',
      createdAt: new Date().toISOString(),
      companyId: 'comp-1',
    };
    addAndNotify('contracts', newContract);
    setShowContractModal(false);
    setContractEmpId('');
    setContractSalary('');
    showToast('Nouveau contrat enregistré', 'success');
  };

  const getEmployeeHistory = (empId: string) => {
    return payroll.filter((p: any) => p.employeeId === empId).sort((a: any, b: any) => months.indexOf(b.month) - months.indexOf(a.month));
  };

  return (
    <div className="space-y-4">
      {/* Header & Main Tabs Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Calculator size={20} className="text-[var(--accent-primary)]" />
            Gestion de la Paie & Ressources Humaines
          </h2>
          <p className="text-xs text-[var(--text-muted)]">Calcul inverse, Livre de Paie, DIPE CNPS/Impôts, Virement & Comptabilisation SYSCOHADA</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowNewPayroll(true)} className="btn-primary h-9 text-xs gap-1.5 font-bold">
            <Plus size={14} /> Nouveau Bulletin de Paie
          </button>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="flex gap-1.5 overflow-x-auto bg-[var(--bg-elevated)] p-1 rounded-xl border border-[var(--glass-border)]">
        {[
          { id: 'bulletins', label: 'Bulletins de Paie', icon: FileText },
          { id: 'livre', label: 'Livre de Paie', icon: FileSpreadsheet },
          { id: 'dipe', label: 'DIPE CNPS & Impôts', icon: Shield },
          { id: 'inverse', label: 'Calcul Inverse', icon: RefreshCw },
          { id: 'virement', label: 'Ordres de Virement', icon: Landmark },
          { id: 'hr', label: 'Contrats, Congés & Prêts', icon: Briefcase },
          { id: 'compta', label: 'Comptabilisation PAIE', icon: FileCheck },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeMainTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveMainTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                isActive ? 'bg-[var(--accent-primary)] text-white shadow-md' : 'text-[var(--text-muted)] hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: BULLETINS DE PAIE */}
      {activeMainTab === 'bulletins' && (
        <div className="space-y-4">
          {/* CNPS Info Banner */}
          <div className="glass-card-compact p-4 bg-gradient-to-r from-[var(--accent-primary)]/5 to-[var(--accent-primary-hover)]/5 border border-[var(--accent-primary)]/10">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={16} className="text-[var(--accent-primary)]" />
              <span className="text-sm font-semibold text-[var(--text-primary)]">Cotisations CNPS — Législation Camerounaise / CEMAC</span>
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
              <span>Taux employeur total CNPS: 9.45% | Taux salarié: 4.2% | Plafond CNPS: 750 000 XAF/mois</span>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <GlassCard><div className="p-3"><p className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Masse salariale brute</p><p className="text-lg font-bold text-[var(--text-primary)]">{formatXAF(totals.gross)}</p></div></GlassCard>
            <GlassCard><div className="p-3"><p className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">CNPS (Sal. + Patron)</p><p className="text-lg font-bold text-[var(--accent-secondary)]">{formatXAF(totals.cnpsEmp + totals.cnpsEmpr)}</p></div></GlassCard>
            <GlassCard><div className="p-3"><p className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">IRPP collecté (Impôts)</p><p className="text-lg font-bold text-[var(--accent-warning)]">{formatXAF(totals.irpp)}</p></div></GlassCard>
            <GlassCard><div className="p-3"><p className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Coût total employeur</p><p className="text-lg font-bold text-[var(--accent-primary)]">{formatXAF(totals.employerCost)}</p></div></GlassCard>
          </div>

          {/* Month selector + Search */}
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-1 flex-wrap">
              {['Mai', 'Juin', 'Juillet', 'Août'].map(m => (
                <button key={m} onClick={() => setSelectedMonth(m)} className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${selectedMonth === m ? 'bg-[var(--accent-primary)] text-white font-bold' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'}`}>{m}</button>
              ))}
            </div>
            <div className="w-full md:w-64 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par nom..." className="w-full h-9 pl-9 pr-4 glass-input text-xs" />
            </div>
          </div>

          {/* Payroll Table */}
          <GlassCard>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--divider)] bg-[var(--bg-elevated)]">
                    <th className="text-left text-xs text-[var(--text-muted)] font-semibold uppercase px-3 py-3">Employé</th>
                    <th className="text-right text-xs text-[var(--text-muted)] font-semibold uppercase px-3 py-3">Brut</th>
                    <th className="text-right text-xs text-[var(--text-muted)] font-semibold uppercase px-3 py-3">CNPS Sal.</th>
                    <th className="text-right text-xs text-[var(--text-muted)] font-semibold uppercase px-3 py-3">CNPS Pat.</th>
                    <th className="text-right text-xs text-[var(--text-muted)] font-semibold uppercase px-3 py-3">IRPP</th>
                    <th className="text-right text-xs text-[var(--text-muted)] font-semibold uppercase px-3 py-3">Taxes Retenues</th>
                    <th className="text-right text-xs text-[var(--text-muted)] font-semibold uppercase px-3 py-3">Net à Payer</th>
                    <th className="text-right text-xs text-[var(--text-muted)] font-semibold uppercase px-3 py-3">Coût Employeur</th>
                    <th className="text-center text-xs text-[var(--text-muted)] font-semibold uppercase px-3 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p: any, i: number) => (
                    <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b border-[var(--divider)] hover:bg-white/[0.02]">
                      <td className="px-3 py-2.5">
                        <p className="text-xs font-semibold text-[var(--text-primary)]">{p.employeeName}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">N° {p.employeeId}</p>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-right font-medium text-[var(--text-primary)]">{formatXAF(p.grossSalary)}</td>
                      <td className="px-3 py-2.5 text-xs text-right text-red-400">-{formatXAF(p.cnpsEmployee)}</td>
                      <td className="px-3 py-2.5 text-xs text-right text-purple-400">{formatXAF(p.cnpsEmployer)}</td>
                      <td className="px-3 py-2.5 text-xs text-right text-amber-400">-{formatXAF(p.irpp)}</td>
                      <td className="px-3 py-2.5 text-xs text-right text-[var(--text-muted)]">-{formatXAF(p.crtv + p.cac + p.cfc)}</td>
                      <td className="px-3 py-2.5 text-xs text-right font-bold text-[var(--accent-primary)]">{formatXAF(p.netSalary)}</td>
                      <td className="px-3 py-2.5 text-xs text-right font-medium text-[var(--text-primary)]">{formatXAF(p.employerCost)}</td>
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setShowBulletin(p)} className="p-1.5 rounded hover:bg-white/10 text-[var(--accent-primary)]" title="Voir bulletin A4"><Eye size={14} /></button>
                          <button onClick={() => setShowHistory(p.employeeId)} className="p-1.5 rounded hover:bg-white/10 text-[var(--text-muted)]" title="Historique"><History size={14} /></button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center text-xs text-[var(--text-muted)] py-6">Aucun bulletin de paie enregistré pour le mois de {selectedMonth}.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}

      {/* TAB 2: LIVRE DE PAIE (PAYROLL REGISTER) */}
      {activeMainTab === 'livre' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-[var(--bg-elevated)] p-4 rounded-xl border border-[var(--glass-border)]">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <FileSpreadsheet size={16} className="text-[var(--accent-primary)]" />
                Livre de Paie Mensuel Récapitulatif ({selectedMonth} 2024)
              </h3>
              <p className="text-xs text-[var(--text-muted)]">Registre officiel consolidé de la paie conforme à la réglementation sociale et fiscale</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => window.print()} className="btn-secondary h-8 text-xs gap-1">
                <Printer size={14} /> Imprimer / Télécharger (Format Paysage A4)
              </button>
            </div>
          </div>

          <GlassCard className="payroll-print-document printable-document">
            <div className="overflow-x-auto">
              <table className="document-preview-table w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--bg-elevated)] text-[var(--text-muted)] font-bold uppercase border-b border-[var(--glass-border)]">
                    <th className="p-2.5 text-left">N°</th>
                    <th className="p-2.5 text-left">Nom & Prénom</th>
                    <th className="p-2.5 text-right">Salaire Brut</th>
                    <th className="p-2.5 text-right">Base CNPS (750k)</th>
                    <th className="p-2.5 text-right">CNPS Sal. (4.2%)</th>
                    <th className="p-2.5 text-right">CNPS Pat. (9.45%)</th>
                    <th className="p-2.5 text-right">IRPP</th>
                    <th className="p-2.5 text-right">CAC (10%)</th>
                    <th className="p-2.5 text-right">CRTV</th>
                    <th className="p-2.5 text-right">CFC</th>
                    <th className="p-2.5 text-right">Total Retenues</th>
                    <th className="p-2.5 text-right text-[var(--accent-primary)] font-bold">Net à Payer</th>
                    <th className="p-2.5 text-right">Coût Employeur</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p: any, idx: number) => {
                    const baseCnps = Math.min(p.grossSalary, 750000);
                    const totalDeductions = p.cnpsEmployee + p.irpp + p.cac + p.crtv + p.cfc;
                    return (
                      <tr key={p.id} className="border-b border-[var(--divider)] hover:bg-white/[0.02]">
                        <td className="p-2.5 font-mono text-[var(--text-muted)]">{idx + 1}</td>
                        <td className="p-2.5 font-semibold text-[var(--text-primary)]">{p.employeeName}</td>
                        <td className="p-2.5 text-right font-mono text-[var(--text-primary)]">{formatXAF(p.grossSalary)}</td>
                        <td className="p-2.5 text-right font-mono text-[var(--text-muted)]">{formatXAF(baseCnps)}</td>
                        <td className="p-2.5 text-right font-mono text-red-400">{formatXAF(p.cnpsEmployee)}</td>
                        <td className="p-2.5 text-right font-mono text-purple-400">{formatXAF(p.cnpsEmployer)}</td>
                        <td className="p-2.5 text-right font-mono text-amber-400">{formatXAF(p.irpp)}</td>
                        <td className="p-2.5 text-right font-mono text-[var(--text-muted)]">{formatXAF(p.cac)}</td>
                        <td className="p-2.5 text-right font-mono text-[var(--text-muted)]">{formatXAF(p.crtv)}</td>
                        <td className="p-2.5 text-right font-mono text-[var(--text-muted)]">{formatXAF(p.cfc)}</td>
                        <td className="p-2.5 text-right font-mono text-red-400 font-semibold">{formatXAF(totalDeductions)}</td>
                        <td className="p-2.5 text-right font-mono text-[var(--accent-primary)] font-bold text-sm">{formatXAF(p.netSalary)}</td>
                        <td className="p-2.5 text-right font-mono text-[var(--text-primary)] font-medium">{formatXAF(p.employerCost)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-[var(--bg-elevated)] font-bold text-xs border-t-2 border-[var(--glass-border)]">
                    <td colSpan={2} className="p-3 text-left uppercase text-[var(--accent-primary)]">TOTAL GÉNÉRAL ({selectedMonth})</td>
                    <td className="p-3 text-right font-mono">{formatXAF(totals.gross)}</td>
                    <td className="p-3 text-right font-mono text-[var(--text-muted)]">-</td>
                    <td className="p-3 text-right font-mono text-red-400">{formatXAF(totals.cnpsEmp)}</td>
                    <td className="p-3 text-right font-mono text-purple-400">{formatXAF(totals.cnpsEmpr)}</td>
                    <td className="p-3 text-right font-mono text-amber-400">{formatXAF(totals.irpp)}</td>
                    <td className="p-3 text-right font-mono">{formatXAF(totals.cac)}</td>
                    <td className="p-3 text-right font-mono">{formatXAF(totals.crtv)}</td>
                    <td className="p-3 text-right font-mono">{formatXAF(totals.cfc)}</td>
                    <td className="p-3 text-right font-mono text-red-400">{formatXAF(totals.cnpsEmp + totals.irpp + totals.cac + totals.crtv + totals.cfc)}</td>
                    <td className="p-3 text-right font-mono text-[var(--accent-primary)] text-sm">{formatXAF(totals.net)}</td>
                    <td className="p-3 text-right font-mono">{formatXAF(totals.employerCost)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </GlassCard>
        </div>
      )}

      {/* TAB 3: DIPE CNPS & DIPE IMPOTS */}
      {activeMainTab === 'dipe' && (
        <div className="space-y-6">
          {/* Section DIPE CNPS */}
          <GlassCard>
            <div className="p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--divider)] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <Shield size={18} className="text-[var(--accent-primary)]" />
                    DIPE Magnétique CNPS (Déclaration Mensuelle CNPS)
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">Fichier d'importation télédéclaration portail CNPS Cameroun</p>
                </div>
                <button onClick={generateDipeCnpsFile} className="btn-primary h-9 text-xs gap-2 font-bold bg-emerald-600 text-white hover:bg-emerald-500">
                  <Download size={14} /> Produire DIPE Magnétique CNPS (.txt)
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-[var(--bg-elevated)]"><p className="text-[10px] text-[var(--text-muted)]">Effectif Salariés</p><p className="text-sm font-bold text-[var(--text-primary)]">{filtered.length}</p></div>
                <div className="p-3 rounded-lg bg-[var(--bg-elevated)]"><p className="text-[10px] text-[var(--text-muted)]">Plafond Soumis (750k)</p><p className="text-sm font-bold text-[var(--text-secondary)]">{formatXAF(filtered.reduce((s, p) => s + Math.min(p.grossSalary, 750000), 0))}</p></div>
                <div className="p-3 rounded-lg bg-[var(--bg-elevated)]"><p className="text-[10px] text-[var(--text-muted)]">Cotisation Ouvrière (4.2%)</p><p className="text-sm font-bold text-red-400">{formatXAF(totals.cnpsEmp)}</p></div>
                <div className="p-3 rounded-lg bg-[var(--bg-elevated)]"><p className="text-[10px] text-[var(--text-muted)]">Total CNPS à Verser</p><p className="text-sm font-bold text-[var(--accent-primary)]">{formatXAF(totals.cnpsEmp + totals.cnpsEmpr)}</p></div>
              </div>
            </div>
          </GlassCard>

          {/* Section DIPE Impôts DGI */}
          <GlassCard>
            <div className="p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--divider)] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <FileText size={18} className="text-amber-400" />
                    DIPE Impôts (Direction Générale des Impôts - DGI)
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">Déclaration et récapitulatif des retenues à la source (IRPP, CAC 10%, CFC 1%, CRTV)</p>
                </div>
                <button onClick={generateDipeImpotsFile} className="btn-primary h-9 text-xs gap-2 font-bold bg-amber-600 text-white hover:bg-amber-500">
                  <Download size={14} /> Générer DIPE Impôts DGI (.txt)
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-[var(--bg-elevated)]"><p className="text-[10px] text-[var(--text-muted)]">IRPP Collecté</p><p className="text-sm font-bold text-amber-400">{formatXAF(totals.irpp)}</p></div>
                <div className="p-3 rounded-lg bg-[var(--bg-elevated)]"><p className="text-[10px] text-[var(--text-muted)]">CAC (10% IRPP)</p><p className="text-sm font-bold text-[var(--text-secondary)]">{formatXAF(totals.cac)}</p></div>
                <div className="p-3 rounded-lg bg-[var(--bg-elevated)]"><p className="text-[10px] text-[var(--text-muted)]">CRTV & CFC</p><p className="text-sm font-bold text-[var(--text-secondary)]">{formatXAF(totals.crtv + totals.cfc)}</p></div>
                <div className="p-3 rounded-lg bg-[var(--bg-elevated)]"><p className="text-[10px] text-[var(--text-muted)]">Total Impôts DGI</p><p className="text-sm font-bold text-[var(--accent-primary)]">{formatXAF(totals.irpp + totals.cac + totals.crtv + totals.cfc)}</p></div>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* TAB 4: CALCUL INVERSE DE PAIE */}
      {activeMainTab === 'inverse' && (
        <div className="space-y-4">
          <GlassCard>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                  <RefreshCw size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">Simulateur de Calcul Inverse de Salaire</h3>
                  <p className="text-xs text-[var(--text-muted)]">Entrez le montant Net Souhaité pour déterminer exactement le Salaire Brut et toutes les cotisations requises</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)]">Salaire Net Désiré (XAF)</label>
                  <input
                    type="number"
                    value={targetNetInput}
                    onChange={(e) => {
                      setTargetNetInput(e.target.value);
                      const num = Number(e.target.value);
                      setReverseResult(reverseCalculatePayroll(num));
                    }}
                    className="w-full h-11 px-3 glass-input text-lg font-bold text-[var(--accent-primary)]"
                    placeholder="ex: 500000"
                  />
                  <p className="text-[10px] text-[var(--text-muted)]">Incrémentation automatique via algorithme de bisection Fiscale Camerounaise</p>
                </div>

                <div className="col-span-2 p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] space-y-3">
                  <p className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Résultat du Calcul Inverse :</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div><span className="text-[var(--text-muted)] block text-[10px]">Salaire Brut Requis</span><span className="font-bold text-base text-[var(--text-primary)]">{formatXAF(reverseResult.gross)}</span></div>
                    <div><span className="text-[var(--text-muted)] block text-[10px]">Retenue CNPS Salarié</span><span className="font-semibold text-red-400">-{formatXAF(reverseResult.details.cnpsEmployee)}</span></div>
                    <div><span className="text-[var(--text-muted)] block text-[10px]">Total Impôts (IRPP+CAC)</span><span className="font-semibold text-amber-400">-{formatXAF(reverseResult.details.irpp + reverseResult.details.cac)}</span></div>
                    <div><span className="text-[var(--text-muted)] block text-[10px]">Coût Employeur Total</span><span className="font-bold text-emerald-400">{formatXAF(reverseResult.details.employerCost)}</span></div>
                  </div>
                  <div className="pt-2">
                    <button onClick={handleApplyReversePayroll} className="btn-primary h-9 text-xs font-bold gap-2">
                      <CheckCircle2 size={14} /> Générer le Bulletin à partir de ce Brut ({formatXAF(reverseResult.gross)})
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* TAB 5: ORDRES DE VIREMENT BANCAIRES */}
      {activeMainTab === 'virement' && (
        <div className="space-y-4">
          <GlassCard>
            <div className="p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--divider)] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <Landmark size={18} className="text-[var(--accent-primary)]" />
                    Édition des Ordres de Virement Bancaire des Salaires
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">Générez la lettre d'ordre de virement et le fichier d'échange bancaire (.csv)</p>
                </div>
                <div className="flex items-center gap-2">
                  <select value={selectedBank} onChange={e => setSelectedBank(e.target.value)} className="h-9 px-3 glass-input text-xs">
                    <option value="UBA Cameroun">UBA Cameroun</option>
                    <option value="Société Générale Cameroun">Société Générale (SGBC)</option>
                    <option value="Afriland First Bank">Afriland First Bank</option>
                    <option value="Ecobank Cameroun">Ecobank Cameroun</option>
                  </select>
                  <button onClick={generateBankTransferFile} className="btn-primary h-9 text-xs font-bold gap-1.5">
                    <Download size={14} /> Exporter Fichier Virement (.csv)
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[var(--glass-border)] bg-[var(--bg-elevated)] text-[var(--text-muted)] font-semibold uppercase">
                      <th className="p-2.5 text-left">Employé</th>
                      <th className="p-2.5 text-left">Banque Bénéficiaire</th>
                      <th className="p-2.5 text-left">N° Compte / RIB</th>
                      <th className="p-2.5 text-right font-bold text-[var(--accent-primary)]">Net à Virer (XAF)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p: any) => (
                      <tr key={p.id} className="border-b border-[var(--divider)]">
                        <td className="p-2.5 font-semibold text-[var(--text-primary)]">{p.employeeName}</td>
                        <td className="p-2.5 text-[var(--text-secondary)]">{selectedBank}</td>
                        <td className="p-2.5 font-mono text-[var(--text-muted)]">10033 00001 12345678901 45</td>
                        <td className="p-2.5 text-right font-mono font-bold text-[var(--accent-primary)]">{formatXAF(p.netSalary)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* TAB 6: CONTRATS, CONGÉS & PRÊTS DU PERSONNEL */}
      {activeMainTab === 'hr' && (
        <div className="space-y-4">
          <div className="flex gap-2 border-b border-[var(--glass-border)] pb-2">
            {[
              { id: 'contracts', label: 'Suivi des Contrats', count: contracts.length },
              { id: 'leaves', label: 'Absences & Congés', count: leaves.length },
              { id: 'loans', label: 'Prêts & Avances Personnel', count: loans.length },
            ].map(sub => (
              <button
                key={sub.id}
                onClick={() => setHrSubTab(sub.id as any)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                  hrSubTab === sub.id ? 'bg-[var(--accent-primary)] text-white font-bold' : 'text-[var(--text-muted)] bg-[var(--bg-elevated)]'
                }`}
              >
                {sub.label} ({sub.count})
              </button>
            ))}
          </div>

          {/* Sub-tab 1: Contrats */}
          {hrSubTab === 'contracts' && (
            <GlassCard>
              <div className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">Suivi des Contrats du Personnel (CDI, CDD, Stage)</h3>
                  <button onClick={() => setShowContractModal(true)} className="btn-primary h-8 text-xs gap-1"><Plus size={14} /> Nouveau Contrat</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[var(--divider)] text-[var(--text-muted)] font-semibold uppercase">
                        <th className="p-2.5 text-left">Employé</th>
                        <th className="p-2.5 text-left">Type Contrat</th>
                        <th className="p-2.5 text-left">Poste</th>
                        <th className="p-2.5 text-left">Date Début</th>
                        <th className="p-2.5 text-left">Date Fin / Échéance</th>
                        <th className="p-2.5 text-right">Salaire Mensuel</th>
                        <th className="p-2.5 text-center">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contracts.map(c => (
                        <tr key={c.id} className="border-b border-[var(--divider)]">
                          <td className="p-2.5 font-semibold text-[var(--text-primary)]">{c.employeeName}</td>
                          <td className="p-2.5 font-bold uppercase text-[var(--accent-secondary)]">{c.type}</td>
                          <td className="p-2.5 text-[var(--text-muted)]">{c.position}</td>
                          <td className="p-2.5 text-[var(--text-muted)]">{c.startDate}</td>
                          <td className="p-2.5 text-[var(--text-muted)]">{c.endDate || 'Indéterminée (CDI)'}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-[var(--accent-primary)]">{formatXAF(c.salary)}</td>
                          <td className="p-2.5 text-center"><StatusBadge status={c.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Sub-tab 2: Congés */}
          {hrSubTab === 'leaves' && (
            <GlassCard>
              <div className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">Absences & Solde de Congés Payés</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[var(--divider)] text-[var(--text-muted)] font-semibold uppercase">
                        <th className="p-2.5 text-left">Employé</th>
                        <th className="p-2.5 text-left">Type d'Absence</th>
                        <th className="p-2.5 text-left">Période</th>
                        <th className="p-2.5 text-center">Nombre Jours</th>
                        <th className="p-2.5 text-left">Motif</th>
                        <th className="p-2.5 text-center">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaves.map(l => (
                        <tr key={l.id} className="border-b border-[var(--divider)]">
                          <td className="p-2.5 font-semibold text-[var(--text-primary)]">{l.employeeName}</td>
                          <td className="p-2.5 font-medium text-[var(--text-secondary)]">{l.type}</td>
                          <td className="p-2.5 text-[var(--text-muted)]">{l.startDate} au {l.endDate}</td>
                          <td className="p-2.5 text-center font-bold text-[var(--text-primary)]">{l.days}j</td>
                          <td className="p-2.5 text-[var(--text-muted)]">{l.reason}</td>
                          <td className="p-2.5 text-center"><StatusBadge status={l.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Sub-tab 3: Prêts */}
          {hrSubTab === 'loans' && (
            <GlassCard>
              <div className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">Gestion des Prêts & Avances au Personnel</h3>
                  <button onClick={() => setShowLoanModal(true)} className="btn-primary h-8 text-xs gap-1"><Plus size={14} /> Accorder un Prêt / Avance</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[var(--divider)] text-[var(--text-muted)] font-semibold uppercase">
                        <th className="p-2.5 text-left">Employé</th>
                        <th className="p-2.5 text-left">Type de Prêt</th>
                        <th className="p-2.5 text-right">Montant Total</th>
                        <th className="p-2.5 text-right">Retenue Mensuelle</th>
                        <th className="p-2.5 text-right">Solde Restant</th>
                        <th className="p-2.5 text-center">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loans.map(loan => (
                        <tr key={loan.id} className="border-b border-[var(--divider)]">
                          <td className="p-2.5 font-semibold text-[var(--text-primary)]">{loan.employeeName}</td>
                          <td className="p-2.5 text-[var(--text-secondary)] capitalize">{loan.loanType.replace('_', ' ')}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-[var(--text-primary)]">{formatXAF(loan.totalAmount)}</td>
                          <td className="p-2.5 text-right font-mono text-red-400">-{formatXAF(loan.monthlyDeduction)}/mois</td>
                          <td className="p-2.5 text-right font-mono font-bold text-amber-400">{formatXAF(loan.remainingAmount)}</td>
                          <td className="p-2.5 text-center"><StatusBadge status={loan.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </GlassCard>
          )}
        </div>
      )}

      {/* TAB 7: COMPTABILISATION DE LA PAIE SYSCOHADA */}
      {activeMainTab === 'compta' && (
        <div className="space-y-4">
          <GlassCard>
            <div className="p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--divider)] pb-3">
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <FileCheck size={20} className="text-[var(--accent-primary)]" />
                    Générateur d'Écritures Comptables de Paie (Plan Comptable SYSCOHADA)
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">Comptabilisation automatique des salaires bruts, charges patronales et retenues sociales/fiscales</p>
                </div>
                <button onClick={handlePostPayrollAccounting} className="btn-primary h-10 px-4 text-xs font-bold gap-2 bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg">
                  <Check size={16} /> Comptabiliser la Paie du Mois ({selectedMonth})
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[var(--bg-elevated)] border-b border-[var(--glass-border)] text-[var(--text-muted)] font-bold uppercase">
                      <th className="p-3 text-left">N° Compte OHADA</th>
                      <th className="p-3 text-left">Intitulé du Compte</th>
                      <th className="p-3 text-left">Libellé d'Écriture</th>
                      <th className="p-3 text-right text-emerald-400">Débit (XAF)</th>
                      <th className="p-3 text-right text-blue-400">Crédit (XAF)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[var(--divider)]">
                      <td className="p-3 font-mono font-bold text-[var(--accent-primary)]">6611</td>
                      <td className="p-3 font-semibold text-[var(--text-primary)]">Appointements et Salaires Bruts</td>
                      <td className="p-3 text-[var(--text-muted)]">Masse salariale brute - Paie {selectedMonth} 2024</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-400">{formatXAF(totals.gross)}</td>
                      <td className="p-3 text-right font-mono text-[var(--text-muted)]">0 FCFA</td>
                    </tr>
                    <tr className="border-b border-[var(--divider)]">
                      <td className="p-3 font-mono font-bold text-[var(--accent-primary)]">6641</td>
                      <td className="p-3 font-semibold text-[var(--text-primary)]">Charges Sociales Patronales (CNPS)</td>
                      <td className="p-3 text-[var(--text-muted)]">Cotisations patronales CNPS (4.2% + 1.75% + 1.5%) - {selectedMonth} 2024</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-400">{formatXAF(totals.cnpsEmpr)}</td>
                      <td className="p-3 text-right font-mono text-[var(--text-muted)]">0 FCFA</td>
                    </tr>
                    <tr className="border-b border-[var(--divider)]">
                      <td className="p-3 font-mono font-bold text-purple-400">422</td>
                      <td className="p-3 font-semibold text-[var(--text-primary)]">Personnel, Rémunérations dues</td>
                      <td className="p-3 text-[var(--text-muted)]">Nets à payer au personnel - Paie {selectedMonth} 2024</td>
                      <td className="p-3 text-right font-mono text-[var(--text-muted)]">0 FCFA</td>
                      <td className="p-3 text-right font-mono font-bold text-blue-400">{formatXAF(totals.net)}</td>
                    </tr>
                    <tr className="border-b border-[var(--divider)]">
                      <td className="p-3 font-mono font-bold text-purple-400">431</td>
                      <td className="p-3 font-semibold text-[var(--text-primary)]">Sécurité Sociale (CNPS)</td>
                      <td className="p-3 text-[var(--text-muted)]">Total cotisations CNPS Salariales + Patronales - {selectedMonth} 2024</td>
                      <td className="p-3 text-right font-mono text-[var(--text-muted)]">0 FCFA</td>
                      <td className="p-3 text-right font-mono font-bold text-blue-400">{formatXAF(totals.cnpsEmp + totals.cnpsEmpr)}</td>
                    </tr>
                    <tr className="border-b border-[var(--divider)]">
                      <td className="p-3 font-mono font-bold text-purple-400">4471</td>
                      <td className="p-3 font-semibold text-[var(--text-primary)]">État, Impôts & Taxes retenus à la source</td>
                      <td className="p-3 text-[var(--text-muted)]">IRPP, CAC (10%), CFC (1%), CRTV retenus sur salaires</td>
                      <td className="p-3 text-right font-mono text-[var(--text-muted)]">0 FCFA</td>
                      <td className="p-3 text-right font-mono font-bold text-blue-400">{formatXAF(totals.irpp + totals.cac + totals.cfc + totals.crtv)}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-[var(--bg-elevated)] font-bold text-xs border-t-2 border-[var(--glass-border)]">
                      <td colSpan={3} className="p-3 text-left uppercase text-[var(--accent-primary)]">TOTAL ÉQUILIBRÉ ÉCRITURE SYSCOHADA</td>
                      <td className="p-3 text-right font-mono text-emerald-400 text-sm">{formatXAF(totals.gross + totals.cnpsEmpr)}</td>
                      <td className="p-3 text-right font-mono text-blue-400 text-sm">{formatXAF(totals.net + totals.cnpsEmp + totals.cnpsEmpr + totals.irpp + totals.cac + totals.cfc + totals.crtv)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Modal Bulletin A4 Printable */}
      <AnimatePresence>
        {showBulletin && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowBulletin(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md glass-card z-50 max-h-[85vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Bulletin de Paie Formatted A4</h2>
                  <button onClick={() => setShowBulletin(null)} className="p-2 rounded-lg hover:bg-white/5"><X size={18} className="text-[var(--text-muted)]" /></button>
                </div>
                <div className="text-center mb-4">
                  <p className="text-xs text-[var(--text-muted)]">IDIBA Group SARL — {showBulletin.month} 2024</p>
                  <p className="text-sm font-bold text-[var(--text-primary)] mt-1">{showBulletin.employeeName}</p>
                </div>
                <div className="space-y-1.5 text-xs mb-4">
                  <div className="flex justify-between py-1 border-b border-[var(--divider)]"><span className="text-[var(--text-secondary)]">Salaire Brut Base</span><span className="text-[var(--text-primary)] font-medium">{formatXAF(showBulletin.grossSalary)}</span></div>
                  <div className="flex justify-between py-1 border-b border-[var(--divider)]"><span className="text-[var(--text-secondary)]">CNPS Salarié (4.2%)</span><span className="text-red-400">-{formatXAF(showBulletin.cnpsEmployee)}</span></div>
                  <div className="flex justify-between py-1 border-b border-[var(--divider)]"><span className="text-[var(--text-secondary)]">IRPP (Impôt revenu)</span><span className="text-amber-400">-{formatXAF(showBulletin.irpp)}</span></div>
                  <div className="flex justify-between py-1 border-b border-[var(--divider)]"><span className="text-[var(--text-secondary)]">CRTV & Taxes</span><span className="text-[var(--text-muted)]">-{formatXAF(showBulletin.crtv + showBulletin.cac + showBulletin.cfc)}</span></div>
                  <div className="flex justify-between py-2 font-bold text-sm bg-[var(--bg-elevated)] px-2 rounded"><span className="text-[var(--text-primary)]">NET À PAYER</span><span className="text-[var(--accent-primary)]">{formatXAF(showBulletin.netSalary)}</span></div>
                </div>
                <button onClick={() => showToast('Bulletin téléchargé au format PDF A4', 'success')} className="w-full btn-primary h-10 justify-center text-xs gap-2 font-bold">
                  <Download size={14} /> Imprimer / Télécharger (PDF A4)
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal New Payroll */}
      <AnimatePresence>
        {showNewPayroll && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowNewPayroll(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="fixed right-0 top-0 bottom-0 w-full max-w-md border-l border-[var(--glass-border)] bg-[var(--bg-card)] z-50 overflow-y-auto shadow-2xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Nouveau Bulletin de Paie</h2>
                  <button onClick={() => setShowNewPayroll(false)} className="p-2 rounded-lg hover:bg-white/5"><X size={18} className="text-[var(--text-muted)]" /></button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-[var(--text-secondary)] mb-1">Employé Beneficiaire</label>
                    <select value={newPayrollEmp} onChange={e => setNewPayrollEmp(e.target.value)} className="w-full h-9 px-3 glass-input text-xs">
                      <option value="">Sélectionner un employé...</option>
                      {employees.map((e: any) => <option key={e.id} value={e.id}>{e.fullName} — {e.position}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--text-secondary)] mb-1">Mois de Paie</label>
                    <select value={newPayrollMonth} onChange={e => setNewPayrollMonth(e.target.value)} className="w-full h-9 px-3 glass-input text-xs">
                      {months.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--text-secondary)] mb-1">Salaire Brut (XAF)</label>
                    <input type="number" value={newPayrollGross} onChange={e => setNewPayrollGross(e.target.value)} className="w-full h-9 px-3 glass-input text-xs" placeholder="ex: 600000" />
                  </div>
                  {newPayrollGross && (
                    <div className="glass-card-compact p-3 space-y-1 text-xs">
                      <p className="text-[var(--text-muted)] font-semibold mb-1">Prévisualisation :</p>
                      {(() => {
                        const calc = calculatePayroll(Number(newPayrollGross));
                        return (
                          <>
                            <div className="flex justify-between"><span className="text-[var(--text-secondary)]">CNPS Salarié (4.2%)</span><span className="text-red-400">-{formatXAF(calc.cnpsEmployee)}</span></div>
                            <div className="flex justify-between"><span className="text-[var(--text-secondary)]">IRPP (Impôt)</span><span className="text-amber-400">-{formatXAF(calc.irpp)}</span></div>
                            <div className="flex justify-between font-bold text-sm pt-1 border-t border-[var(--divider)]"><span className="text-[var(--text-primary)]">Net Estimé</span><span className="text-[var(--accent-primary)]">{formatXAF(calc.net)}</span></div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowNewPayroll(false)} className="flex-1 btn-ghost h-9 justify-center text-xs">Annuler</button>
                    <button onClick={handleCreatePayroll} disabled={!newPayrollEmp || !newPayrollGross} className="flex-1 btn-primary h-9 justify-center text-xs font-bold disabled:opacity-50">Générer la Paie</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal New Loan */}
      <AnimatePresence>
        {showLoanModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowLoanModal(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="fixed right-0 top-0 bottom-0 w-full max-w-md border-l border-[var(--glass-border)] bg-[var(--bg-card)] z-50 overflow-y-auto shadow-2xl">
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-base font-bold text-[var(--text-primary)]">Créer un Prêt / Avance au Personnel</h2>
                  <button onClick={() => setShowLoanModal(false)}><X size={18} className="text-[var(--text-muted)]" /></button>
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">Employé</label>
                  <select value={loanEmpId} onChange={e => setLoanEmpId(e.target.value)} className="w-full h-9 px-3 glass-input text-xs">
                    <option value="">Sélectionner un employé...</option>
                    {employees.map((e: any) => <option key={e.id} value={e.id}>{e.fullName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">Type de Prêt</label>
                  <select value={loanType} onChange={e => setLoanType(e.target.value as any)} className="w-full h-9 px-3 glass-input text-xs">
                    <option value="avance_salaire">Avance sur Salaire</option>
                    <option value="pret_equipement">Prêt Équipement / Matériel</option>
                    <option value="pret_immobilier">Prêt Logement / Équipement</option>
                    <option value="pret_secours">Prêt Secours / Urgence</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">Montant Total Prêté (XAF)</label>
                  <input type="number" value={loanAmount} onChange={e => setLoanAmount(e.target.value)} className="w-full h-9 px-3 glass-input text-xs" placeholder="ex: 300000" />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">Retenue Mensuelle sur Paie (XAF)</label>
                  <input type="number" value={loanMonthly} onChange={e => setLoanMonthly(e.target.value)} className="w-full h-9 px-3 glass-input text-xs" placeholder="ex: 50000" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowLoanModal(false)} className="flex-1 btn-ghost h-9 justify-center text-xs">Annuler</button>
                  <button onClick={handleCreateLoan} disabled={!loanEmpId || !loanAmount || !loanMonthly} className="flex-1 btn-primary h-9 justify-center text-xs font-bold disabled:opacity-50">Valider le Prêt</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal New Contract */}
      <AnimatePresence>
        {showContractModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowContractModal(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="fixed right-0 top-0 bottom-0 w-full max-w-md border-l border-[var(--glass-border)] bg-[var(--bg-card)] z-50 overflow-y-auto shadow-2xl">
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-base font-bold text-[var(--text-primary)]">Enregistrer un Contrat de Travail</h2>
                  <button onClick={() => setShowContractModal(false)}><X size={18} className="text-[var(--text-muted)]" /></button>
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">Employé</label>
                  <select value={contractEmpId} onChange={e => setContractEmpId(e.target.value)} className="w-full h-9 px-3 glass-input text-xs">
                    <option value="">Sélectionner un employé...</option>
                    {employees.map((e: any) => <option key={e.id} value={e.id}>{e.fullName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">Type de Contrat</label>
                  <select value={contractType} onChange={e => setContractType(e.target.value as any)} className="w-full h-9 px-3 glass-input text-xs">
                    <option value="cdi">CDI (Durée Indéterminée)</option>
                    <option value="cdd">CDD (Durée Déterminée)</option>
                    <option value="stage">Stage Professionnel</option>
                    <option value="freelance">Freelance / Consultant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">Date de Début</label>
                  <input type="date" value={contractStart} onChange={e => setContractStart(e.target.value)} className="w-full h-9 px-3 glass-input text-xs" />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">Date de Fin (Optionnelle si CDI)</label>
                  <input type="date" value={contractEnd} onChange={e => setContractEnd(e.target.value)} className="w-full h-9 px-3 glass-input text-xs" />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">Salaire Négocié (XAF)</label>
                  <input type="number" value={contractSalary} onChange={e => setContractSalary(e.target.value)} className="w-full h-9 px-3 glass-input text-xs" placeholder="ex: 450000" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowContractModal(false)} className="flex-1 btn-ghost h-9 justify-center text-xs">Annuler</button>
                  <button onClick={handleCreateContract} disabled={!contractEmpId || !contractSalary || !contractStart} className="flex-1 btn-primary h-9 justify-center text-xs font-bold disabled:opacity-50">Enregistrer le Contrat</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
