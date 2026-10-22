import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  FileText, Download, Globe, Building2, Calendar, Calculator,
  ChevronRight, CheckCircle, AlertTriangle, X, Plus,
  TrendingUp, TrendingDown, Landmark, Receipt, Users, Package,
  ArrowRight, FileSpreadsheet
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { useUIStore } from '@/stores/uiStore';
import { useBrandingStore } from '@/stores/brandingStore';
import { getAll, addAndNotify } from '@/lib/db';
import { registerExposePdfFont } from '@/lib/pdf-font';
import type { DSFForm, OhadaCountry, CountryTaxConfig } from '@/types';
import { usePlatformFinancialSettings } from '@/hooks/usePlatformFinancialSettings';

// Configuration fiscale par pays OHADA
const COUNTRY_CONFIGS: Record<OhadaCountry, CountryTaxConfig> = {
  CM: {
    code: 'CM', name: 'Cameroun', vatRate: 19.25, vatReducedRate: 0,
    isRate: 30, isPMERate: 28, irppEnabled: true,
    irppBrackets: [{ limit: 2000000, rate: 10 }, { limit: 3000000, rate: 15 }, { limit: 5000000, rate: 25 }, { limit: 10000000, rate: 35 }],
    cnpsEnabled: true,
    cnpsRates: { pensionEmployee: 4.2, pensionEmployer: 4.2, atmp: 1.75, familyAllowances: 1.5 },
    otherTaxes: [{ name: 'CRTV', rate: 1.5, base: 'MASSE_SALARIALE' }, { name: 'CAC', rate: 1.0, base: 'CA' }, { name: 'CFC', rate: 0.5, base: 'MASSE_SALARIALE' }],
    socialOrgName: 'CNPS', fiscalYearEnd: '12-31', dsfDeadlineDays: 90, dsfFormCode: 'DSF-CM-01'
  },
  CI: {
    code: 'CI', name: "Cote d'Ivoire", vatRate: 18, irppEnabled: true,
    irppBrackets: [{ limit: 0, rate: 0 }, { limit: 3000000, rate: 10 }, { limit: 5000000, rate: 15 }, { limit: 10000000, rate: 25 }, { limit: 15000000, rate: 35 }],
    isRate: 25, cnpsEnabled: true,
    cnpsRates: { pensionEmployee: 5.6, pensionEmployer: 7.7, atmp: 2, familyAllowances: 2.4 },
    otherTaxes: [{ name: 'Contribution Nationale', rate: 1.5, base: 'BENEFICE' }],
    socialOrgName: 'CNPS', fiscalYearEnd: '12-31', dsfDeadlineDays: 90, dsfFormCode: 'DSF-CI-01'
  },
  SN: {
    code: 'SN', name: 'Senegal', vatRate: 18, irppEnabled: true,
    irppBrackets: [{ limit: 1000000, rate: 0 }, { limit: 3000000, rate: 20 }, { limit: 5000000, rate: 25 }, { limit: 10000000, rate: 30 }],
    isRate: 30, cnpsEnabled: true,
    cnpsRates: { pensionEmployee: 5.6, pensionEmployer: 7, atmp: 1, familyAllowances: 3 },
    otherTaxes: [{ name: 'CSS', rate: 3, base: 'MASSE_SALARIALE' }],
    socialOrgName: 'CSS', fiscalYearEnd: '12-31', dsfDeadlineDays: 90, dsfFormCode: 'DSF-SN-01'
  },
  BF: {
    code: 'BF', name: 'Burkina Faso', vatRate: 18, irppEnabled: true,
    irppBrackets: [{ limit: 0, rate: 0 }, { limit: 300000, rate: 10 }, { limit: 500000, rate: 15 }, { limit: 1000000, rate: 20 }, { limit: 2000000, rate: 25 }],
    isRate: 27.5, cnpsEnabled: true,
    cnpsRates: { pensionEmployee: 5.5, pensionEmployer: 7.5, atmp: 1, familyAllowances: 3 },
    otherTaxes: [{ name: 'Patente', rate: 0, base: 'FORFAIT' }],
    socialOrgName: 'CNSS', fiscalYearEnd: '12-31', dsfDeadlineDays: 90, dsfFormCode: 'DSF-BF-01'
  },
  GA: {
    code: 'GA', name: 'Gabon', vatRate: 18, irppEnabled: true,
    irppBrackets: [{ limit: 0, rate: 0 }, { limit: 5000000, rate: 15 }, { limit: 10000000, rate: 20 }],
    isRate: 30, cnpsEnabled: true,
    cnpsRates: { pensionEmployee: 2.5, pensionEmployer: 5, atmp: 1, familyAllowances: 3 },
    otherTaxes: [{ name: 'CIS', rate: 2.5, base: 'MASSE_SALARIALE' }],
    socialOrgName: 'CNSS', fiscalYearEnd: '12-31', dsfDeadlineDays: 90, dsfFormCode: 'DSF-GA-01'
  },
  BJ: {
    code: 'BJ', name: 'Benin', vatRate: 18, irppEnabled: true,
    irppBrackets: [{ limit: 0, rate: 0 }, { limit: 300000, rate: 10 }, { limit: 500000, rate: 15 }, { limit: 1000000, rate: 20 }],
    isRate: 30, cnpsEnabled: true,
    cnpsRates: { pensionEmployee: 5, pensionEmployer: 7.5, atmp: 1, familyAllowances: 3 },
    otherTaxes: [],
    socialOrgName: 'CNSS', fiscalYearEnd: '12-31', dsfDeadlineDays: 90, dsfFormCode: 'DSF-BJ-01'
  },
  TG: {
    code: 'TG', name: 'Togo', vatRate: 18, irppEnabled: true,
    irppBrackets: [{ limit: 0, rate: 0 }, { limit: 900000, rate: 6 }, { limit: 1500000, rate: 15 }, { limit: 3000000, rate: 25 }, { limit: 5000000, rate: 30 }],
    isRate: 27, isPMERate: 25, cnpsEnabled: true,
    cnpsRates: { pensionEmployee: 4, pensionEmployer: 6.3, atmp: 1, familyAllowances: 3 },
    otherTaxes: [{ name: 'CFCE', rate: 1, base: 'CA' }],
    socialOrgName: 'CNSS', fiscalYearEnd: '12-31', dsfDeadlineDays: 90, dsfFormCode: 'DSF-TG-01'
  },
  ML: {
    code: 'ML', name: 'Mali', vatRate: 18, irppEnabled: true,
    irppBrackets: [{ limit: 0, rate: 0 }, { limit: 330000, rate: 10 }, { limit: 500000, rate: 15 }, { limit: 1000000, rate: 20 }, { limit: 2000000, rate: 30 }],
    isRate: 30, cnpsEnabled: true,
    cnpsRates: { pensionEmployee: 3.5, pensionEmployer: 6, atmp: 1, familyAllowances: 3 },
    otherTaxes: [{ name: 'AMO', rate: 3.5, base: 'MASSE_SALARIALE' }],
    socialOrgName: 'INPS', fiscalYearEnd: '12-31', dsfDeadlineDays: 90, dsfFormCode: 'DSF-ML-01'
  },
  NE: {
    code: 'NE', name: 'Niger', vatRate: 19, irppEnabled: true,
    irppBrackets: [{ limit: 0, rate: 0 }, { limit: 300000, rate: 10 }, { limit: 500000, rate: 15 }, { limit: 1000000, rate: 20 }],
    isRate: 30, cnpsEnabled: true,
    cnpsRates: { pensionEmployee: 4.5, pensionEmployer: 6.5, atmp: 1, familyAllowances: 3 },
    otherTaxes: [],
    socialOrgName: 'CNSS', fiscalYearEnd: '12-31', dsfDeadlineDays: 90, dsfFormCode: 'DSF-NE-01'
  },
  CD: {
    code: 'CD', name: 'RDC', vatRate: 16, irppEnabled: true,
    irppBrackets: [{ limit: 0, rate: 0 }, { limit: 300000, rate: 10 }, { limit: 500000, rate: 15 }, { limit: 1000000, rate: 20 }],
    isRate: 30, cnpsEnabled: true,
    cnpsRates: { pensionEmployee: 3, pensionEmployer: 5, atmp: 1, familyAllowances: 3 },
    otherTaxes: [{ name: 'Iere', rate: 1, base: 'CA' }],
    socialOrgName: 'CNSS', fiscalYearEnd: '12-31', dsfDeadlineDays: 90, dsfFormCode: 'DSF-CD-01'
  },
  TD: {
    code: 'TD', name: 'Tchad', vatRate: 18, irppEnabled: true,
    irppBrackets: [{ limit: 0, rate: 0 }, { limit: 300000, rate: 10 }, { limit: 500000, rate: 15 }, { limit: 1000000, rate: 20 }],
    isRate: 35, cnpsEnabled: true,
    cnpsRates: { pensionEmployee: 3.5, pensionEmployer: 6, atmp: 1, familyAllowances: 3 },
    otherTaxes: [],
    socialOrgName: 'CNSS', fiscalYearEnd: '12-31', dsfDeadlineDays: 90, dsfFormCode: 'DSF-TD-01'
  },
  GN: {
    code: 'GN', name: 'Guinee', vatRate: 18, irppEnabled: true,
    irppBrackets: [{ limit: 0, rate: 0 }, { limit: 300000, rate: 10 }, { limit: 500000, rate: 15 }, { limit: 1000000, rate: 20 }],
    isRate: 25, cnpsEnabled: true,
    cnpsRates: { pensionEmployee: 3, pensionEmployer: 5, atmp: 1, familyAllowances: 3 },
    otherTaxes: [],
    socialOrgName: 'CNSS', fiscalYearEnd: '12-31', dsfDeadlineDays: 90, dsfFormCode: 'DSF-GN-01'
  },
  CG: {
    code: 'CG', name: 'Congo', vatRate: 18, irppEnabled: true,
    irppBrackets: [{ limit: 0, rate: 0 }, { limit: 300000, rate: 10 }, { limit: 500000, rate: 15 }, { limit: 1000000, rate: 20 }],
    isRate: 30, cnpsEnabled: true,
    cnpsRates: { pensionEmployee: 4, pensionEmployer: 6, atmp: 1, familyAllowances: 3 },
    otherTaxes: [],
    socialOrgName: 'CNSS', fiscalYearEnd: '12-31', dsfDeadlineDays: 90, dsfFormCode: 'DSF-CG-01'
  },
  CF: {
    code: 'CF', name: 'RCA', vatRate: 19, irppEnabled: true,
    irppBrackets: [{ limit: 0, rate: 0 }, { limit: 300000, rate: 10 }, { limit: 500000, rate: 15 }, { limit: 1000000, rate: 20 }],
    isRate: 30, cnpsEnabled: true,
    cnpsRates: { pensionEmployee: 3.5, pensionEmployer: 5, atmp: 1, familyAllowances: 3 },
    otherTaxes: [],
    socialOrgName: 'CNSS', fiscalYearEnd: '12-31', dsfDeadlineDays: 90, dsfFormCode: 'DSF-CF-01'
  },
  KM: {
    code: 'KM', name: 'Comores', vatRate: 10, irppEnabled: true,
    irppBrackets: [{ limit: 0, rate: 0 }, { limit: 300000, rate: 10 }, { limit: 500000, rate: 15 }, { limit: 1000000, rate: 20 }],
    isRate: 35, cnpsEnabled: true,
    cnpsRates: { pensionEmployee: 3, pensionEmployer: 5, atmp: 1, familyAllowances: 3 },
    otherTaxes: [],
    socialOrgName: 'CNSS', fiscalYearEnd: '12-31', dsfDeadlineDays: 90, dsfFormCode: 'DSF-KM-01'
  },
  GW: {
    code: 'GW', name: 'Guinée-Bissau', vatRate: 0, isRate: 0, irppEnabled: false, irppBrackets: [],
    cnpsEnabled: false, otherTaxes: [], socialOrgName: 'À configurer', fiscalYearEnd: '12-31',
    dsfDeadlineDays: 0, dsfFormCode: 'À configurer', configurationStatus: 'needs_setup',
  },
  GQ: {
    code: 'GQ', name: 'Guinée équatoriale', vatRate: 0, isRate: 0, irppEnabled: false, irppBrackets: [],
    cnpsEnabled: false, otherTaxes: [], socialOrgName: 'À configurer', fiscalYearEnd: '12-31',
    dsfDeadlineDays: 0, dsfFormCode: 'À configurer', configurationStatus: 'needs_setup',
  },
};

