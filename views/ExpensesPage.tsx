import { useState, useEffect, useId } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Receipt, CalendarDays, Tag, Wallet, Check, X, Camera, Paperclip, Eye, ScanLine } from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import SlideOver from '@/components/common/SlideOver';
import { ErrorNotice, FormFooter } from '@/components/common/FormParts';
import FloatedInput from '@/components/ui/FloatedInput';
import { useUIStore } from '@/stores/uiStore';
import { formatPlatformCurrency, usePlatformFinancialSettings } from '@/hooks/usePlatformFinancialSettings';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { trpc } from '@/providers/trpc';

export function ExpensesPage() {
  const { currency } = usePlatformFinancialSettings();
  const { companyId } = useActiveCompany();
  const { setCurrentPageTitle, showToast } = useUIStore();
  const utils = trpc.useUtils();
  const expensesQuery = trpc.expense.list.useQuery({ companyId: companyId ?? 0 }, { enabled: Boolean(companyId) });
  const capabilities = trpc.expense.capabilities.useQuery();
  const accessRole = trpc.company.accessRole.useQuery({ companyId: companyId ?? 0 }, { enabled: Boolean(companyId) });
  const canReview = ['owner', 'admin', 'manager', 'platform_admin'].includes(accessRole.data ?? '');
  const createExpense = trpc.expense.create.useMutation({
    onSuccess: async () => {
      await utils.expense.list.invalidate({ companyId: companyId ?? 0 });
      setNewExpense({ description: '', amount: '', category: 'Fournitures', date: new Date().toISOString().split('T')[0], notes: '' });
      setReceiptDataUrl(''); setReceiptName(''); setFormError(''); setShowForm(false);
      showToast('Dépense enregistrée', 'success');
    },
    onError: (error) => setFormError(error.message),
  });
  const decideExpenseMutation = trpc.expense.decide.useMutation({
    onSuccess: async (expense) => {
      await utils.expense.list.invalidate({ companyId: companyId ?? 0 });
      showToast(expense.status === 'approved' ? 'Note de frais approuvée.' : 'Note de frais rejetée.', 'success');
    },
    onError: (error) => showToast(error.message, 'error'),
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [newExpense, setNewExpense] = useState({ description: '', amount: '', category: 'Fournitures', date: new Date().toISOString().split('T')[0], notes: '' });
  const [formError, setFormError] = useState('');
  const [receiptDataUrl, setReceiptDataUrl] = useState('');
  const [receiptName, setReceiptName] = useState('');
  const [openingReceiptId, setOpeningReceiptId] = useState<number | null>(null);
  const [isPreparingReceipt, setIsPreparingReceipt] = useState(false);
  const formId = useId();

  useEffect(() => {
    setCurrentPageTitle('Notes de Frais');
  }, [setCurrentPageTitle]);

  const expenses = expensesQuery.data ?? [];

  const filtered = expenses.filter((e) => {
    const matchesSearch = e.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const decideExpense = (expenseId: number, status: 'approved' | 'rejected') => {
    if (!companyId) return;
    decideExpenseMutation.mutate({ companyId, expenseId, status });
  };

  const openReceipt = async (expenseId: number) => {
    if (!companyId) return;
    const popup = window.open('about:blank', '_blank');
    if (popup) popup.opener = null;
    setOpeningReceiptId(expenseId);
    try {
      const result = await utils.expense.receiptDownloadUrl.fetch({ companyId, expenseId });
      if (popup) popup.location.href = result.url;
      else window.location.assign(result.url);
    } catch (error) {
      popup?.close();
      showToast(error instanceof Error ? error.message : 'Impossible d’ouvrir le justificatif.', 'error');
    } finally {
      setOpeningReceiptId(null);
    }
  };

  const attachReceiptScan = async (file?: File) => {
    if (!file) return;
    if (!capabilities.data?.receiptUpload) { setFormError('Le stockage privé et l’analyse antivirus ne sont pas configurés. Le justificatif ne peut pas être téléversé pour le moment.'); return; }
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') { setFormError('Formats acceptés : photo JPEG/PNG ou PDF issu d’un scanner.'); return; }
    if (file.size > 20 * 1024 * 1024) { setFormError('La photo doit faire moins de 20 Mo.'); return; }
    setIsPreparingReceipt(true);
    setFormError('');
    try {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Impossible de préparer l’image du justificatif.');
      if (file.type === 'application/pdf') {
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
        pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).toString();
        const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
        if (pdf.numPages !== 1) { await pdf.destroy(); throw new Error('Pour une note de frais, importez un justificatif PDF d’une seule page. Les scans multipages peuvent être conservés dans le Studio documentaire.'); }
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.8 });
        const scale = Math.min(1, 1600 / Math.max(viewport.width, viewport.height));
        const targetViewport = page.getViewport({ scale: 1.8 * scale });
        canvas.width = Math.ceil(targetViewport.width); canvas.height = Math.ceil(targetViewport.height);
        await page.render({ canvasContext: context, viewport: targetViewport }).promise;
        page.cleanup(); await pdf.destroy();
      } else {
        const objectUrl = URL.createObjectURL(file);
        try {
          const image = new Image(); image.src = objectUrl; await image.decode();
          const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
          canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
        } finally { URL.revokeObjectURL(objectUrl); }
      }
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error('Compression de la photo impossible.')), 'image/jpeg', 0.78));
      if (blob.size > 1_500_000) throw new Error('La photo reste trop volumineuse après compression. Prenez un nouveau scan plus cadré.');
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Lecture du justificatif impossible.'));
        reader.readAsDataURL(blob);
      });
      setReceiptDataUrl(dataUrl);
      setReceiptName(file.name.replace(/\.[^.]+$/, '') + '.jpg');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Préparation du justificatif impossible.');
    } finally {
      setIsPreparingReceipt(false);
    }
  };

  const saveExpense = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newExpense.description.trim() || !newExpense.amount || Number(newExpense.amount) <= 0) {
      setFormError('Renseignez une description et un montant valide.');
      return;
    }
    if (!companyId) { setFormError('Sélectionnez une entreprise avant d’enregistrer une dépense.'); return; }
    const receiptBase64 = receiptDataUrl.split(',')[1];
    createExpense.mutate({
      companyId,
      description: newExpense.description.trim(),
      amount: Number(newExpense.amount),
      category: newExpense.category.trim() || 'Autre',
      incurredOn: newExpense.date,
      notes: newExpense.notes.trim() || undefined,
      receiptBase64: receiptBase64 || undefined,
      receiptName: receiptName || undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Notes de Frais</h2>
        <button onClick={() => { setNewExpense({ description: '', amount: '', category: 'Fournitures', date: new Date().toISOString().split('T')[0], notes: '' }); setReceiptDataUrl(''); setReceiptName(''); setFormError(''); setShowForm(true); }} className="btn-primary h-9"><Plus size={16} /> Nouvelle Dépense</button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full h-9 pl-9 pr-4 glass-input text-sm" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 px-3 glass-input text-sm">
          <option value="all">Tous</option><option value="pending">En attente</option><option value="approved">Approuvé</option><option value="rejected">Rejeté</option>
        </select>
      </div>

      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--divider)]">
                <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Description</th>
                <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Catégorie</th>
                <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Employé</th>
                <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Date</th>
                <th className="text-right text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Montant</th>
                <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Statut</th>
                <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Justificatif</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((exp, i) => (
                <motion.tr key={exp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-[var(--divider)] hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Receipt size={14} className="text-[var(--accent-primary)]" />
                      <span className="text-sm text-[var(--text-primary)]">{exp.description}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{exp.category}</td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{exp.employeeName}</td>
                  <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{new Date(`${exp.incurredOn}T00:00:00`).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-[var(--text-primary)]">{formatPlatformCurrency(exp.amount, exp.currencyCode)}</td>
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><StatusBadge status={exp.status} />{canReview && exp.status === 'pending' && <><button disabled={decideExpenseMutation.isPending} title="Approuver la dépense" onClick={() => decideExpense(exp.id, 'approved')} className="rounded border border-emerald-600/20 p-1.5 text-emerald-700 hover:bg-emerald-600/10 disabled:opacity-50"><Check size={13} /></button><button disabled={decideExpenseMutation.isPending} title="Rejeter la dépense" onClick={() => decideExpense(exp.id, 'rejected')} className="rounded border border-rose-600/20 p-1.5 text-rose-700 hover:bg-rose-600/10 disabled:opacity-50"><X size={13} /></button></>}</div></td>
                  <td className="px-4 py-3">{exp.receiptAvailable ? <button type="button" onClick={() => void openReceipt(exp.id)} disabled={openingReceiptId === exp.id} title={exp.receiptName || 'Voir le justificatif'} className="inline-flex items-center gap-1.5 text-xs text-[var(--accent-primary)] disabled:opacity-50"><Eye size={14} /> Voir</button> : <span className="text-xs text-[var(--text-muted)]">—</span>}</td>
                </motion.tr>
              ))}
              {!filtered.length && <tr><td colSpan={7} className="px-4 py-14 text-center text-sm text-[var(--text-muted)]">{expensesQuery.isLoading ? 'Chargement des notes de frais…' : expensesQuery.isError ? <button type="button" onClick={() => expensesQuery.refetch()} className="text-[var(--accent-primary)]">Impossible de charger les notes. Réessayer</button> : search || statusFilter !== 'all' ? 'Aucune note ne correspond aux filtres.' : 'Aucune note de frais enregistrée.'}</td></tr>}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <SlideOver open={showForm} onClose={() => setShowForm(false)} title="Nouvelle dépense" subtitle="Renseignez les informations de la note de frais." footer={<FormFooter form={formId} pending={createExpense.isPending || isPreparingReceipt} onClose={() => setShowForm(false)} label="Enregistrer" />}>
        <form id={formId} onSubmit={saveExpense} className="space-y-4">
          <ErrorNotice message={formError} />
          <FloatedInput id={`${formId}-description`} name="description" compact label="Description" leftIcon={<Receipt size={16} />} required value={newExpense.description} onChange={(value) => setNewExpense((current) => ({ ...current, description: value }))} />
          <FloatedInput id={`${formId}-amount`} name="amount" type="number" compact label={`Montant (${currency})`} leftIcon={<Wallet size={16} />} min={0.01} step={0.01} required value={newExpense.amount} onChange={(value) => setNewExpense((current) => ({ ...current, amount: value }))} />
          <FloatedInput id={`${formId}-category`} name="category" compact label="Catégorie" leftIcon={<Tag size={16} />} value={newExpense.category} onChange={(value) => setNewExpense((current) => ({ ...current, category: value }))} options={['Fournitures', 'Repas', 'Transport', 'Hébergement', 'Logiciel', 'Événementiel', 'Marketing'].map((category) => ({ value: category, label: category }))} />
          <FloatedInput id={`${formId}-date`} name="date" type="date" compact label="Date" leftIcon={<CalendarDays size={16} />} required value={newExpense.date} onChange={(value) => setNewExpense((current) => ({ ...current, date: value }))} />
          <div className="space-y-2"><div className="text-sm font-medium text-[var(--text-secondary)]">Justificatif de dépense <span className="text-xs font-normal text-[var(--text-muted)]">(facultatif)</span></div><div className="flex flex-wrap items-center gap-2"><label className="btn-secondary h-9 cursor-pointer"><Camera size={14} />{isPreparingReceipt ? 'Préparation…' : 'Scanner avec la caméra'}<input className="sr-only" type="file" accept="image/jpeg,image/png" capture="environment" disabled={isPreparingReceipt} onChange={(event) => { void attachReceiptScan(event.target.files?.[0]); event.target.value = ''; }} /></label><label className="btn-secondary h-9 cursor-pointer"><ScanLine size={14} />Importer un scan externe<input className="sr-only" type="file" accept="application/pdf,image/jpeg,image/png" disabled={isPreparingReceipt} onChange={(event) => { void attachReceiptScan(event.target.files?.[0]); event.target.value = ''; }} /></label><label className="btn-secondary h-9 cursor-pointer"><Paperclip size={14} />Choisir une photo<input className="sr-only" type="file" accept="image/jpeg,image/png" disabled={isPreparingReceipt} onChange={(event) => { void attachReceiptScan(event.target.files?.[0]); event.target.value = ''; }} /></label>{receiptDataUrl && <button type="button" onClick={() => { setReceiptDataUrl(''); setReceiptName(''); }} className="btn-ghost h-9 text-xs"><X size={13} /> Retirer</button>}</div>{receiptDataUrl && <div className="flex items-center gap-3 rounded border border-[var(--glass-border)] p-2"><img src={receiptDataUrl} alt="Aperçu du justificatif" className="h-16 w-16 rounded object-cover" /><span className="truncate text-xs text-[var(--text-secondary)]">{receiptName}</span></div>}<p className="text-[11px] text-[var(--text-muted)]">Photo ou PDF d’une page compressé avant enregistrement. Les scans multipages restent dans le Studio documentaire.</p></div>
          <label className="block text-sm font-medium text-[var(--text-secondary)]">Notes<textarea value={newExpense.notes} onChange={(event) => setNewExpense((current) => ({ ...current, notes: event.target.value }))} rows={4} className="mt-1.5 w-full resize-y rounded border border-[var(--glass-border)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)]" placeholder="Notes additionnelles…" /></label>
        </form>
      </SlideOver>
    </div>
  );
}
