import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Download, Eye, Send, Trash2, X, FileText,
  Bell, CheckCircle, AlertTriangle, Printer
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { useUIStore } from '@/stores/uiStore';
import { useEffect } from 'react';
import type { Invoice, InvoiceReminder } from '@/types';
import { formatPlatformCurrency, usePlatformFinancialSettings } from '@/hooks/usePlatformFinancialSettings';
import { getOhadaCountry } from '@/lib/ohada/countries';
import { trpc } from '@/providers/trpc';
import { useActiveCompany } from '@/hooks/useActiveCompany';

const REMINDER_TEMPLATES = [
  { key: 'before_due', label: 'Avant échéance', days: -3 },
  { key: 'on_due', label: 'Jour J', days: 0 },
  { key: 'after_due_7', label: '7 jours après', days: 7 },
  { key: 'after_due_15', label: '15 jours après', days: 15 },
  { key: 'after_due_30', label: '30 jours après', days: 30 },
  { key: 'final', label: 'Mise en demeure', days: 45 },
];

type InvoiceLineDraft = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

const createInvoiceLine = (): InvoiceLineDraft => ({
  id: `${Date.now()}-${Math.random()}`,
  description: '',
  quantity: 1,
  unitPrice: 0,
});

export function InvoicesPage() {
  const { currency, taxRate, taxConfigured, countryCode } = usePlatformFinancialSettings();
  const companyJurisdiction = getOhadaCountry(countryCode);
  const { setCurrentPageTitle, showToast } = useUIStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'invoices' | 'reminders'>('invoices');
  const [showDrawer, setShowDrawer] = useState(false);
  const [invoiceClientId, setInvoiceClientId] = useState('');
  const [invoiceClientName, setInvoiceClientName] = useState('');
  const [invoiceClientEmail, setInvoiceClientEmail] = useState('');
  const [invoiceClientNiu, setInvoiceClientNiu] = useState('');
  const [invoiceClientRccm, setInvoiceClientRccm] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [invoiceDueDate, setInvoiceDueDate] = useState('');
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [invoiceLines, setInvoiceLines] = useState<InvoiceLineDraft[]>([createInvoiceLine()]);
  const [invoiceTaxEnabled, setInvoiceTaxEnabled] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderInvoice, setReminderInvoice] = useState<Invoice | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('after_due_7');
  const [reminderDate, setReminderDate] = useState('');
  const [showStampAndSignature, setShowStampAndSignature] = useState(true);
  const { companyId, company } = useActiveCompany();
  const utils = trpc.useUtils();
  const invoiceQuery = trpc.salesDocument.list.useQuery({ companyId: companyId ?? 0 }, { enabled: Boolean(companyId) });
  const clientQuery = trpc.customer.listByCompany.useQuery({ companyId: companyId ?? 0 }, { enabled: Boolean(companyId) });
  const reminderQuery = trpc.invoiceReminder.list.useQuery({ companyId: companyId ?? 0 }, { enabled: Boolean(companyId) });
  const registeredClients = clientQuery.data ?? [];
  const invoiceMutation = trpc.salesDocument.save.useMutation({
    onSuccess: async (_invoice, variables) => {
      await utils.salesDocument.list.invalidate({ companyId: variables.companyId });
      setShowDrawer(false);
      setInvoiceClientId(''); setInvoiceClientName(''); setInvoiceClientEmail(''); setInvoiceClientNiu(''); setInvoiceClientRccm('');
      setInvoiceDate(new Date().toISOString().slice(0, 10)); setInvoiceDueDate(''); setInvoiceNotes('');
      setInvoiceLines([createInvoiceLine()]);
      showToast(variables.initialStatus === 'draft' ? 'Brouillon de facture enregistré.' : 'Facture émise avec succès.', 'success');
    },
    onError: (error) => showToast(error.message, 'error'),
  });
  const invoiceStatusMutation = trpc.salesDocument.setStatus.useMutation({
    onSuccess: async (_result, variables) => {
      await utils.salesDocument.list.invalidate({ companyId: variables.companyId });
      setSelectedInvoice((current) => current?.id === variables.id ? { ...current, status: variables.status as Invoice['status'] } : current);
      showToast('Statut de la facture mis à jour.', 'success');
    },
    onError: (error) => showToast(error.message, 'error'),
  });
  const scheduleReminderMutation = trpc.invoiceReminder.schedule.useMutation({
    onSuccess: async (_reminder, variables) => {
      await utils.invoiceReminder.list.invalidate({ companyId: variables.companyId });
      setShowReminderModal(false); setReminderInvoice(null); setReminderDate('');
      showToast('Relance programmée.', 'success');
    },
    onError: (error) => showToast(error.message, 'error'),
  });
  const generateRemindersMutation = trpc.invoiceReminder.generateForOverdue.useMutation({
    onSuccess: async ({ count }) => {
      if (companyId) await utils.invoiceReminder.list.invalidate({ companyId });
      showToast(`${count} relance(s) programmée(s) pour les factures en retard.`, 'success');
    },
    onError: (error) => showToast(error.message, 'error'),
  });
  const reminderStatusMutation = trpc.invoiceReminder.setStatus.useMutation({
    onSuccess: async (_result, variables) => {
      await utils.invoiceReminder.list.invalidate({ companyId: variables.companyId });
      showToast(variables.status === 'sent' ? 'Envoi confirmé et journalisé.' : 'État de la relance mis à jour.', 'success');
    },
    onError: (error) => showToast(error.message, 'error'),
  });

  useEffect(() => { setCurrentPageTitle('Facturation Client'); }, [setCurrentPageTitle]);

  const invoices = useMemo(() => (invoiceQuery.data ?? []).filter((document) => document.kind === 'invoice').map((document) => ({
    id: document.id, number: document.number, clientId: document.clientId, clientName: document.clientName, clientEmail: document.clientEmail ?? '',
    clientNiu: document.clientNiu, clientRccm: document.clientRccm, date: document.date, dueDate: document.dueDate ?? '',
    amount: document.amount, tax: document.tax, total: document.total, status: document.status as Invoice['status'],
    companyId: document.companyId, items: document.items, notes: document.notes, createdAt: document.createdAt,
  })) as Invoice[], [invoiceQuery.data]);
  const reminders = (reminderQuery.data ?? []) as InvoiceReminder[];

  const filtered = useMemo(() => {
    return invoices.filter(inv => {
      const matchesSearch = inv.number.toLowerCase().includes(search.toLowerCase()) ||
        inv.clientName.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, search, statusFilter]);

  const overdueInvoices = invoices.filter(i => i.status === 'overdue');

  const formatXAF = (amount: number) => formatPlatformCurrency(amount, currency);
  const formatDate = (value: string) => value ? new Intl.DateTimeFormat(companyJurisdiction?.locale ?? 'fr-FR').format(new Date(`${value}T00:00:00`)) : '—';

  const invoiceSubtotal = invoiceLines.reduce((sum, line) => sum + Math.round(Math.max(0, line.quantity) * Math.max(0, line.unitPrice)), 0);
  const invoiceTaxTotal = invoiceTaxEnabled
    ? invoiceLines.reduce((sum, line) => sum + Math.round(Math.round(Math.max(0, line.quantity) * Math.max(0, line.unitPrice)) * taxRate / 100), 0)
    : 0;
  const invoiceGrandTotal = invoiceSubtotal + invoiceTaxTotal;

  const openNewInvoice = () => {
    setInvoiceClientId('');
    setInvoiceClientName('');
    setInvoiceClientEmail(''); setInvoiceClientNiu(''); setInvoiceClientRccm('');
    setInvoiceDate(new Date().toISOString().slice(0, 10));
    setInvoiceDueDate('');
    setInvoiceNotes('');
    setInvoiceTaxEnabled(taxConfigured);
    setInvoiceLines([createInvoiceLine()]);
    setShowDrawer(true);
  };

  const updateInvoiceLine = (id: string, patch: Partial<InvoiceLineDraft>) => {
    setInvoiceLines((current) => current.map((line) => line.id === id ? { ...line, ...patch } : line));
  };

  const handleCreateInvoice = (status: Extract<Invoice['status'], 'draft' | 'pending'>) => {
    const validLines = invoiceLines.filter((line) => line.description.trim() && line.quantity > 0 && line.unitPrice > 0);
    if (!companyId || !invoiceClientName.trim() || validLines.length === 0) {
      showToast('Sélectionnez un client et renseignez au moins une ligne de facture.', 'warning');
      return;
    }

    const due = new Date(`${invoiceDate}T00:00:00.000Z`);
    due.setUTCDate(due.getUTCDate() + 30);
    invoiceMutation.mutate({
      companyId, kind: 'invoice', clientId: invoiceClientId || undefined,
      clientName: invoiceClientName.trim(), clientEmail: invoiceClientEmail.trim(),
      clientNiu: invoiceClientNiu.trim() || undefined, clientRccm: invoiceClientRccm.trim() || undefined,
      date: invoiceDate, dueDate: invoiceDueDate || due.toISOString().slice(0, 10), taxable: invoiceTaxEnabled,
      initialStatus: status, items: validLines.map((line) => ({ description: line.description.trim(), quantity: line.quantity, unitPrice: line.unitPrice })),
      notes: invoiceNotes.trim() || undefined,
    });
  };

  const statusCounts = {
    all: invoices.length,
    paid: invoices.filter(i => i.status === 'paid').length,
    pending: invoices.filter(i => i.status === 'pending').length,
    overdue: overdueInvoices.length,
    draft: invoices.filter(i => i.status === 'draft').length,
  };

  const exportInvoices = () => {
    const csvCell = (value: string | number) => {
      const text = String(value);
      const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
      return `"${safe.replaceAll('"', '""')}"`;
    };
    const rows = [
      ['Numéro', 'Client', 'E-mail', 'Date', 'Échéance', 'Montant HT', 'TVA', 'Total TTC', 'Devise', 'Statut'],
      ...filtered.map((invoice) => [invoice.number, invoice.clientName, invoice.clientEmail, invoice.date, invoice.dueDate, invoice.amount, invoice.tax, invoice.total, currency, invoice.status]),
    ];
    const blob = new Blob([`\uFEFF${rows.map((row) => row.map(csvCell).join(';')).join('\r\n')}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `factures-${new Date().toISOString().slice(0, 10)}.csv`; link.click();
    URL.revokeObjectURL(url);
  };

  const openInvoiceEmail = (invoice: Invoice) => {
    if (!invoice.clientEmail) { showToast('Ajoutez une adresse e-mail au client pour préparer l’envoi.', 'warning'); return; }
    const subject = encodeURIComponent(`Facture ${invoice.number}`);
    const body = encodeURIComponent(`Bonjour ${invoice.clientName},\n\nVeuillez trouver les informations relatives à la facture ${invoice.number}, d’un montant de ${formatXAF(invoice.total)}. Échéance : ${formatDate(invoice.dueDate)}.\n\nCordialement,\n${company?.name || ''}`);
    window.location.href = `mailto:${invoice.clientEmail}?subject=${subject}&body=${body}`;
  };

  const handleScheduleReminder = () => {
    if (!companyId || !reminderInvoice || !reminderDate) return;
    const template = REMINDER_TEMPLATES.find(t => t.key === selectedTemplate);
    scheduleReminderMutation.mutate({
      companyId, invoiceId: reminderInvoice.id, reminderType: selectedTemplate as InvoiceReminder['reminderType'],
      reminderDate, templateUsed: template?.label || selectedTemplate,
    });
  };

  const handleSendReminder = (reminder: InvoiceReminder) => {
    const invoice = invoices.find((item) => item.id === reminder.invoiceId);
    if (!invoice?.clientEmail) { showToast('Ajoutez une adresse e-mail au client pour préparer la relance.', 'warning'); return; }
    const subject = encodeURIComponent(`Relance · facture ${invoice.number}`);
    const body = encodeURIComponent(`Bonjour ${invoice.clientName},\n\nNous vous rappelons que la facture ${invoice.number} d’un montant de ${formatXAF(invoice.total)} reste à régler. Échéance : ${formatDate(invoice.dueDate)}.\n\nCordialement,\n${company?.name || ''}`);
    window.location.href = `mailto:${invoice.clientEmail}?subject=${subject}&body=${body}`;
    showToast('Brouillon ouvert dans votre messagerie. Marquez la relance comme envoyée après son envoi.', 'info');
  };

  const generateAutoReminders = () => {
    if (companyId) generateRemindersMutation.mutate({ companyId });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Facturation Client</h2>
          <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-elevated)] rounded-full px-2.5 py-1">
            {invoices.length} factures
          </span>
          {overdueInvoices.length > 0 && (
            <span className="text-xs text-white bg-[var(--accent-danger)] rounded-full px-2.5 py-1 flex items-center gap-1">
              <AlertTriangle size={10} /> {overdueInvoices.length} en retard
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openNewInvoice} className="btn-primary h-9">
            <Plus size={16} /> Nouvelle Facture
          </button>
        </div>
      </div>

      {invoiceQuery.isError && <div role="alert" className="flex items-center justify-between gap-3 rounded border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600"><span>Impossible de charger les factures.</span><button type="button" onClick={() => invoiceQuery.refetch()} className="underline">Réessayer</button></div>}

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--bg-elevated)] rounded-lg p-0.5 w-fit">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            activeTab === 'invoices' ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)]'
          }`}
        >
          <FileText size={14} /> Factures
        </button>
        <button
          onClick={() => setActiveTab('reminders')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            activeTab === 'reminders' ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)]'
          }`}
        >
          <Bell size={14} /> Relances {reminders.length > 0 && `(${reminders.length})`}
        </button>
      </div>

      {activeTab === 'invoices' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par n° ou client..."
                className="w-full h-9 pl-9 pr-4 glass-input text-sm"
              />
            </div>
            <label className="sr-only" htmlFor="invoice-status-filter">Filtrer les factures par statut</label>
            <select
              id="invoice-status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-9 min-w-[190px] px-3 glass-input text-sm"
            >
              <option value="all">Tous ({statusCounts.all})</option>
              <option value="paid">Payées ({statusCounts.paid})</option>
              <option value="pending">En attente ({statusCounts.pending})</option>
              <option value="overdue">En retard ({statusCounts.overdue})</option>
              <option value="draft">Brouillons ({statusCounts.draft})</option>
            </select>
            <button onClick={exportInvoices} className="btn-secondary h-9">
              <Download size={14} /> Export
            </button>
          </div>

          {/* Overdue Alert */}
          {overdueInvoices.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card-compact p-3 border-l-2 border-[var(--accent-danger)] flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle size={18} className="text-[var(--accent-danger)]" />
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{overdueInvoices.length} facture(s) en retard</p>
                  <p className="text-xs text-[var(--text-muted)]">Total impayé: {formatXAF(overdueInvoices.reduce((s, i) => s + i.total, 0))}</p>
                </div>
              </div>
              <button
                onClick={generateAutoReminders}
                disabled={generateRemindersMutation.isPending}
                className="btn-primary h-8 text-xs"
              >
                <Bell size={12} /> Générer relances auto
              </button>
            </motion.div>
          )}

          {/* Table */}
          <GlassCard>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--divider)]">
                    <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">N° Facture</th>
                    <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Client</th>
                    <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Date</th>
                    <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Échéance</th>
                    <th className="text-right text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Montant TTC</th>
                    <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Statut</th>
                    <th className="text-right text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inv, i) => (
                    <motion.tr
                      key={inv.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-[var(--divider)] hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-[var(--accent-primary)]" />
                          <span className="text-sm font-medium text-[var(--text-primary)]">{inv.number}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-[var(--text-primary)]">{inv.clientName}</p>
                        <p className="text-[11px] text-[var(--text-muted)]">{inv.clientEmail}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">
                        {formatDate(inv.date)}
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">
                        {formatDate(inv.dueDate)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-[var(--text-primary)] text-right">
                        {formatXAF(inv.total)}
                      </td>
                      <td className="px-4 py-3">
                        <select value={inv.status} disabled={invoiceStatusMutation.isPending} onChange={(event) => companyId && invoiceStatusMutation.mutate({ companyId, id: inv.id, kind: 'invoice', status: event.target.value })} className="rounded border border-[var(--divider)] bg-[var(--bg-elevated)] px-2 py-1 text-xs text-[var(--text-primary)]">
                          {[inv.status, ...(inv.status === 'draft' ? ['pending', 'cancelled'] : inv.status === 'pending' ? ['paid', 'overdue', 'cancelled'] : inv.status === 'overdue' ? ['paid', 'cancelled'] : [])].map((status) => <option key={status} value={status}>{status === 'pending' ? 'En attente' : status === 'paid' ? 'Payée' : status === 'overdue' ? 'En retard' : status === 'cancelled' ? 'Annulée' : 'Brouillon'}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                            title="Voir"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => openInvoiceEmail(inv)}
                            className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors"
                            title="Envoyer"
                          >
                            <Send size={14} />
                          </button>
                          {inv.status === 'overdue' && (
                            <button
                              onClick={() => {
                                setReminderInvoice(inv); setSelectedTemplate('after_due_7');
                                const date = new Date(`${inv.dueDate}T00:00:00.000Z`); date.setUTCDate(date.getUTCDate() + 7);
                                setReminderDate(date.toISOString().slice(0, 10)); setShowReminderModal(true);
                              }}
                              className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--accent-danger)] transition-colors"
                              title="Programmer relance"
                            >
                              <Bell size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--accent-secondary)] transition-colors"
                            title="PDF"
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </>
      )}

      {reminderQuery.isError && <div role="alert" className="flex items-center justify-between gap-3 rounded border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600"><span>Impossible de charger les relances.</span><button type="button" onClick={() => reminderQuery.refetch()} className="underline">Réessayer</button></div>}

      {activeTab === 'reminders' && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--text-secondary)]">Les relances sont enregistrées par entreprise et restent programmées jusqu’à leur envoi confirmé.</p>
            <button onClick={generateAutoReminders} disabled={generateRemindersMutation.isPending} className="btn-primary h-8 text-xs disabled:opacity-50">
              <Bell size={12} /> Programmer les relances des retards
            </button>
          </div>

          {/* Reminders Table */}
          <GlassCard>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--divider)]">
                    <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Facture</th>
                    <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Client</th>
                    <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Type</th>
                    <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Date prévue</th>
                    <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Statut</th>
                    <th className="text-right text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reminders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                        Aucune relance programmée
                      </td>
                    </tr>
                  )}
                  {reminders.map((rem, i) => (
                    <motion.tr
                      key={rem.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-[var(--divider)] hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Bell size={14} className="text-[var(--accent-primary)]" />
                          <span className="text-sm font-medium text-[var(--text-primary)]">{rem.invoiceNumber}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--text-primary)]">{rem.clientName}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
                          {rem.templateUsed}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">
                        {new Date(rem.reminderDate).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          rem.status === 'sent' ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]' :
                          rem.status === 'scheduled' ? 'bg-[var(--accent-warning)]/10 text-[var(--accent-warning)]' :
                          'bg-[var(--accent-danger)]/10 text-[var(--accent-danger)]'
                        }`}>
                          {rem.status === 'sent' ? 'Envoyée' : rem.status === 'scheduled' ? 'Programmée' : 'Échec'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {rem.status === 'scheduled' && (
                            <>
                              <button type="button" onClick={() => handleSendReminder(rem)} className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors" title="Préparer l’e-mail de relance">
                                <Send size={14} />
                              </button>
                              <button type="button" disabled={reminderStatusMutation.isPending || !companyId} onClick={() => companyId && reminderStatusMutation.mutate({ companyId, id: rem.id, status: 'sent' })} className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors disabled:opacity-40" title="Confirmer l’envoi de la relance">
                                <CheckCircle size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </>
      )}

      {/* New Invoice Drawer */}
      <AnimatePresence>
        {showDrawer && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowDrawer(false)} />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-[var(--bg-card)] border-l border-[var(--glass-border)] z-50 overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Nouvelle Facture</h2>
                  <button onClick={() => setShowDrawer(false)} className="p-2 rounded-lg hover:bg-white/5">
                    <X size={18} className="text-[var(--text-muted)]" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Client</label>
                    <select value={invoiceClientId} onChange={(event) => {
                      const id = event.target.value;
                      const client = registeredClients.find((item) => String(item.id) === id);
                      setInvoiceClientId(id);
                      if (client) {
                        setInvoiceClientName(client.name); setInvoiceClientEmail(client.email ?? '');
                        setInvoiceClientNiu(client.niu ?? ''); setInvoiceClientRccm(client.rccm ?? '');
                      }
                    }} className="w-full h-10 px-3 glass-input text-sm">
                      <option value="">Sélectionner un client enregistré</option>
                      {registeredClients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                    </select>
                    <input value={invoiceClientName} onChange={(event) => { setInvoiceClientId(''); setInvoiceClientName(event.target.value); }} className="mt-2 w-full h-10 px-3 glass-input text-sm" placeholder="Nom du client" />
                    <input type="email" value={invoiceClientEmail} onChange={(event) => setInvoiceClientEmail(event.target.value)} className="mt-2 w-full h-10 px-3 glass-input text-sm" placeholder="E-mail du client" />
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <input value={invoiceClientNiu} onChange={(event) => setInvoiceClientNiu(event.target.value)} className="h-10 px-3 glass-input text-sm" placeholder={companyJurisdiction?.taxIdLabel ?? 'Identifiant fiscal'} />
                      <input value={invoiceClientRccm} onChange={(event) => setInvoiceClientRccm(event.target.value)} className="h-10 px-3 glass-input text-sm" placeholder={companyJurisdiction?.commercialRegisterLabel ?? 'Registre commercial'} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Date</label><input type="date" value={invoiceDate} onChange={(event) => setInvoiceDate(event.target.value)} className="w-full h-10 px-3 glass-input text-sm" /></div>
                    <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Échéance</label><input type="date" value={invoiceDueDate} onChange={(event) => setInvoiceDueDate(event.target.value)} className="w-full h-10 px-3 glass-input text-sm" /></div>
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Lignes de facture</label>
                    <div className="space-y-2">
                      {invoiceLines.map((line, index) => (
                        <div key={line.id} className="glass-card-compact p-3 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-[var(--text-muted)]">Ligne {index + 1}</span>
                            {invoiceLines.length > 1 && <button type="button" onClick={() => setInvoiceLines((current) => current.filter((item) => item.id !== line.id))} aria-label={`Supprimer la ligne ${index + 1}`} className="p-1 text-[var(--accent-danger)]"><Trash2 size={14} /></button>}
                          </div>
                          <input value={line.description} onChange={(event) => updateInvoiceLine(line.id, { description: event.target.value })} className="w-full h-9 px-2 glass-input text-sm" placeholder="Description" />
                          <div className="grid grid-cols-[1fr_1.3fr_1.3fr] gap-2">
                            <label className="text-[10px] text-[var(--text-muted)]">Quantité<input type="number" min="0.01" step="any" value={line.quantity} onChange={(event) => updateInvoiceLine(line.id, { quantity: Number(event.target.value) })} className="mt-1 h-9 w-full px-2 glass-input text-sm" /></label>
                            <label className="text-[10px] text-[var(--text-muted)]">Prix unitaire<input type="number" min="0" step="1" value={line.unitPrice} onChange={(event) => updateInvoiceLine(line.id, { unitPrice: Number(event.target.value) })} className="mt-1 h-9 w-full px-2 glass-input text-sm" /></label>
                            <div className="text-[10px] text-[var(--text-muted)]">Montant HT<div className="mt-1 flex h-9 items-center text-sm font-medium text-[var(--text-primary)]">{formatXAF(Math.max(0, line.quantity) * Math.max(0, line.unitPrice))}</div></div>
                          </div>
                        </div>
                      ))}
                      <button type="button" onClick={() => setInvoiceLines((current) => [...current, createInvoiceLine()])} className="w-full py-2 text-xs text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5 rounded-lg transition-colors">+ Ajouter une ligne</button>
                    </div>
                  </div>
                  <div className="glass-card-compact p-3 space-y-3">
                    {taxConfigured ? <label className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                      <input type="checkbox" checked={invoiceTaxEnabled} onChange={(event) => setInvoiceTaxEnabled(event.target.checked)} className="mt-0.5 accent-[var(--accent-primary)]" />
                      <span>Appliquer la TVA ({taxRate} %)<span className="mt-0.5 block text-xs text-[var(--text-muted)]">Décochez cette option si cette facture est exonérée ou non assujettie.</span></span>
                    </label> : <p className="text-xs leading-5 text-amber-800">Aucun taux de TVA actif n’est défini pour le pays de cette entreprise. Configurez une règle validée dans <a href="/settings" className="font-semibold underline">Paramètres de l’entreprise</a> avant d’émettre une facture taxable.</p>}
                    <div className="h-px bg-[var(--divider)]" />
                    <div className="flex justify-between text-sm"><span className="text-[var(--text-secondary)]">Sous-total HT</span><span className="text-[var(--text-primary)]">{formatXAF(invoiceSubtotal)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-[var(--text-secondary)]">{invoiceTaxEnabled ? `TVA (${taxRate} %)` : 'TVA non applicable'}</span><span className="text-[var(--text-primary)]">{formatXAF(invoiceTaxTotal)}</span></div>
                    <div className="h-px bg-[var(--divider)]" />
                    <div className="flex justify-between"><span className="font-semibold text-[var(--text-primary)]">Total à payer</span><span className="font-bold text-lg text-[var(--accent-primary)]">{formatXAF(invoiceGrandTotal)}</span></div>
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Notes</label>
                    <textarea value={invoiceNotes} onChange={(event) => setInvoiceNotes(event.target.value)} className="w-full h-20 p-3 glass-input text-sm resize-none" placeholder="Conditions de paiement, commentaires..." />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowDrawer(false)} className="flex-1 btn-ghost h-10 justify-center">Annuler</button>
                    <button disabled={invoiceMutation.isPending} onClick={() => handleCreateInvoice('draft')} className="flex-1 btn-secondary h-10 justify-center disabled:opacity-50">Enregistrer</button>
                    <button disabled={invoiceMutation.isPending} onClick={() => handleCreateInvoice('pending')} className="flex-1 btn-primary h-10 justify-center disabled:opacity-50">Émettre</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* View Invoice Modal (A4 Centered Preview) */}
      <AnimatePresence>
        {selectedInvoice && (
          <div className="a4-preview-overlay">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full flex flex-col items-center gap-4 my-auto">
              
              {/* Floating Action Controls */}
              <div className="no-print flex items-center justify-between w-full max-w-[210mm] glass-card px-4 py-2.5 shadow-xl border-white/20">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-white bg-green-600/30 border border-green-500/30 px-2.5 py-1 rounded-md">Facture A4 Conforme</span>
                  <label className="flex items-center gap-1.5 text-xs text-white cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showStampAndSignature}
                      onChange={e => setShowStampAndSignature(e.target.checked)}
                      className="accent-[var(--accent-primary)] cursor-pointer"
                    />
                    Cachet & Signature Numérique
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  {selectedInvoice.status === 'draft' && (
                    <button
                      onClick={() => {
                        if (companyId) invoiceStatusMutation.mutate({ companyId, id: selectedInvoice.id, kind: 'invoice', status: 'pending' });
                      }}
                      disabled={invoiceStatusMutation.isPending}
                      className="btn-primary h-8 px-3 text-xs gap-1 font-bold bg-amber-500 text-black hover:bg-amber-400"
                    >
                      Valider & Émettre
                    </button>
                  )}
                  <button onClick={() => window.print()} className="btn-primary h-8 px-3 text-xs gap-1.5 font-bold shadow-lg">
                    <Printer size={14} /> Imprimer / Télécharger PDF (A4)
                  </button>
                  <button onClick={() => setSelectedInvoice(null)} className="p-1.5 rounded-lg hover:bg-white/10 text-white">
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Printable A4 Document */}
              <div className="a4-sheet printable-document invoice-document shadow-2xl text-black">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex justify-between items-start border-b border-gray-300 pb-5">
                    <div>
                      <h2 className="text-xl font-bold text-blue-900 tracking-tight">{company?.name || 'Entreprise'}</h2>
                      <p className="text-xs text-gray-600 font-medium mt-0.5">{company?.address || ''}</p>
                      <p className="text-xs text-gray-600">{[company?.city, company?.country, company?.phone, company?.email].filter(Boolean).join(' · ')}</p>
                      <p className="text-[11px] text-gray-700 font-mono mt-1">
                        <strong>{companyJurisdiction?.commercialRegisterLabel ?? 'Registre commercial'}:</strong> {company?.rccm || '—'} • <strong>{companyJurisdiction?.taxIdLabel ?? 'Identifiant fiscal'}:</strong> {company?.niu || company?.taxId || '—'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="bg-green-700 text-white font-bold text-xs px-3 py-1 rounded inline-block tracking-wider uppercase">FACTURE OFFICIELLE</span>
                      <p className="text-xs text-gray-800 font-mono font-bold mt-2">N° {selectedInvoice.number}</p>
                      <p className="text-xs text-gray-600">Date d'émission: {formatDate(selectedInvoice.date)}</p>
                      <p className="text-xs text-gray-600">Date d'échéance: {formatDate(selectedInvoice.dueDate)}</p>
                    </div>
                  </div>

                  {/* Client & Issuer Box */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Prestataire / Émetteur</span>
                      <p className="text-xs font-bold text-gray-900">{company?.name || 'Entreprise'}</p>
                      <p className="text-xs text-gray-600">{[company?.address, company?.city, company?.country].filter(Boolean).join(' · ')}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-blue-900 block mb-1">Facturé à (Client)</span>
                      <p className="text-sm font-bold text-gray-900">{selectedInvoice.clientName}</p>
                      <p className="text-xs text-gray-600">{selectedInvoice.clientEmail}</p>
                      <div className="mt-1 pt-1 border-t border-gray-200 text-xs font-mono text-gray-700">
                        <p><strong>{companyJurisdiction?.taxIdLabel ?? 'Identifiant fiscal'} client:</strong> {selectedInvoice.clientNiu || '—'}</p>
                        <p><strong>{companyJurisdiction?.commercialRegisterLabel ?? 'Registre commercial'} client:</strong> {selectedInvoice.clientRccm || '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Invoice Line Items */}
                  <table className="document-preview-table w-full text-xs border-collapse mt-4">
                    <thead>
                      <tr className="bg-gray-800 text-white text-[11px] uppercase tracking-wider">
                        <th className="text-left p-3 rounded-tl">Désignation des Prestations / Articles</th>
                        <th className="text-center p-3">Quantité</th>
                        <th className="text-right p-3">P.U. HT ({currency})</th>
                        <th className="text-right p-3 rounded-tr">Montant Total HT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items.map((item, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white border-b border-gray-100' : 'bg-gray-50/50 border-b border-gray-100'}>
                          <td className="p-3 font-medium text-gray-800">{item.description}</td>
                          <td className="text-center p-3 font-mono">{item.quantity || 1}</td>
                          <td className="text-right p-3 font-mono">{formatXAF(item.unitPrice)}</td>
                          <td className="text-right p-3 font-mono font-bold text-gray-900">{formatXAF(Math.round(item.quantity * item.unitPrice))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Totals & Payment Instructions */}
                  <div className="grid grid-cols-12 gap-4 pt-4 border-t border-gray-200">
                    <div className="col-span-7 space-y-2">
                      <div className="p-3 bg-blue-50/60 rounded border border-blue-100 text-xs">
                        <p className="font-bold text-blue-900 mb-1">Règlement & Relevé Bancaire :</p>
                        <p className="text-gray-700 text-[11px]">Mode de règlement: Virement bancaire, Chèque certifié ou MTN/Orange Money.</p>
                        <p className="text-gray-700 text-[11px] font-mono mt-0.5">Virement MTN MoMo Pro: +237 690 00 00 00</p>
                      </div>
                      {selectedInvoice.notes && (
                        <p className="text-xs text-gray-600 italic">Note: {selectedInvoice.notes}</p>
                      )}
                    </div>
                    <div className="col-span-5">
                      <div className="space-y-1.5 text-xs bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between text-gray-700"><span>Montant HT :</span><span className="font-mono font-semibold">{formatXAF(selectedInvoice.amount)}</span></div>
                        <div className="flex justify-between text-gray-700"><span>{selectedInvoice.tax > 0 ? `TVA (${taxRate}%) :` : 'TVA non applicable :'}</span><span className="font-mono font-semibold">{formatXAF(selectedInvoice.tax)}</span></div>
                        <div className="flex justify-between font-bold text-sm text-green-700 pt-2 border-t border-gray-300"><span>NET À PAYER TTC :</span><span className="font-mono">{formatXAF(selectedInvoice.total)}</span></div>
                      </div>
                    </div>
                  </div>
                </div>

                  {/* Optional Digital Stamp and Signature Box */}
                  {showStampAndSignature && (
                    <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-dashed border-gray-300 text-xs">
                      <div className="p-3 rounded border border-gray-200 bg-gray-50/50 text-center flex flex-col justify-between h-28">
                        <p className="text-[10px] uppercase font-bold text-gray-500">Pour le Client (Bon pour accord & Acceptation)</p>
                        <p className="text-[10px] text-gray-400 italic">Nom, Signature & Date</p>
                      </div>

                      <div className="p-3 rounded border-2 border-emerald-600 bg-emerald-50/30 text-center relative overflow-hidden flex flex-col items-center justify-center h-28">
                        <div className="absolute right-1.5 top-1.5 text-[8px] bg-emerald-700 text-white font-mono px-1 rounded font-bold">QUALIFIÉ</div>
                        <p className="text-[9px] uppercase font-bold text-emerald-900">Cachet & Signature Électronique</p>
                        <div className="w-14 h-14 rounded-full border-2 border-dashed border-emerald-700 flex flex-col items-center justify-center my-0.5 bg-white text-[7px] font-bold text-emerald-800 shadow-sm leading-tight">
                          <span>{company?.name || 'Entreprise'}</span>
                          <span className="text-[5px] text-emerald-600">DOUALA-CM</span>
                          <span className="text-[6px] text-emerald-700 font-mono">VALIDÉ</span>
                        </div>
                        <p className="text-[8px] text-emerald-800 font-bold font-mono">Validation interne le {formatDate(selectedInvoice.date)}</p>
                      </div>
                    </div>
                  )}

                  {/* Footer Legal Notice */}
                  <div className="pt-8 border-t border-gray-300 text-center text-[10px] text-gray-500 space-y-1">
                    <p className="font-semibold text-gray-700">{company?.name || 'Entreprise'} · {company?.country || companyJurisdiction?.name || ''}</p>
                    <p>{companyJurisdiction?.taxIdLabel ?? 'Identifiant fiscal'}: {company?.niu || company?.taxId || '—'} · {companyJurisdiction?.commercialRegisterLabel ?? 'Registre commercial'}: {company?.rccm || '—'} · Monnaie: {currency}</p>
                    <p className="italic">Facture générée automatiquement par IDIBAGES ERP - Format A4 Conforme DGI/SYSCOHADA</p>
                  </div>
                </div>

              </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* Schedule Reminder Modal */}
      <AnimatePresence>
        {showReminderModal && reminderInvoice && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowReminderModal(false)} />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md border-l border-[var(--glass-border)] bg-[var(--bg-card)] z-50 overflow-y-auto shadow-2xl"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Programmer une relance</h2>
                  <button onClick={() => setShowReminderModal(false)} className="p-2 rounded-lg hover:bg-white/5"><X size={18} className="text-[var(--text-muted)]" /></button>
                </div>
                <div className="space-y-4">
                  <div className="glass-card-compact p-3">
                    <p className="text-xs text-[var(--text-muted)]">Facture</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{reminderInvoice.number}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{reminderInvoice.clientName} — {formatXAF(reminderInvoice.total)}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Type de relance</label>
                    <select
                      value={selectedTemplate}
                      onChange={(e) => {
                        setSelectedTemplate(e.target.value);
                        if (reminderInvoice) {
                          const template = REMINDER_TEMPLATES.find((item) => item.key === e.target.value);
                          const date = new Date(`${reminderInvoice.dueDate}T00:00:00.000Z`);
                          date.setUTCDate(date.getUTCDate() + (template?.days ?? 0));
                          setReminderDate(date.toISOString().slice(0, 10));
                        }
                      }}
                      className="w-full h-10 px-3 glass-input text-sm"
                    >
                      {REMINDER_TEMPLATES.map(t => (
                        <option key={t.key} value={t.key}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Date d'envoi</label>
                    <input
                      type="date"
                      value={reminderDate}
                      onChange={(e) => setReminderDate(e.target.value)}
                      className="w-full h-10 px-3 glass-input text-sm"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowReminderModal(false)} className="flex-1 btn-ghost h-10 justify-center">Annuler</button>
                    <button
                      onClick={handleScheduleReminder}
                      disabled={!reminderDate}
                      className="flex-1 btn-primary h-10 justify-center disabled:opacity-50"
                    >
                      Programmer
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
