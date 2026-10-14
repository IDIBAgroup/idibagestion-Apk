import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Download, Eye, Send, Trash2, X, FileText,
  Bell, Clock, CheckCircle, AlertTriangle, Calendar, Mail,
  ChevronRight, Play, Pause, Settings, Printer
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useUIStore } from '@/stores/uiStore';
import { getAll, addAndNotify, updateAndNotify } from '@/lib/db';
import { useEffect } from 'react';
import type { Invoice, InvoiceReminder } from '@/types';
import { formatPlatformCurrency, usePlatformFinancialSettings } from '@/hooks/usePlatformFinancialSettings';

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
  const { currency, taxRate } = usePlatformFinancialSettings();
  const { setCurrentPageTitle, showToast } = useUIStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'invoices' | 'reminders'>('invoices');
  const [showDrawer, setShowDrawer] = useState(false);
  const [invoiceRevision, setInvoiceRevision] = useState(0);
  const [invoiceClientName, setInvoiceClientName] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [invoiceDueDate, setInvoiceDueDate] = useState('');
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [invoiceLines, setInvoiceLines] = useState<InvoiceLineDraft[]>([createInvoiceLine()]);
  const [invoiceTaxEnabled, setInvoiceTaxEnabled] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderInvoice, setReminderInvoice] = useState<Invoice | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('after_due_7');
  const [reminderDate, setReminderDate] = useState('');
  const [autoReminders, setAutoReminders] = useState(true);
  const [showStampAndSignature, setShowStampAndSignature] = useState(true);
  const [editingDraft, setEditingDraft] = useState<Invoice | null>(null);

  useEffect(() => { setCurrentPageTitle('Facturation Client'); }, [setCurrentPageTitle]);

  const invoices = useMemo(() => {
    void invoiceRevision;
    return getAll('invoices') as Invoice[];
  }, [invoiceRevision]);
  const reminders = getAll('invoiceReminders') as InvoiceReminder[] || [];

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

  const invoiceSubtotal = invoiceLines.reduce((sum, line) => sum + Math.max(0, line.quantity) * Math.max(0, line.unitPrice), 0);
  const invoiceTaxTotal = invoiceTaxEnabled
    ? invoiceLines.reduce((sum, line) => sum + Math.round(Math.max(0, line.quantity) * Math.max(0, line.unitPrice) * taxRate / 100), 0)
    : 0;
  const invoiceGrandTotal = invoiceSubtotal + invoiceTaxTotal;

  const openNewInvoice = () => {
    setInvoiceClientName('');
    setInvoiceDate(new Date().toISOString().slice(0, 10));
    setInvoiceDueDate('');
    setInvoiceNotes('');
    setInvoiceTaxEnabled(true);
    setInvoiceLines([createInvoiceLine()]);
    setShowDrawer(true);
  };

  const updateInvoiceLine = (id: string, patch: Partial<InvoiceLineDraft>) => {
    setInvoiceLines((current) => current.map((line) => line.id === id ? { ...line, ...patch } : line));
  };

  const handleCreateInvoice = (status: Invoice['status']) => {
    const validLines = invoiceLines.filter((line) => line.description.trim() && line.quantity > 0 && line.unitPrice > 0);
    if (!invoiceClientName.trim() || validLines.length === 0) {
      showToast('Sélectionnez un client et renseignez au moins une ligne de facture.', 'warning');
      return;
    }

    const now = new Date().toISOString();
    const year = new Date(`${invoiceDate}T00:00:00`).getFullYear();
    let sequence = invoices.length + 1;
    let number = `FAC-${year}-${String(sequence).padStart(4, '0')}`;
    while (invoices.some((invoice) => invoice.number === number)) {
      sequence += 1;
      number = `FAC-${year}-${String(sequence).padStart(4, '0')}`;
    }
    const items = validLines.map((line) => {
      const amount = line.quantity * line.unitPrice;
      const tax = invoiceTaxEnabled ? Math.round(amount * taxRate / 100) : 0;
      return { description: line.description.trim(), quantity: line.quantity, unitPrice: line.unitPrice, tax, total: amount + tax };
    });
    const amount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const tax = items.reduce((sum, item) => sum + item.tax, 0);

    const invoice: Invoice = {
      id: `inv-${Date.now()}`,
      number,
      clientName: invoiceClientName.trim(),
      clientEmail: '',
      date: invoiceDate,
      dueDate: invoiceDueDate,
      amount,
      tax,
      total: amount + tax,
      status,
      companyId: 'comp-1',
      items,
      notes: invoiceNotes.trim() || undefined,
      createdAt: now,
    };

    addAndNotify('invoices', invoice);
    setInvoiceRevision((revision) => revision + 1);
    setShowDrawer(false);
    showToast(status === 'draft' ? 'Brouillon de facture enregistré.' : 'Facture émise avec succès.', 'success');
  };

  const statusCounts = {
    all: invoices.length,
    paid: invoices.filter(i => i.status === 'paid').length,
    pending: invoices.filter(i => i.status === 'pending').length,
    overdue: overdueInvoices.length,
    draft: invoices.filter(i => i.status === 'draft').length,
  };

  const handleScheduleReminder = () => {
    if (!reminderInvoice || !reminderDate) return;
    const template = REMINDER_TEMPLATES.find(t => t.key === selectedTemplate);
    const reminder: InvoiceReminder = {
      id: `rem-${Date.now()}`,
      invoiceId: reminderInvoice.id,
      invoiceNumber: reminderInvoice.number,
      clientName: reminderInvoice.clientName,
      reminderType: selectedTemplate as InvoiceReminder['reminderType'],
      reminderDate,
      status: 'scheduled',
      templateUsed: template?.label || '',
      notes: '',
      createdAt: new Date().toISOString(),
    };
    addAndNotify('invoiceReminders', reminder);
    setShowReminderModal(false);
    setReminderInvoice(null);
    showToast('Relance programmée', 'success');
  };

  const handleSendReminder = (reminder: InvoiceReminder) => {
    updateAndNotify('invoiceReminders', reminder.id, { status: 'sent', sentDate: new Date().toISOString() });
    showToast('Relance envoyée par email', 'success');
  };

  const generateAutoReminders = () => {
    let count = 0;
    overdueInvoices.forEach(inv => {
      const existing = reminders.filter(r => r.invoiceId === inv.id && r.status === 'scheduled');
      if (existing.length === 0) {
        const reminder: InvoiceReminder = {
          id: `rem-auto-${Date.now()}-${count}`,
          invoiceId: inv.id,
          invoiceNumber: inv.number,
          clientName: inv.clientName,
          reminderType: 'after_due_7',
          reminderDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'scheduled',
          templateUsed: '7 jours après',
          notes: 'Générée automatiquement',
          createdAt: new Date().toISOString(),
        };
        addAndNotify('invoiceReminders', reminder);
        count++;
      }
    });
    showToast(`${count} relances auto générées`, 'success');
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
            <button className="btn-secondary h-9">
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
                        {new Date(inv.date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">
                        {new Date(inv.dueDate).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-[var(--text-primary)] text-right">
                        {formatXAF(inv.total)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={inv.status} />
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
                            onClick={() => showToast('Facture envoyée par email', 'success')}
                            className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors"
                            title="Envoyer"
                          >
                            <Send size={14} />
                          </button>
                          {inv.status === 'overdue' && (
                            <button
                              onClick={() => { setReminderInvoice(inv); setShowReminderModal(true); }}
                              className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--accent-danger)] transition-colors"
                              title="Programmer relance"
                            >
                              <Bell size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => showToast('Téléchargement PDF...', 'info')}
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

      {activeTab === 'reminders' && (
        <>
          {/* Auto-reminder settings */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Settings size={14} className="text-[var(--text-muted)]" />
                <span className="text-sm text-[var(--text-secondary)]">Relances automatiques</span>
              </div>
              <button
                onClick={() => setAutoReminders(!autoReminders)}
                className={`relative w-10 h-5 rounded-full transition-colors ${autoReminders ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-elevated)]'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${autoReminders ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <button onClick={generateAutoReminders} className="btn-primary h-8 text-xs">
              <Play size={12} /> Générer relances pour factures en retard
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
                            <button
                              onClick={() => handleSendReminder(rem)}
                              className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors"
                              title="Envoyer maintenant"
                            >
                              <Send size={14} />
                            </button>
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
                    <select value={invoiceClientName} onChange={(event) => setInvoiceClientName(event.target.value)} className="w-full h-10 px-3 glass-input text-sm">
                      <option value="">Sélectionner un client</option>
                      <option>Société Générale Cameroun</option>
                      <option>MTN Cameroun</option>
                      <option>Ecobank Cameroun</option>
                      <option>Orange Cameroun</option>
                    </select>
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
                    <label className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                      <input type="checkbox" checked={invoiceTaxEnabled} onChange={(event) => setInvoiceTaxEnabled(event.target.checked)} className="mt-0.5 accent-[var(--accent-primary)]" />
                      <span>Appliquer la TVA ({taxRate} %)<span className="mt-0.5 block text-xs text-[var(--text-muted)]">Décochez cette option si votre entreprise ne collecte pas la TVA.</span></span>
                    </label>
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
                    <button onClick={() => handleCreateInvoice('draft')} className="flex-1 btn-secondary h-10 justify-center">Enregistrer</button>
                    <button onClick={() => handleCreateInvoice('pending')} className="flex-1 btn-primary h-10 justify-center">Émettre</button>
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
                        updateAndNotify('invoices', selectedInvoice.id, { status: 'pending' });
                        setSelectedInvoice({ ...selectedInvoice, status: 'pending' });
                        showToast('Facture brouillon validée et publiée !', 'success');
                      }}
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
                      <h2 className="text-xl font-bold text-blue-900 tracking-tight">IDIBA GROUP SARL</h2>
                      <p className="text-xs text-gray-600 font-medium mt-0.5">Services Technologiques & Conseils aux Entreprises</p>
                      <p className="text-xs text-gray-600">Douala & Yaoundé, Cameroun • Tél: +237 690 00 00 00</p>
                      <p className="text-[11px] text-gray-700 font-mono mt-1">
                        <strong>RCCM:</strong> RC/DLA/2019/M/0847 • <strong>NIU:</strong> M0123456789C
                      </p>
                      <p className="text-[11px] text-gray-700 font-mono">
                        <strong>Compte bancaire:</strong> UBA Cameroun • <strong>N° RIB:</strong> 10033 00001 12345678901 45
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="bg-green-700 text-white font-bold text-xs px-3 py-1 rounded inline-block tracking-wider uppercase">FACTURE OFFICIELLE</span>
                      <p className="text-xs text-gray-800 font-mono font-bold mt-2">N° {selectedInvoice.number}</p>
                      <p className="text-xs text-gray-600">Date d'émission: {new Date(selectedInvoice.date).toLocaleDateString('fr-FR')}</p>
                      <p className="text-xs text-gray-600">Date d'échéance: {new Date(selectedInvoice.dueDate).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>

                  {/* Client & Issuer Box */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Prestataire / Émetteur</span>
                      <p className="text-xs font-bold text-gray-900">IDIBA GROUP SARL</p>
                      <p className="text-xs text-gray-600">Direction Financière & Comptable</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-blue-900 block mb-1">Facturé à (Client)</span>
                      <p className="text-sm font-bold text-gray-900">{selectedInvoice.clientName}</p>
                      <p className="text-xs text-gray-600">{selectedInvoice.clientEmail}</p>
                      <div className="mt-1 pt-1 border-t border-gray-200 text-xs font-mono text-gray-700">
                        <p><strong>NIU Client:</strong> {selectedInvoice.clientNiu || 'M08191244901A'}</p>
                        <p><strong>RCCM Client:</strong> {selectedInvoice.clientRccm || 'RC/DLA/2019/B/1420'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Invoice Line Items */}
                  <table className="document-preview-table w-full text-xs border-collapse mt-4">
                    <thead>
                      <tr className="bg-gray-800 text-white text-[11px] uppercase tracking-wider">
                        <th className="text-left p-3 rounded-tl">Désignation des Prestations / Articles</th>
                        <th className="text-center p-3">Quantité</th>
                        <th className="text-right p-3">P.U. HT (FCFA)</th>
                        <th className="text-right p-3 rounded-tr">Montant Total HT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items.map((item, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white border-b border-gray-100' : 'bg-gray-50/50 border-b border-gray-100'}>
                          <td className="p-3 font-medium text-gray-800">{item.description}</td>
                          <td className="text-center p-3 font-mono">{item.quantity || 1}</td>
                          <td className="text-right p-3 font-mono">{formatXAF(item.unitPrice || item.total)}</td>
                          <td className="text-right p-3 font-mono font-bold text-gray-900">{formatXAF(item.total)}</td>
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
                          <span>IDIBA GROUP</span>
                          <span className="text-[5px] text-emerald-600">DOUALA-CM</span>
                          <span className="text-[6px] text-emerald-700 font-mono">VALIDÉ</span>
                        </div>
                        <p className="text-[8px] text-emerald-800 font-bold font-mono">Signé électroniquement le {new Date(selectedInvoice.date).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                  )}

                  {/* Footer Legal Notice */}
                  <div className="pt-8 border-t border-gray-300 text-center text-[10px] text-gray-500 space-y-1">
                    <p className="font-semibold text-gray-700">IDIBA GROUP SARL — S.A.R.L au capital de 10 000 000 FCFA</p>
                    <p>Mentions Légales: NIU M0123456789C • RCCM RC/DLA/2019/M/0847 • Régime Fiscal: Réel</p>
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
                      onChange={(e) => setSelectedTemplate(e.target.value)}
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