const STEPS = [
  { id: 'select', label: 'Pays & Exercice', icon: Globe },
  { id: 'bilan', label: 'Tableau A - Bilan', icon: Building2 },
  { id: 'resultat', label: 'Tableau B - Resultat', icon: Receipt },
  { id: 'esg', label: 'Tableau C - ESG', icon: TrendingUp },
  { id: 'fiscal', label: 'Tableau D - Fiscalite', icon: Landmark },
  { id: 'annexes', label: 'Annexes', icon: FileText },
  { id: 'generate', label: 'Generation DSF', icon: CheckCircle },
];

export function DSFPage() {
  const { setCurrentPageTitle, showToast } = useUIStore();
  const { companyName } = useBrandingStore();
  const financialSettings = usePlatformFinancialSettings();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState<OhadaCountry>('CM');
  const [fiscalYear, setFiscalYear] = useState(2024);
  const [dsfForms, setDsfForms] = useState<DSFForm[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Form data states
  const [bilanData, setBilanData] = useState({
    immobilisations: 0, stocks: 0, creances: 0, tresorerie: 0,
    capitauxPropres: 0, dettesFinancieres: 0, dettesExploitation: 0, autresDettes: 0,
  });
  const [resultatData, setResultatData] = useState({
    chiffreAffaires: 0, productionVendue: 0, productionImmobilisee: 0,
    achatsConsommes: 0, chargesPersonnel: 0, dotationsAmortissements: 0,
    autresCharges: 0, produitsFinanciers: 0, chargesFinancieres: 0, resultatNet: 0,
  });
  const [fiscalData, setFiscalData] = useState({
    tvaCollectee: 0, tvaDeductible: 0, tvaNette: 0,
    irppRetenue: 0, isDu: 0, isPaye: 0, isReportable: 0,
    cotisationsSociales: 0, taxesDiverses: 0,
  });
  const [annexes, setAnnexes] = useState({
    effectifMoyen: 0, masseSalariale: 0, investissements: 0, exportations: 0, importations: 0,
  });

  useEffect(() => { setCurrentPageTitle('DSF OHADA - Declaration Statistique et Fiscale'); }, [setCurrentPageTitle]);

  useEffect(() => {
    if (COUNTRY_CONFIGS[financialSettings.countryCode as OhadaCountry]) {
      setSelectedCountry(financialSettings.countryCode as OhadaCountry);
    }
  }, [financialSettings.countryCode]);

  const baseCountryConfig = COUNTRY_CONFIGS[selectedCountry];
  const companyRuleRate = (taxType: string) => financialSettings.taxRules.find((rule) =>
    rule.isActive && rule.countryCode === selectedCountry && rule.taxType === taxType &&
    rule.effectiveFrom <= financialSettings.currentDate &&
    (!rule.effectiveTo || rule.effectiveTo >= financialSettings.currentDate),
  )?.rateBasisPoints;
  const countryConfig = {
    ...baseCountryConfig,
    vatRate: companyRuleRate('vat') === undefined ? baseCountryConfig.vatRate : companyRuleRate('vat')! / 100,
    isRate: companyRuleRate('corporate_income') === undefined ? baseCountryConfig.isRate : companyRuleRate('corporate_income')! / 100,
    cnpsRates: baseCountryConfig.cnpsRates ? {
      ...baseCountryConfig.cnpsRates,
      pensionEmployee: companyRuleRate('employee_social') === undefined ? baseCountryConfig.cnpsRates.pensionEmployee : companyRuleRate('employee_social')! / 100,
      pensionEmployer: companyRuleRate('employer_social') === undefined ? baseCountryConfig.cnpsRates.pensionEmployer : companyRuleRate('employer_social')! / 100,
    } : baseCountryConfig.cnpsRates,
  };
  const existingDSFs = getAll('dsfs') as DSFForm[];

  // Load accounting data for pre-fill
  const entries = getAll('accountingEntries');
  const employees = getAll('employees');
  const invoices = getAll('invoices');
  const payroll = getAll('payroll');

  const formatXAF = (a: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: financialSettings.currency, minimumFractionDigits: 0 }).format(a);

  // Auto-calculate from accounting entries when country changes
  useEffect(() => {
    const revenue = entries.filter((e: any) => e.accountCode.startsWith('7')).reduce((s: number, e: any) => s + e.credit - e.debit, 0);
    const expenses = entries.filter((e: any) => e.accountCode.startsWith('6')).reduce((s: number, e: any) => s + e.debit - e.credit, 0);
    const assets = entries.filter((e: any) => e.accountCode.startsWith('2') || e.accountCode.startsWith('3') || e.accountCode.startsWith('4') || e.accountCode.startsWith('5')).reduce((s: number, e: any) => s + e.debit - e.credit, 0);
    const liabilities = entries.filter((e: any) => e.accountCode.startsWith('1')).reduce((s: number, e: any) => s + e.credit - e.debit, 0);
    const tvaColl = entries.filter((e: any) => e.accountCode === '4451' || e.accountCode.startsWith('44571')).reduce((s: number, e: any) => s + e.credit - e.debit, 0);
    const tvaDed = entries.filter((e: any) => e.accountCode === '4452' || e.accountCode.startsWith('44566')).reduce((s: number, e: any) => s + e.debit - e.credit, 0);
    const salaries = entries.filter((e: any) => e.accountCode.startsWith('66')).reduce((s: number, e: any) => s + e.debit - e.credit, 0);
    const dotations = entries.filter((e: any) => e.accountCode.startsWith('681')).reduce((s: number, e: any) => s + e.debit - e.credit, 0);

    setBilanData(prev => ({
      ...prev,
      immobilisations: Math.max(0, assets * 0.4),
      creances: Math.max(0, assets * 0.3),
      tresorerie: Math.max(0, assets * 0.15),
      capitauxPropres: Math.max(0, liabilities * 0.35),
      dettesFinancieres: Math.max(0, liabilities * 0.25),
      dettesExploitation: Math.max(0, liabilities * 0.4),
    }));
    setResultatData(prev => ({
      ...prev,
      chiffreAffaires: Math.max(0, revenue),
      achatsConsommes: Math.max(0, expenses * 0.45),
      chargesPersonnel: Math.max(0, salaries),
      dotationsAmortissements: Math.max(0, dotations),
      autresCharges: Math.max(0, expenses * 0.2),
      resultatNet: Math.max(0, revenue - expenses),
    }));
    setFiscalData(prev => ({
      ...prev,
      tvaCollectee: Math.max(0, tvaColl),
      tvaDeductible: Math.max(0, tvaDed),
      tvaNette: Math.max(0, tvaColl - tvaDed),
      irppRetenue: Math.max(0, payroll.reduce((s: number, p: any) => s + (p.irpp || 0), 0)),
      cotisationsSociales: Math.max(0, payroll.reduce((s: number, p: any) => s + (p.cnpsEmployee || 0) + (p.cnpsEmployer || 0), 0)),
    }));
    setAnnexes(prev => ({
      ...prev,
      effectifMoyen: employees.length,
      masseSalariale: payroll.reduce((s: number, p: any) => s + (p.grossSalary || 0), 0),
    }));
  }, [selectedCountry, entries, employees, payroll]);

  // Calculate ESG from resultat
  const esgData = useMemo(() => {
    const ca = resultatData.chiffreAffaires + resultatData.productionVendue;
    const va = ca - resultatData.achatsConsommes;
    const ebe = va - resultatData.chargesPersonnel;
    const re = ebe - resultatData.dotationsAmortissements;
    const rf = resultatData.produitsFinanciers - resultatData.chargesFinancieres;
    const ro = re + rf;
    return { valeurAjoutee: va, excedentBrutExploitation: ebe, resultatExploitation: re, resultatFinancier: rf, resultatOrdinaire: ro, resultatExtraordinaire: 0, resultatNetComptable: resultatData.resultatNet };
  }, [resultatData]);

  const handleGenerateDSF = async () => {
    if (countryConfig.configurationStatus === 'needs_setup') {
      showToast(`Le profil fiscal de ${countryConfig.name} doit être configuré et validé avant de générer une DSF.`, 'error');
      return;
    }
    const periodStart = `${fiscalYear}-${String(financialSettings.fiscalYearStartMonth).padStart(2, '0')}-${String(financialSettings.fiscalYearStartDay).padStart(2, '0')}`;
    const periodEnd = new Date(Date.UTC(fiscalYear + 1, financialSettings.fiscalYearStartMonth - 1, financialSettings.fiscalYearStartDay) - 86_400_000).toISOString().slice(0, 10);
    const dsf: DSFForm = {
      id: `dsf-${Date.now()}`,
      companyId: 'comp-1',
      countryCode: selectedCountry,
      fiscalYear,
      periodStart,
      periodEnd,
      generatedAt: new Date().toISOString(),
      status: 'generated',
      tableauA: bilanData,
      tableauB: resultatData,
      tableauC: esgData,
      tableauD: fiscalData,
      ...annexes,
      generatedBy: 'user-1',
    };
    addAndNotify('dsfs', dsf);
    setDsfForms(prev => [...prev, dsf]);
    setCurrentStep(6);
    showToast(`DSF ${countryConfig.dsfFormCode} enregistrée. Préparation du PDF…`, 'success');
    await handleExportPDF(dsf);
  };

  const handleExportCSV = (dsf: DSFForm) => {
    const config = COUNTRY_CONFIGS[dsf.countryCode];
    let csv = `DECLARATION STATISTIQUE ET FISCALE - ${config.name.toUpperCase()}\n`;
    csv += `Exercice: ${dsf.fiscalYear} | Code: ${config.dsfFormCode}\n`;
    csv += `Entreprise: ${companyName}\n\n`;
    csv += 'TABLEAU A - ETAT DU BILAN\nPoste,Valeur (XAF)\n';
    if (dsf.tableauA) {
      csv += `Immobilisations,${dsf.tableauA.immobilisations}\n`;
      csv += `Stocks,${dsf.tableauA.stocks}\n`;
      csv += `Creances,${dsf.tableauA.creances}\n`;
      csv += `Tresorerie,${dsf.tableauA.tresorerie}\n`;
      csv += `TOTAL ACTIF,${dsf.tableauA.immobilisations + dsf.tableauA.stocks + dsf.tableauA.creances + dsf.tableauA.tresorerie}\n`;
      csv += `Capitaux propres,${dsf.tableauA.capitauxPropres}\n`;
      csv += `Dettes financieres,${dsf.tableauA.dettesFinancieres}\n`;
      csv += `Dettes exploitation,${dsf.tableauA.dettesExploitation}\n`;
      csv += `TOTAL PASSIF,${dsf.tableauA.capitauxPropres + dsf.tableauA.dettesFinancieres + dsf.tableauA.dettesExploitation + dsf.tableauA.autresDettes}\n`;
    }
    csv += '\nTABLEAU B - COMPTE DE RESULTAT\nPoste,Valeur (XAF)\n';
    if (dsf.tableauB) {
      csv += `Chiffre d'affaires,${dsf.tableauB.chiffreAffaires}\n`;
      csv += `Achats consommes,${dsf.tableauB.achatsConsommes}\n`;
      csv += `Charges personnel,${dsf.tableauB.chargesPersonnel}\n`;
      csv += `Dotations amort.,${dsf.tableauB.dotationsAmortissements}\n`;
      csv += `RESULTAT NET,${dsf.tableauB.resultatNet}\n`;
    }
    csv += '\nTABLEAU D - FISCALITE\nImpôt,Valeur (XAF)\n';
    if (dsf.tableauD) {
      csv += `TVA collectee,${dsf.tableauD.tvaCollectee}\n`;
      csv += `TVA deductible,${dsf.tableauD.tvaDeductible}\n`;
      csv += `TVA nette,${dsf.tableauD.tvaNette}\n`;
      csv += `IRPP retenue,${dsf.tableauD.irppRetenue}\n`;
      csv += `IS du,${dsf.tableauD.isDu}\n`;
      csv += `Cotisations sociales (${config.socialOrgName}),${dsf.tableauD.cotisationsSociales}\n`;
    }
    csv += `\nTVA: ${config.vatRate}% | IS: ${config.isRate}% | ${config.socialOrgName}: active\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DSF_${config.code}_${dsf.fiscalYear}_${companyName.replace(/\s/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('DSF exportee en CSV', 'success');
  };

  const handleExportPDF = async (dsf: DSFForm) => {
    const config = COUNTRY_CONFIGS[dsf.countryCode];
    if (!config) {
      showToast('Configuration du pays introuvable pour cette DSF.', 'error');
      return;
    }

    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
      await registerExposePdfFont(doc);
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const formatAmount = (value?: number) => `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value ?? 0)} FCFA`;
      const row = (label: string, value?: number): [string, string] => [label, formatAmount(value)];
      let currentY = 66;

      const addTable = (title: string, rows: [string, string][], total?: [string, string]) => {
        autoTable(doc, {
          startY: currentY,
          margin: { left: 14, right: 14, top: 41, bottom: 19 },
          head: [[title, 'Montant (FCFA)']],
          body: rows,
          foot: total ? [total] : undefined,
          theme: 'striped',
          styles: { font: 'Expose', fontSize: 8, cellPadding: 2.5, textColor: [34, 49, 61], lineColor: [225, 232, 237], lineWidth: 0.15 },
          headStyles: { font: 'Expose', fillColor: [8, 28, 45], textColor: [255, 255, 255], fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [242, 248, 246] },
          footStyles: { font: 'Expose', fillColor: [31, 122, 99], textColor: [255, 255, 255], fontStyle: 'bold' },
          columnStyles: { 0: { cellWidth: 127 }, 1: { cellWidth: 55, halign: 'right' } },
        });
        currentY = (doc as any).lastAutoTable.finalY + 6;
      };

      const actif = dsf.tableauA;
      const totalActif = (actif?.immobilisations ?? 0) + (actif?.stocks ?? 0) + (actif?.creances ?? 0) + (actif?.tresorerie ?? 0);
      const totalPassif = (actif?.capitauxPropres ?? 0) + (actif?.dettesFinancieres ?? 0) + (actif?.dettesExploitation ?? 0) + (actif?.autresDettes ?? 0);
      addTable('TABLEAU A · ACTIF', [
        row('Immobilisations', actif?.immobilisations), row('Stocks', actif?.stocks),
        row('Créances', actif?.creances), row('Trésorerie', actif?.tresorerie),
      ], row('TOTAL ACTIF', totalActif));
      addTable('TABLEAU A · PASSIF', [
        row('Capitaux propres', actif?.capitauxPropres), row('Dettes financières', actif?.dettesFinancieres),
        row('Dettes d’exploitation', actif?.dettesExploitation), row('Autres dettes', actif?.autresDettes),
      ], row('TOTAL PASSIF', totalPassif));

      const resultat = dsf.tableauB;
      addTable('TABLEAU B · COMPTE DE RÉSULTAT', [
        row('Chiffre d’affaires', resultat?.chiffreAffaires), row('Production vendue', resultat?.productionVendue),
        row('Production immobilisée', resultat?.productionImmobilisee), row('Achats consommés', resultat?.achatsConsommes),
        row('Charges de personnel', resultat?.chargesPersonnel), row('Dotations aux amortissements', resultat?.dotationsAmortissements),
        row('Autres charges', resultat?.autresCharges), row('Produits financiers', resultat?.produitsFinanciers),
        row('Charges financières', resultat?.chargesFinancieres),
      ], row('RÉSULTAT NET', resultat?.resultatNet));

      const esg = dsf.tableauC;
      addTable('TABLEAU C · SOLDES DE GESTION', [
        row('Valeur ajoutée', esg?.valeurAjoutee), row('Excédent brut d’exploitation', esg?.excedentBrutExploitation),
        row('Résultat d’exploitation', esg?.resultatExploitation), row('Résultat financier', esg?.resultatFinancier),
        row('Résultat ordinaire', esg?.resultatOrdinaire), row('Résultat extraordinaire', esg?.resultatExtraordinaire),
        row('Résultat net comptable', esg?.resultatNetComptable),
      ]);

      const fiscal = dsf.tableauD;
      addTable(`TABLEAU D · FISCALITÉ (${config.name.toUpperCase()})`, [
        row('TVA collectée', fiscal?.tvaCollectee), row('TVA déductible', fiscal?.tvaDeductible),
        row('TVA nette', fiscal?.tvaNette), row('IRPP retenu', fiscal?.irppRetenue),
        row('Impôt sur les sociétés dû', fiscal?.isDu), row('Impôt sur les sociétés payé', fiscal?.isPaye),
        row('Crédit d’impôt reportable', fiscal?.isReportable), row(`Cotisations ${config.socialOrgName}`, fiscal?.cotisationsSociales),
        row('Taxes diverses', fiscal?.taxesDiverses),
      ]);

      addTable('ANNEXES · DONNÉES SOCIALES ET COMMERCIALES', [
        row('Effectif moyen', dsf.effectifMoyen), row('Masse salariale annuelle', dsf.masseSalariale),
        row('Investissements réalisés', dsf.investissements), row('Exportations', dsf.exportations),
        row('Importations', dsf.importations),
      ]);

      const pageCount = doc.getNumberOfPages();
      const generatedAt = new Date(dsf.generatedAt).toLocaleDateString('fr-FR');
      for (let page = 1; page <= pageCount; page += 1) {
        doc.setPage(page);
        doc.setFillColor(8, 28, 45);
        doc.rect(0, 0, pageWidth, 35, 'F');
        doc.setFillColor(31, 180, 114);
        doc.rect(14, 33, pageWidth - 28, 1.5, 'F');
        doc.setFont('Expose', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(166, 231, 203);
        doc.text(`${companyName.toUpperCase()}  ·  DOCUMENT FINANCIER`, 14, 10);
        doc.setFontSize(16);
        doc.setTextColor(255, 255, 255);
        doc.text('DÉCLARATION STATISTIQUE ET FISCALE', 14, 21);
        doc.setFont('Expose', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(218, 229, 236);
        doc.text(`${config.dsfFormCode}  ·  ${config.name}  ·  Exercice ${dsf.fiscalYear}`, 14, 29);
        doc.text(`Émise le ${generatedAt}`, pageWidth - 14, 29, { align: 'right' });

        if (page === 1) {
          doc.setFillColor(242, 248, 246);
          doc.roundedRect(14, 40, pageWidth - 28, 19, 2, 2, 'F');
          doc.setFont('Expose', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(100, 116, 128);
          doc.text('ENTREPRISE', 19, 47);
          doc.text('EXERCICE FISCAL', 83, 47);
          doc.text('PÉRIODE', 145, 47);
          doc.setFont('Expose', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(8, 28, 45);
          doc.text(companyName, 19, 54, { maxWidth: 58 });
          doc.text(String(dsf.fiscalYear), 83, 54);
          doc.text(`${dsf.periodStart} — ${dsf.periodEnd}`, 145, 54, { maxWidth: 48 });
        }

        doc.setDrawColor(221, 230, 235);
        doc.line(14, pageHeight - 13, pageWidth - 14, pageHeight - 13);
        doc.setFont('Expose', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 128);
        doc.text('IDIBAGES  ·  Document de gestion', 14, pageHeight - 7);
        doc.text(`Page ${page}/${pageCount}`, pageWidth - 14, pageHeight - 7, { align: 'right' });
      }

      const safeCompany = companyName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9-]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'entreprise';
      doc.save(`dsf-${config.code}-${dsf.fiscalYear}-${safeCompany}.pdf`);
      showToast('La DSF a été téléchargée en PDF.', 'success');
    } catch (error) {
      console.error('DSF PDF generation failed', error);
      showToast('La DSF est enregistrée, mais la création du PDF a échoué.', 'error');
    }
  };

  const StepIcon = STEPS[currentStep].icon;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">DSF OHADA</h2>
          <p className="text-xs text-[var(--text-muted)]">Declaration Statistique et Fiscale - Conformite SYSCOHADA</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowHistory(!showHistory)} className="btn-secondary h-9 text-xs gap-1">
            <FileText size={14} /> {showHistory ? 'Nouvelle DSF' : 'Historique'}
          </button>
        </div>
      </div>

      {/* History View */}
      <AnimatePresence>
        {showHistory && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
            <GlassCard>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Historique des DSF generees</h3>
                {existingDSFs.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)] text-center py-4">Aucune DSF generee. Creez votre premiere declaration.</p>
                ) : (
                  <div className="space-y-2">
                    {existingDSFs.map((dsf) => {
                      const cfg = COUNTRY_CONFIGS[dsf.countryCode];
                      return (
                        <div key={dsf.id} className="glass-card-compact p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center">
                              <Globe size={14} className="text-[var(--accent-primary)]" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-[var(--text-primary)]">{cfg.name} — Exercice {dsf.fiscalYear}</p>
                              <p className="text-[10px] text-[var(--text-muted)]">{cfg.dsfFormCode} | Generee le {new Date(dsf.generatedAt).toLocaleDateString('fr-FR')}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${dsf.status === 'submitted' ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]' : 'bg-[var(--accent-warning)]/10 text-[var(--accent-warning)]'}`}>
                              {dsf.status === 'submitted' ? 'Soumise' : 'Brouillon'}
                            </span>
                            <button onClick={() => void handleExportPDF(dsf)} className="p-1.5 rounded hover:bg-white/5 text-[var(--text-muted)]" title="Télécharger la DSF en PDF" aria-label={`Télécharger la DSF ${cfg.dsfFormCode} en PDF`}><Download size={13} /></button>
                            <button onClick={() => handleExportCSV(dsf)} className="p-1.5 rounded hover:bg-white/5 text-[var(--text-muted)]" title="Exporter CSV"><FileSpreadsheet size={12} /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {!showHistory && (
        <>
          {/* Step Progress */}
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {STEPS.map((step, i) => (
              <button
                key={step.id}
                onClick={() => setCurrentStep(i)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs whitespace-nowrap transition-colors ${
                  i === currentStep ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] font-medium' :
                  i < currentStep ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'
                }`}
              >
                {i < currentStep ? <CheckCircle size={12} /> : <step.icon size={12} />}
                {step.label}
                {i < STEPS.length - 1 && <ChevronRight size={10} className="ml-1 text-[var(--text-muted)]" />}
              </button>
            ))}
          </div>

          {/* Step 1: Country & Year Selection */}
          {currentStep === 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <GlassCard>
                <div className="p-6">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                    <Globe size={16} className="text-[var(--accent-primary)]" />
                    Selection du pays et de l exercice fiscal
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Pays OHADA</label>
                      <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value as OhadaCountry)} className="w-full h-10 px-3 glass-input text-sm">
                        {Object.values(COUNTRY_CONFIGS).map(c => (
                          <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Exercice fiscal</label>
                      <input type="number" value={fiscalYear} onChange={(e) => setFiscalYear(Number(e.target.value))} className="w-full h-10 px-3 glass-input text-sm" />
                    </div>
                  </div>

                  {/* Country Tax Summary */}
                  <div className="glass-card-compact p-4 bg-gradient-to-r from-[var(--accent-primary)]/5 to-[var(--accent-primary-hover)]/5">
                    <div role="note" className="mb-3 flex gap-2 rounded border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-5 text-amber-700 dark:text-amber-200">
                      <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                      <p>Vérifiez les taux, cotisations et échéances de ce pays et de cet exercice auprès des sources officielles ou de votre conseil local. La réglementation varie et peut changer ; ce récapitulatif ne vaut pas validation fiscale.</p>
                    </div>
                    <h4 className="text-xs font-semibold text-[var(--text-primary)] mb-3">Regime fiscal — {countryConfig.name}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-2 rounded bg-[var(--bg-elevated)]"><p className="text-[10px] text-[var(--text-muted)]">TVA</p><p className="text-sm font-bold text-[var(--text-primary)]">{countryConfig.vatRate}%</p></div>
                      <div className="p-2 rounded bg-[var(--bg-elevated)]"><p className="text-[10px] text-[var(--text-muted)]">IS</p><p className="text-sm font-bold text-[var(--text-primary)]">{countryConfig.isRate}%</p></div>
                      {countryConfig.isPMERate && <div className="p-2 rounded bg-[var(--bg-elevated)]"><p className="text-[10px] text-[var(--text-muted)]">IS PME</p><p className="text-sm font-bold text-[var(--accent-secondary)]">{countryConfig.isPMERate}%</p></div>}
                      <div className="p-2 rounded bg-[var(--bg-elevated)]"><p className="text-[10px] text-[var(--text-muted)]">Organisme social</p><p className="text-sm font-bold text-[var(--text-primary)]">{countryConfig.socialOrgName}</p></div>
                    </div>
                    <div className="mt-3 space-y-1">
                      {countryConfig.cnpsRates && (
                        <p className="text-[10px] text-[var(--text-muted)]">
                          Cotisations sociales: Pension salarie {countryConfig.cnpsRates.pensionEmployee}% | Pension patron {countryConfig.cnpsRates.pensionEmployer}% | AT/MP {countryConfig.cnpsRates.atmp}%
                        </p>
                      )}
                      {countryConfig.otherTaxes.length > 0 && (
                        <p className="text-[10px] text-[var(--text-muted)]">
                          Taxes annexes: {countryConfig.otherTaxes.map(t => `${t.name} (${t.rate}%)`).join(', ')}
                        </p>
                      )}
                      <p className="text-[10px] text-[var(--text-muted)]">
                        Echeance DSF: {countryConfig.dsfDeadlineDays} jours apres la cloture ({countryConfig.fiscalYearEnd})
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end mt-4">
                    <button onClick={() => setCurrentStep(1)} className="btn-primary h-10 px-6 gap-2">
                      Continuer <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Step 2: Bilan (Tableau A) */}
          {currentStep === 1 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <GlassCard>
                <div className="p-6">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                    <Building2 size={16} className="text-[var(--accent-primary)]" />
                    Tableau A — Etat du bilan au 31/12/{fiscalYear}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* ACTIF */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-[var(--accent-secondary)] uppercase tracking-wider">Actif</h4>
                      {[
                        { key: 'immobilisations', label: 'Immobilisations' },
                        { key: 'stocks', label: 'Stocks' },
                        { key: 'creances', label: 'Creances' },
                        { key: 'tresorerie', label: 'Tresorerie' },
                      ].map(field => (
                        <div key={field.key} className="flex items-center gap-3">
                          <label className="text-xs text-[var(--text-secondary)] w-32">{field.label}</label>
                          <input type="number" value={bilanData[field.key as keyof typeof bilanData]} onChange={(e) => setBilanData({ ...bilanData, [field.key]: Number(e.target.value) })} className="flex-1 h-9 px-3 glass-input text-sm" />
                        </div>
                      ))}
                      <div className="h-px bg-[var(--divider)] my-2" />
                      <div className="flex justify-between text-sm font-bold text-[var(--text-primary)]">
                        <span>TOTAL ACTIF</span>
                        <span>{formatXAF(bilanData.immobilisations + bilanData.stocks + bilanData.creances + bilanData.tresorerie)}</span>
                      </div>
                    </div>
                    {/* PASSIF */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-[var(--accent-purple)] uppercase tracking-wider">Passif</h4>
                      {[
                        { key: 'capitauxPropres', label: 'Capitaux propres' },
                        { key: 'dettesFinancieres', label: 'Dettes financieres' },
                        { key: 'dettesExploitation', label: 'Dettes exploitation' },
                        { key: 'autresDettes', label: 'Autres dettes' },
                      ].map(field => (
                        <div key={field.key} className="flex items-center gap-3">
                          <label className="text-xs text-[var(--text-secondary)] w-32">{field.label}</label>
                          <input type="number" value={bilanData[field.key as keyof typeof bilanData]} onChange={(e) => setBilanData({ ...bilanData, [field.key]: Number(e.target.value) })} className="flex-1 h-9 px-3 glass-input text-sm" />
                        </div>
                      ))}
                      <div className="h-px bg-[var(--divider)] my-2" />
                      <div className="flex justify-between text-sm font-bold text-[var(--text-primary)]">
                        <span>TOTAL PASSIF</span>
                        <span>{formatXAF(bilanData.capitauxPropres + bilanData.dettesFinancieres + bilanData.dettesExploitation + bilanData.autresDettes)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between mt-4">
                    <button onClick={() => setCurrentStep(0)} className="btn-ghost h-10 px-4">Retour</button>
                    <button onClick={() => setCurrentStep(2)} className="btn-primary h-10 px-6 gap-2">Continuer <ArrowRight size={14} /></button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Step 3: Compte de Resultat (Tableau B) */}
          {currentStep === 2 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <GlassCard>
                <div className="p-6">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                    <Receipt size={16} className="text-[var(--accent-primary)]" />
                    Tableau B — Compte de resultat exercice {fiscalYear}
                  </h3>
                  <div className="space-y-3 max-w-xl">
                    {[
                      { key: 'chiffreAffaires', label: 'Chiffre d\'affaires' },
                      { key: 'productionVendue', label: 'Production vendue' },
                      { key: 'productionImmobilisee', label: 'Production immobilisee' },
                      { key: 'achatsConsommes', label: 'Achats consommes' },
                      { key: 'chargesPersonnel', label: 'Charges de personnel' },
                      { key: 'dotationsAmortissements', label: 'Dotations aux amortissements' },
                      { key: 'autresCharges', label: 'Autres charges' },
                      { key: 'produitsFinanciers', label: 'Produits financiers' },
                      { key: 'chargesFinancieres', label: 'Charges financieres' },
                    ].map(field => (
                      <div key={field.key} className="flex items-center gap-3">
                        <label className="text-xs text-[var(--text-secondary)] w-40">{field.label}</label>
                        <input type="number" value={resultatData[field.key as keyof typeof resultatData]} onChange={(e) => setResultatData({ ...resultatData, [field.key]: Number(e.target.value) })} className="flex-1 h-9 px-3 glass-input text-sm" />
                      </div>
                    ))}
                    <div className="h-px bg-[var(--divider)] my-2" />
                    <div className="flex justify-between text-sm font-bold text-[var(--text-primary)] p-2 rounded-lg bg-[var(--bg-elevated)]">
                      <span>RESULTAT NET</span>
                      <span className={resultatData.resultatNet >= 0 ? 'text-[var(--accent-primary)]' : 'text-[var(--accent-danger)]'}>
                        {formatXAF(resultatData.resultatNet)}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between mt-4">
                    <button onClick={() => setCurrentStep(1)} className="btn-ghost h-10 px-4">Retour</button>
                    <button onClick={() => setCurrentStep(3)} className="btn-primary h-10 px-6 gap-2">Continuer <ArrowRight size={14} /></button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Step 4: ESG (Tableau C) */}
          {currentStep === 3 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <GlassCard>
                <div className="p-6">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                    <TrendingUp size={16} className="text-[var(--accent-primary)]" />
                    Tableau C — Etat des soldes de gestion (ESG)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: 'Chiffre d\'affaires + Production', value: resultatData.chiffreAffaires + resultatData.productionVendue },
                      { label: 'Valeur ajoutee', value: esgData.valeurAjoutee, highlight: true },
                      { label: 'Excedent brut d\'exploitation', value: esgData.excedentBrutExploitation, highlight: true },
                      { label: 'Resultat d\'exploitation', value: esgData.resultatExploitation, highlight: true },
                      { label: 'Resultat financier', value: esgData.resultatFinancier },
                      { label: 'Resultat ordinaire', value: esgData.resultatOrdinaire, highlight: true },
                      { label: 'Resultat extraordinaire', value: esgData.resultatExtraordinaire },
                      { label: 'RESULTAT NET COMPTABLE', value: esgData.resultatNetComptable, total: true },
                    ].map((item, i) => (
                      <div key={i} className={`flex justify-between p-3 rounded-lg ${item.total ? 'bg-[var(--accent-primary)]/10' : item.highlight ? 'bg-[var(--bg-elevated)]' : 'bg-transparent'}`}>
                        <span className={`text-xs ${item.total ? 'font-bold text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>{item.label}</span>
                        <span className={`text-sm font-medium ${item.total ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}>{formatXAF(item.value)}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] mt-3">Les valeurs sont calculees automatiquement a partir du compte de resultat.</p>
                  <div className="flex justify-between mt-4">
                    <button onClick={() => setCurrentStep(2)} className="btn-ghost h-10 px-4">Retour</button>
                    <button onClick={() => setCurrentStep(4)} className="btn-primary h-10 px-6 gap-2">Continuer <ArrowRight size={14} /></button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Step 5: Fiscalite (Tableau D) */}
          {currentStep === 4 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <GlassCard>
                <div className="p-6">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                    <Landmark size={16} className="text-[var(--accent-primary)]" />
                    Tableau D — Fiscalite specifique {countryConfig.name}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* TVA */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-[var(--accent-secondary)] uppercase">TVA ({countryConfig.vatRate}%)</h4>
                      {[
                        { key: 'tvaCollectee', label: 'TVA collectee' },
                        { key: 'tvaDeductible', label: 'TVA deductible' },
                      ].map(field => (
                        <div key={field.key} className="flex items-center gap-3">
                          <label className="text-xs text-[var(--text-secondary)] w-32">{field.label}</label>
                          <input type="number" value={fiscalData[field.key as keyof typeof fiscalData]} onChange={(e) => setFiscalData({ ...fiscalData, [field.key]: Number(e.target.value) })} className="flex-1 h-9 px-3 glass-input text-sm" />
                        </div>
                      ))}
                      <div className="flex justify-between text-sm font-bold text-[var(--text-primary)] p-2 rounded-lg bg-[var(--bg-elevated)]">
                        <span>TVA nette</span>
                        <span className={fiscalData.tvaNette >= 0 ? 'text-[var(--accent-primary)]' : 'text-[var(--accent-danger)]'}>{formatXAF(fiscalData.tvaNette)}</span>
                      </div>
                    </div>
                    {/* IRPP & IS */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-[var(--accent-purple)] uppercase">Impots directs</h4>
                      {[
                        { key: 'irppRetenue', label: `IRPP retenue` },
                        { key: 'isDu', label: `IS du (${countryConfig.isRate}%)` },
                        { key: 'isPaye', label: 'IS paye' },
                        { key: 'isReportable', label: 'IS reportable' },
                      ].map(field => (
                        <div key={field.key} className="flex items-center gap-3">
                          <label className="text-xs text-[var(--text-secondary)] w-32">{field.label}</label>
                          <input type="number" value={fiscalData[field.key as keyof typeof fiscalData]} onChange={(e) => setFiscalData({ ...fiscalData, [field.key]: Number(e.target.value) })} className="flex-1 h-9 px-3 glass-input text-sm" />
                        </div>
                      ))}
                    </div>
                    {/* Cotisations sociales */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-[var(--accent-warning)] uppercase">Cotisations sociales ({countryConfig.socialOrgName})</h4>
                      <div className="flex items-center gap-3">
                        <label className="text-xs text-[var(--text-secondary)] w-32">Total cotisations</label>
                        <input type="number" value={fiscalData.cotisationsSociales} onChange={(e) => setFiscalData({ ...fiscalData, cotisationsSociales: Number(e.target.value) })} className="flex-1 h-9 px-3 glass-input text-sm" />
                      </div>
                      {countryConfig.cnpsRates && (
                        <p className="text-[10px] text-[var(--text-muted)]">
                          Taux: Sal. {countryConfig.cnpsRates.pensionEmployee}% | Pat. {countryConfig.cnpsRates.pensionEmployer}% | AT {countryConfig.cnpsRates.atmp}%
                        </p>
                      )}
                    </div>
                    {/* Autres taxes */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase">Autres taxes</h4>
                      <div className="flex items-center gap-3">
                        <label className="text-xs text-[var(--text-secondary)] w-32">Taxes diverses</label>
                        <input type="number" value={fiscalData.taxesDiverses} onChange={(e) => setFiscalData({ ...fiscalData, taxesDiverses: Number(e.target.value) })} className="flex-1 h-9 px-3 glass-input text-sm" />
                      </div>
                      {countryConfig.otherTaxes.length > 0 && (
                        <div className="space-y-1">
                          {countryConfig.otherTaxes.map((tax, i) => (
                            <p key={i} className="text-[10px] text-[var(--text-muted)]">{tax.name}: {tax.rate}% (base: {tax.base})</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between mt-4">
                    <button onClick={() => setCurrentStep(3)} className="btn-ghost h-10 px-4">Retour</button>
                    <button onClick={() => setCurrentStep(5)} className="btn-primary h-10 px-6 gap-2">Continuer <ArrowRight size={14} /></button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Step 6: Annexes */}
          {currentStep === 5 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <GlassCard>
                <div className="p-6">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                    <FileText size={16} className="text-[var(--accent-primary)]" />
                    Informations annexes
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg">
                    {[
                      { key: 'effectifMoyen', label: 'Effectif moyen', icon: Users },
                      { key: 'masseSalariale', label: 'Masse salariale annuelle (XAF)', icon: Receipt },
                      { key: 'investissements', label: 'Investissements realises (XAF)', icon: TrendingUp },
                      { key: 'exportations', label: 'Exportations (XAF)', icon: Package },
                      { key: 'importations', label: 'Importations (XAF)', icon: Package },
                    ].map(field => (
                      <div key={field.key} className="flex items-center gap-3">
                        <field.icon size={14} className="text-[var(--text-muted)]" />
                        <label className="text-xs text-[var(--text-secondary)] w-40">{field.label}</label>
                        <input type="number" value={annexes[field.key as keyof typeof annexes]} onChange={(e) => setAnnexes({ ...annexes, [field.key]: Number(e.target.value) })} className="flex-1 h-9 px-3 glass-input text-sm" />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-4">
                    <button onClick={() => setCurrentStep(4)} className="btn-ghost h-10 px-4">Retour</button>
                    <button onClick={() => setCurrentStep(6)} className="btn-primary h-10 px-6 gap-2">Continuer <ArrowRight size={14} /></button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Step 7: Generation & Summary */}
          {currentStep === 6 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <GlassCard>
                <div className="p-6">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                    <CheckCircle size={16} className="text-[var(--accent-primary)]" />
                    Recapitulatif DSF — {countryConfig.name} {fiscalYear}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-3 rounded-lg bg-[var(--bg-elevated)] text-center">
                      <p className="text-[10px] text-[var(--text-muted)]">Total Actif</p>
                      <p className="text-sm font-bold text-[var(--text-primary)]">{formatXAF(bilanData.immobilisations + bilanData.stocks + bilanData.creances + bilanData.tresorerie)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-[var(--bg-elevated)] text-center">
                      <p className="text-[10px] text-[var(--text-muted)]">Resultat Net</p>
                      <p className="text-sm font-bold text-[var(--accent-primary)]">{formatXAF(resultatData.resultatNet)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-[var(--bg-elevated)] text-center">
                      <p className="text-[10px] text-[var(--text-muted)]">TVA Nette</p>
                      <p className="text-sm font-bold text-[var(--text-secondary)]">{formatXAF(fiscalData.tvaNette)}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-xs p-2 rounded bg-[var(--bg-elevated)]">
                      <span className="text-[var(--text-secondary)]">Valeur ajoutee</span>
                      <span className="text-[var(--text-primary)] font-medium">{formatXAF(esgData.valeurAjoutee)}</span>
                    </div>
                    <div className="flex justify-between text-xs p-2 rounded bg-[var(--bg-elevated)]">
                      <span className="text-[var(--text-secondary)]">IS estime ({countryConfig.isRate}%)</span>
                      <span className="text-[var(--text-primary)] font-medium">{formatXAF(Math.max(0, resultatData.resultatNet * countryConfig.isRate / 100))}</span>
                    </div>
                    <div className="flex justify-between text-xs p-2 rounded bg-[var(--bg-elevated)]">
                      <span className="text-[var(--text-secondary)]">Cotisations {countryConfig.socialOrgName}</span>
                      <span className="text-[var(--text-primary)] font-medium">{formatXAF(fiscalData.cotisationsSociales)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button onClick={() => void handleGenerateDSF()} className="btn-primary h-10 gap-2">
                      <Download size={14} /> Générer, sauvegarder et télécharger la DSF en PDF
                    </button>
                    <button onClick={() => setCurrentStep(0)} className="btn-ghost h-10">
                      Recommencer
                    </button>
                  </div>

                  <div className="mt-4 p-3 rounded-lg bg-[var(--accent-warning)]/5 border border-[var(--accent-warning)]/20">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle size={12} className="text-[var(--accent-warning)]" />
                      <span className="text-xs font-medium text-[var(--text-warning)]">Echeance de declaration</span>
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      La DSF doit etre deposee dans les {countryConfig.dsfDeadlineDays} jours suivant la cloture de l exercice 
                      (avant le {new Date(`${fiscalYear + 1}-03-31`).toLocaleDateString('fr-FR')}).
                      Formulaire: {countryConfig.dsfFormCode}
                    </p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
