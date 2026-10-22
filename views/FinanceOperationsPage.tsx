'use client';

import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Camera, Check, FileDown, FileUp, Landmark, Plus, RefreshCw, ScanLine, Trash2, Wallet } from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useUIStore } from '@/stores/uiStore';
import { addAndNotify, getAll, removeAndNotify, updateAndNotify } from '@/lib/db';
import type { AccountingEntry, BankTransaction, FinanceBudget } from '@/types';
import { usePlatformFinancialSettings, formatPlatformCurrency } from '@/hooks/usePlatformFinancialSettings';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { registerExposePdfFont } from '@/lib/pdf-font';
import { useBrandingStore } from '@/stores/brandingStore';

const companyId = 'comp-1';
const today = () => new Date().toISOString().slice(0, 10);

function parseCsvLine(line: string) {
  const values: string[] = [];
  let value = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"' && quoted) { value += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if ((char === ',' || char === ';') && !quoted) { values.push(value.trim()); value = ''; }
    else value += char;
  }
  values.push(value.trim());
  return values;
}

function normalizePdfDate(value: string) {
  const match = value.match(/\b(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})\b|\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (!match) return '';
  if (match[4]) return `${match[4]}-${match[5]}-${match[6]}`;
  const year = match[3].length === 2 ? `20${match[3]}` : match[3];
  return `${year}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
}

function parsePdfNumber(value: string) {
  const negative = /\(|-/.test(value);
  let normalized = value.replace(/[\s\u00a0]/g, '').replace(/[()]/g, '').replace(/[^\d,.]/g, '');
  if (!normalized || !/\d/.test(normalized)) return null;
  const comma = normalized.lastIndexOf(',');
  const dot = normalized.lastIndexOf('.');
  if (comma >= 0 && dot >= 0) normalized = comma > dot ? normalized.replace(/\./g, '').replace(',', '.') : normalized.replace(/,/g, '');
  else if (comma >= 0) normalized = /,\d{1,2}$/.test(normalized) ? normalized.replace(',', '.') : normalized.replace(/,/g, '');
  else if (dot >= 0 && /\.\d{3}$/.test(normalized)) normalized = normalized.replace('.', '');
  const result = Number(normalized);
  return Number.isFinite(result) ? (negative ? -Math.abs(result) : result) : null;
}

function extractOcrTransactions(text: string, options: { includeReference: boolean; accountName: string }): BankTransaction[] {
  const datePattern = /\b(?:\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}|\d{4}-\d{2}-\d{2})\b/g;
  const amountPattern = /-?\(?\d[\d\s\u00a0.,]*\d?\)?/g;
  const debitWords = /\b(d[eé]bit|debit|withdrawal|payment|purchase|commission|fee|charge|cheque|check|retrait|pr[eé]l[eè]vement|paiement|achat|frais)\b/i;
  const referencePattern = /\b(?:r[eé]f(?:[eé]rence)?|reference|n[°o]|no)\s*[:#-]?\s*([a-z\d][a-z\d\-/]{2,})/i;
  const lines = text.split(/\r?\n/).map((line) => line.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const extracted: BankTransaction[] = [];

  lines.forEach((line) => {
    const bookingDate = normalizePdfDate(line);
    if (!bookingDate) return;
    const withoutDate = line.replace(datePattern, ' ');
    const candidates = [...withoutDate.matchAll(amountPattern)]
      .map((match) => ({ token: match[0], value: parsePdfNumber(match[0]) }))
      .filter((item) => item.value !== null && Math.abs(item.value) > 0);
    if (!candidates.length) return;

    const negative = candidates.find((candidate) => candidate.value! < 0);
    const selected = negative || candidates[candidates.length - 1];
    const direction = selected.value! < 0 || debitWords.test(line) ? 'debit' : 'credit';
    const referenceMatch = options.includeReference ? line.match(referencePattern) : null;
    const cleanedLabel = withoutDate
      .replace(amountPattern, ' ')
      .replace(referencePattern, ' ')
      .replace(/\b(d[eé]bit|cr[eé]dit|solde|montant|r[eé]f[eé]rence|reference)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!cleanedLabel) return;

    extracted.push({
      id: `bank-ocr-${Date.now()}-${extracted.length}`,
      accountName: options.accountName,
      bookingDate,
      label: cleanedLabel,
      ...(referenceMatch ? { reference: referenceMatch[1] } : {}),
      amount: Math.abs(selected.value!),
      direction,
      status: 'unmatched',
      companyId,
    });
  });

  return extracted;
}

export function BankingPage() {
  const { currency } = usePlatformFinancialSettings();
  const { setCurrentPageTitle, showToast } = useUIStore();
  const { companyName } = useBrandingStore();
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [entries, setEntries] = useState<AccountingEntry[]>([]);
  const [accountName, setAccountName] = useState('Compte bancaire principal');
  const [bookingDate, setBookingDate] = useState(today());
  const [label, setLabel] = useState('');
  const [reference, setReference] = useState('');
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState<'credit' | 'debit'>('debit');
  const [search, setSearch] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<Record<string, string>>({});
  const [pdfPreview, setPdfPreview] = useState<BankTransaction[]>([]);
  const [isReadingPdf, setIsReadingPdf] = useState(false);
  const externalScannerInput = useRef<HTMLInputElement>(null);
  const [pdfReadProgress, setPdfReadProgress] = useState('');
  const [ocrLanguage, setOcrLanguage] = useState<'fra' | 'eng' | 'spa'>('fra');
  const [includeOcrReference, setIncludeOcrReference] = useState(true);

  useEffect(() => {
    setCurrentPageTitle('Banque & rapprochement');
    setTransactions([...(getAll('bankTransactions') || []) as BankTransaction[]]);
    setEntries([...(getAll('accountingEntries') || []) as AccountingEntry[]]);
  }, [setCurrentPageTitle]);

  const money = (value: number) => formatPlatformCurrency(value, currency);
  const filtered = useMemo(() => transactions.filter((item) => `${item.label} ${item.reference || ''} ${item.accountName}`.toLocaleLowerCase().includes(search.toLocaleLowerCase())), [transactions, search]);
  const unmatched = transactions.filter((item) => item.status === 'unmatched');
  const bankBalance = transactions.reduce((total, item) => total + (item.direction === 'credit' ? item.amount : -item.amount), 0);
  const difference = unmatched.reduce((total, item) => total + item.amount, 0);

  const addTransaction = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const numericAmount = Number(amount);
    if (!label.trim() || !bookingDate || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      showToast('Renseignez un libellé, une date et un montant positif.', 'warning');
      return;
    }
    const transaction: BankTransaction = {
      id: `bank-${Date.now()}`, accountName: accountName.trim() || 'Compte bancaire principal', bookingDate,
      label: label.trim(), reference: reference.trim(), amount: numericAmount, direction, status: 'unmatched', companyId,
    };
    addAndNotify('bankTransactions', transaction);
    setTransactions((current) => [transaction, ...current]);
    setLabel(''); setReference(''); setAmount('');
    showToast('Opération bancaire ajoutée au rapprochement.', 'success');
  };

  const importCsv = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const rows = String(reader.result || '').split(/\r?\n/).filter(Boolean).map(parseCsvLine);
      const normalized = rows[0]?.map((value) => value.toLocaleLowerCase());
      const hasHeader = normalized?.some((value) => ['date', 'label', 'libelle', 'amount', 'montant'].includes(value));
      const data = hasHeader ? rows.slice(1) : rows;
      const imported: BankTransaction[] = data.flatMap((row, index) => {
        const [dateValue, labelValue, amountValue, referenceValue, accountValue] = row;
        const parsed = Number(String(amountValue || '').replace(/[\s\u00a0]/g, '').replace(',', '.'));
        const date = /^\d{4}-\d{2}-\d{2}$/.test(dateValue || '') ? dateValue : '';
        if (!date || !labelValue || !Number.isFinite(parsed) || parsed === 0) return [];
        return [{
          id: `bank-import-${Date.now()}-${index}`, accountName: accountValue || accountName,
          bookingDate: date, label: labelValue, reference: referenceValue || '', amount: Math.abs(parsed),
          direction: parsed >= 0 ? 'credit' as const : 'debit' as const, status: 'unmatched' as const, companyId,
        }];
      });
      imported.forEach((transaction) => addAndNotify('bankTransactions', transaction));
      setTransactions((current) => [...imported, ...current]);
      showToast(imported.length ? `${imported.length} opération(s) importée(s).` : 'Aucune ligne valide. Format attendu : date, libellé, montant, référence, compte.', imported.length ? 'success' : 'warning');
      event.target.value = '';
    };
    reader.onerror = () => showToast('Lecture du fichier impossible.', 'error');
    reader.readAsText(file);
  };

  const importPdf = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { showToast('Le relevé PDF doit faire moins de 20 Mo.', 'warning'); return; }
    setIsReadingPdf(true);
    setPdfReadProgress('Analyse du document…');
    let pdfToDestroy: { destroy: () => Promise<void> } | undefined;
    try {
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
      pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).toString();
      const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
      const pdf = await task.promise;
      pdfToDestroy = pdf;
      if (pdf.numPages > 50) { await task.destroy(); throw new Error('Le relevé dépasse la limite de 50 pages.'); }
      const rows: { y: number; x: number; text: string }[] = [];
      const headers: { direction: 'debit' | 'credit'; x: number }[] = [];
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        for (const item of content.items) {
          if (!('str' in item) || !item.str.trim()) continue;
          const x = item.transform[4];
          const y = item.transform[5];
          const lower = item.str.toLocaleLowerCase();
          if (/\b(d[eé]bit|debit)\b/.test(lower)) headers.push({ direction: 'debit', x });
          if (/\b(cr[eé]dit|credit)\b/.test(lower)) headers.push({ direction: 'credit', x });
          rows.push({ x, y: (pageNumber * 100000) + y, text: item.str.trim() });
        }
        page.cleanup();
      }
      const grouped = new Map<number, { x: number; text: string }[]>();
      rows.forEach((row) => {
        const y = Math.round(row.y / 3) * 3;
        const line = grouped.get(y) || [];
        line.push({ x: row.x, text: row.text });
        grouped.set(y, line);
      });
      const datePattern = /\b(?:\d{1,2}[/.\-]\d{1,2}[/.\-]\d{2,4}|\d{4}-\d{2}-\d{2})\b/g;
      const amountPattern = /-?\(?\d[\d\s\u00a0.,]*\d?\)?/g;
      const extracted: BankTransaction[] = [];
      for (const cells of grouped.values()) {
        cells.sort((a, b) => a.x - b.x);
        const fullText = cells.map((cell) => cell.text).join(' ').replace(/\s+/g, ' ').trim();
        const bookingDate = normalizePdfDate(fullText);
        if (!bookingDate) continue;
        const candidates = cells.flatMap((cell) => {
          const withoutDate = cell.text.replace(datePattern, ' ');
          return [...withoutDate.matchAll(amountPattern)].map((match) => ({ x: cell.x, token: match[0], value: parsePdfNumber(match[0]) })).filter((item) => item.value !== null && Math.abs(item.value) > 0);
        });
        if (!candidates.length) continue;
        const negative = candidates.find((candidate) => candidate.value! < 0);
        let chosen = negative || candidates[candidates.length - 1];
        let movement: 'credit' | 'debit' = chosen.value! < 0 ? 'debit' : 'credit';
        if (!negative && headers.length) {
          const nearestHeader = headers.reduce((best, header) => Math.abs(header.x - chosen.x) < Math.abs(best.x - chosen.x) ? header : best, headers[0]);
          movement = nearestHeader.direction;
          const byHeader = candidates.filter((candidate) => Math.abs(candidate.x - nearestHeader.x) <= Math.abs(candidate.x - chosen.x) + 1);
          if (byHeader.length) chosen = byHeader[byHeader.length - 1];
        }
        const labelFromCells = cells.filter((cell) => !cell.text.replace(datePattern, '').match(amountPattern)).map((cell) => cell.text).join(' ');
        const cleanedLabel = (labelFromCells || fullText.replace(datePattern, '').replace(amountPattern, ' ')).replace(/\b(d[eé]bit|debit|cr[eé]dit|credit|solde|montant)\b/gi, ' ').replace(/\s+/g, ' ').trim();
        if (!cleanedLabel) continue;
        extracted.push({ id: `bank-pdf-${Date.now()}-${extracted.length}`, accountName, bookingDate, label: cleanedLabel, amount: Math.abs(chosen.value!), direction: movement, status: 'unmatched', companyId });
      }
      if (!extracted.length) {
        if (pdf.numPages > 20) throw new Error('Le relevé scanné dépasse la limite OCR de 20 pages. Divisez-le en plusieurs fichiers puis relancez l’import.');
        setPdfReadProgress('Document scanné détecté · préparation de l’OCR…');
        const { createWorker } = await import('tesseract.js');
        let currentOcrPage = 1;
        const worker = await createWorker(ocrLanguage, undefined, {
          logger: (message: { status?: string; progress?: number }) => {
            if (message.status === 'recognizing text') {
              const percent = Math.round((message.progress || 0) * 100);
              setPdfReadProgress(`Reconnaissance OCR · page ${currentOcrPage} sur ${pdf.numPages} · ${percent}%`);
            }
          },
        });
        try {
          const ocrText: string[] = [];
          for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
            currentOcrPage = pageNumber;
            setPdfReadProgress(`Reconnaissance OCR · page ${pageNumber} sur ${pdf.numPages}…`);
            const page = await pdf.getPage(pageNumber);
            const viewport = page.getViewport({ scale: 2 });
            const canvas = document.createElement('canvas');
            canvas.width = Math.ceil(viewport.width);
            canvas.height = Math.ceil(viewport.height);
            const context = canvas.getContext('2d');
            if (!context) throw new Error('Impossible de préparer la page PDF pour l’OCR.');
            await page.render({ canvasContext: context, viewport }).promise;
            const result = await worker.recognize(canvas);
            ocrText.push(result.data.text);
            page.cleanup();
            canvas.width = 0;
            canvas.height = 0;
          }
          extracted.push(...extractOcrTransactions(ocrText.join('\n'), { includeReference: includeOcrReference, accountName }));
        } finally {
          await worker.terminate();
        }
      }
      if (!extracted.length) {
        showToast('L’OCR n’a pas trouvé de ligne exploitable. Vérifiez la qualité de l’image, la langue sélectionnée et les champs nécessaires, ou importez le relevé en CSV.', 'warning');
        return;
      }
      setPdfPreview(extracted);
      showToast(`${extracted.length} opération(s) détectée(s). Vérifiez le sens et les montants avant import.`, 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Lecture du relevé PDF impossible.', 'error');
    } finally {
      await pdfToDestroy?.destroy();
      setIsReadingPdf(false);
      setPdfReadProgress('');
    }
  };

  const scanBankStatement = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('Choisissez une photo de relevé au format image.', 'warning'); return; }
    if (file.size > 20 * 1024 * 1024) { showToast('La photo du relevé doit faire moins de 20 Mo.', 'warning'); return; }
    setIsReadingPdf(true);
    setPdfReadProgress('Préparation du scan…');
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker(ocrLanguage, undefined, {
        logger: (message: { status?: string; progress?: number }) => {
          if (message.status === 'recognizing text') setPdfReadProgress(`Lecture OCR du scan · ${Math.round((message.progress || 0) * 100)}%`);
        },
      });
      let extracted: BankTransaction[] = [];
      try {
        setPdfReadProgress('Lecture OCR du scan…');
        const result = await worker.recognize(file);
        extracted = extractOcrTransactions(result.data.text, { includeReference: includeOcrReference, accountName });
      } finally {
        await worker.terminate();
      }
      if (!extracted.length) {
        showToast('Aucune opération lisible sur cette photo. Cadrez le relevé à plat, avec un bon éclairage, puis réessayez.', 'warning');
        return;
      }
      setPdfPreview(extracted);
      showToast(`${extracted.length} opération(s) reconnue(s). Vérifiez le scan avant import.`, 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Le scan du relevé a échoué.', 'error');
    } finally {
      setIsReadingPdf(false);
      setPdfReadProgress('');
    }
  };

  const commitPdfImport = () => {
    if (pdfPreview.some((transaction) => !transaction.bookingDate || !transaction.label.trim() || !Number.isFinite(transaction.amount) || transaction.amount <= 0)) {
      showToast('Corrigez les dates, libellés et montants invalides avant de confirmer l’import.', 'warning');
      return;
    }
    pdfPreview.forEach((transaction) => addAndNotify('bankTransactions', transaction));
    setTransactions((current) => [...pdfPreview, ...current]);
    showToast(`${pdfPreview.length} opération(s) du PDF ajoutée(s) au rapprochement.`, 'success');
    setPdfPreview([]);
  };

  const exportReconciliationPdf = async () => {
    if (!transactions.length) { showToast('Aucune opération à exporter.', 'warning'); return; }
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
    await registerExposePdfFont(doc);
    doc.setFillColor(8, 28, 45);
    doc.rect(0, 0, 297, 29, 'F');
    doc.setFillColor(31, 180, 114);
    doc.rect(0, 29, 297, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('Expose', 'bold');
    doc.setFontSize(17);
    doc.text('ÉTAT DE RAPPROCHEMENT BANCAIRE', 14, 14);
    doc.setFont('Expose', 'normal');
    doc.setFontSize(9);
    doc.text(`${companyName} · Édité le ${new Date().toLocaleDateString('fr-FR')} · Devise ${currency}`, 14, 22);
    const matchedCount = transactions.filter((transaction) => transaction.status === 'matched').length;
    const unmatchedCount = transactions.filter((transaction) => transaction.status === 'unmatched').length;
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.text(`Opérations : ${transactions.length}   |   Rapprochées : ${matchedCount}   |   En écart : ${unmatchedCount}   |   Montant non rapproché : ${money(difference)}`, 14, 39);
    autoTable(doc, {
      startY: 45,
      head: [['Date', 'Compte', 'Libellé', 'Référence', 'Sens', 'Montant', 'Statut', 'Pièce comptable']],
      body: transactions.map((transaction) => [
        new Date(`${transaction.bookingDate}T00:00:00`).toLocaleDateString('fr-FR'), transaction.accountName, transaction.label,
        transaction.reference || '—', transaction.direction === 'credit' ? 'Crédit' : 'Débit', money(transaction.amount),
        transaction.status === 'matched' ? 'Rapprochée' : transaction.status === 'ignored' ? 'Ignorée' : 'À rapprocher',
        entries.find((entry) => entry.id === transaction.accountingEntryId)?.pieceNumber || '—',
      ]),
      styles: { font: 'Expose', fontSize: 8, cellPadding: 2.5, overflow: 'linebreak' },
      headStyles: { fillColor: [8, 28, 45], textColor: [255, 255, 255], fontSize: 8 },
      alternateRowStyles: { fillColor: [242, 247, 250] },
      columnStyles: { 0: { cellWidth: 22 }, 1: { cellWidth: 31 }, 3: { cellWidth: 24 }, 4: { cellWidth: 17 }, 5: { cellWidth: 27, halign: 'right' }, 6: { cellWidth: 28 }, 7: { cellWidth: 28 } },
      didDrawPage: () => {
        doc.setFontSize(8); doc.setTextColor(100, 116, 139);
        doc.text(`IDIBAGES · Page ${doc.getCurrentPageInfo().pageNumber}`, 282, 202, { align: 'right' });
      },
    });
    doc.save(`rapprochement-bancaire-${new Date().toISOString().slice(0, 10)}.pdf`);
    showToast('État de rapprochement téléchargé en PDF.', 'success');
  };

  const matchTransaction = (transaction: BankTransaction) => {
    const entryId = selectedEntry[transaction.id];
    const entry = entries.find((item) => item.id === entryId);
    if (!entry) { showToast('Choisissez une écriture comptable.', 'warning'); return; }
    const bankMovement = entry.accountCode.startsWith('52') || entry.accountCode.startsWith('521');
    const ledgerAmount = transaction.direction === 'credit' ? entry.debit : entry.credit;
    if (!bankMovement || Math.abs(ledgerAmount - transaction.amount) > 0.01) {
      showToast('Le compte doit être un compte bancaire (52…) et le montant doit correspondre au sens du mouvement.', 'warning');
      return;
    }
    updateAndNotify('bankTransactions', transaction.id, { status: 'matched', accountingEntryId: entry.id });
    setTransactions((current) => current.map((item) => item.id === transaction.id ? { ...item, status: 'matched', accountingEntryId: entry.id } : item));
    showToast('Opération rapprochée avec succès.', 'success');
  };

  const removeTransaction = (transaction: BankTransaction) => {
    removeAndNotify('bankTransactions', transaction.id);
    setTransactions((current) => current.filter((item) => item.id !== transaction.id));
  };

  const candidateEntries = (transaction: BankTransaction) => entries.filter((entry) => {
    const bankMovement = entry.accountCode.startsWith('52') || entry.accountCode.startsWith('521');
    const amountToMatch = transaction.direction === 'credit' ? entry.debit : entry.credit;
    return bankMovement && Math.abs(amountToMatch - transaction.amount) < 0.01;
  });

  return <div className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-3">
      <GlassCard className="p-4"><p className="text-xs text-[var(--text-muted)]">Solde net des opérations importées</p><p className="mt-1 text-xl font-semibold text-[var(--text-primary)]">{money(bankBalance)}</p></GlassCard>
      <GlassCard className="p-4"><p className="text-xs text-[var(--text-muted)]">Opérations à rapprocher</p><p className="mt-1 text-xl font-semibold text-[var(--text-primary)]">{unmatched.length}</p></GlassCard>
      <GlassCard className="p-4"><p className="text-xs text-[var(--text-muted)]">Montant non rapproché</p><p className="mt-1 text-xl font-semibold text-[var(--text-primary)]">{money(difference)}</p></GlassCard>
    </div>

    <GlassCard className="p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-sm font-semibold text-[var(--text-primary)]">Importer un relevé bancaire</h2><p className="text-xs text-[var(--text-muted)]">PDF, scan d’un périphérique externe, photo par caméra ou CSV. Les opérations sont vérifiées avant leur enregistrement.</p></div><div className="flex flex-wrap gap-2"><label className="btn-secondary h-9 cursor-pointer"><Camera size={15} /> Scanner le relevé<input className="sr-only" type="file" accept="image/jpeg,image/png" capture="environment" disabled={isReadingPdf} onChange={(event) => void scanBankStatement(event)} /></label><button type="button" onClick={() => externalScannerInput.current?.click()} disabled={isReadingPdf} className="btn-secondary h-9"><ScanLine size={15} /> Importer le scan externe</button><input ref={externalScannerInput} className="sr-only" type="file" accept="application/pdf,image/jpeg,image/png" disabled={isReadingPdf} onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; if (file.type === 'application/pdf') void importPdf(event); else void scanBankStatement(event); }} /><label className="btn-secondary h-9 cursor-pointer"><FileUp size={15} /> {isReadingPdf ? 'Lecture du PDF…' : 'Importer PDF'}<input className="sr-only" type="file" accept="application/pdf,.pdf" disabled={isReadingPdf} onChange={(event) => void importPdf(event)} /></label><label className="btn-secondary h-9 cursor-pointer"><FileUp size={15} /> Importer CSV<input className="sr-only" type="file" accept=".csv,text/csv" onChange={importCsv} /></label></div></div>
      <details className="mb-3 rounded-[4px] border border-[var(--divider)] px-3 py-2 text-xs text-[var(--text-secondary)]"><summary className="cursor-pointer font-medium">Utiliser un scanner ou une imprimante multifonction connectée</summary><p className="mt-2 leading-5">Lancez le logiciel du scanner sur cet ordinateur (par exemple Scanner Windows ou l’application du fabricant), numérisez le relevé en PDF ou en image, puis choisissez « Importer le scan externe » et sélectionnez le fichier enregistré. Les PDF multipages sont acceptés et l’OCR démarre si le PDF ne contient pas de texte.</p></details>
      <div className="mb-3 flex flex-wrap items-end gap-x-5 gap-y-3 rounded-[4px] border border-[var(--divider)] p-3">
        <label className="grid gap-1 text-xs text-[var(--text-secondary)]"><span>Langue du relevé scanné</span><select value={ocrLanguage} onChange={(event) => setOcrLanguage(event.target.value as 'fra' | 'eng' | 'spa')} className="glass-input h-8 min-w-40 px-2 text-xs"><option value="fra">Français</option><option value="eng">English</option><option value="spa">Español</option></select></label>
        <fieldset className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-secondary)]"><legend className="mb-1 text-[11px] text-[var(--text-muted)]">Informations nécessaires au rapprochement</legend>
          <label className="flex items-center gap-1.5"><input type="checkbox" checked disabled /> Date *</label>
          <label className="flex items-center gap-1.5"><input type="checkbox" checked disabled /> Libellé *</label>
          <label className="flex items-center gap-1.5"><input type="checkbox" checked disabled /> Montant et sens débit/crédit *</label>
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={includeOcrReference} onChange={(event) => setIncludeOcrReference(event.target.checked)} /> Référence (facultative)</label>
        </fieldset>
      </div>
      {isReadingPdf && <div className="mb-3 rounded-[4px] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-secondary)]" role="status" aria-live="polite">{pdfReadProgress || 'Lecture du relevé…'}</div>}
      <p className="mb-3 text-[11px] text-[var(--text-muted)]">Les champs marqués * sont indispensables pour créer une opération rapprochable. Le relevé est traité dans votre navigateur ; l’OCR peut télécharger le moteur et le modèle linguistique lors de sa première utilisation.</p>
      <form onSubmit={addTransaction} className="grid gap-2 md:grid-cols-6">
        <input aria-label="Compte bancaire" value={accountName} onChange={(event) => setAccountName(event.target.value)} className="glass-input h-9 px-3 text-sm md:col-span-2" placeholder="Compte bancaire" />
        <input aria-label="Date opération" type="date" value={bookingDate} onChange={(event) => setBookingDate(event.target.value)} className="glass-input h-9 px-3 text-sm" />
        <input aria-label="Libellé bancaire" value={label} onChange={(event) => setLabel(event.target.value)} className="glass-input h-9 px-3 text-sm md:col-span-2" placeholder="Libellé de l'opération" />
        <div className="flex gap-2"><select aria-label="Sens du mouvement" value={direction} onChange={(event) => setDirection(event.target.value as 'credit' | 'debit')} className="glass-input h-9 min-w-0 flex-1 px-2 text-sm"><option value="debit">Débit</option><option value="credit">Crédit</option></select><input aria-label="Montant" type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} className="glass-input h-9 w-28 px-3 text-sm" placeholder="Montant" /></div>
        <input aria-label="Référence" value={reference} onChange={(event) => setReference(event.target.value)} className="glass-input h-9 px-3 text-sm md:col-span-5" placeholder="Référence (facultative)" />
        <button className="btn-primary h-9"><Plus size={15} /> Ajouter</button>
      </form>
    </GlassCard>

    {pdfPreview.length > 0 && <GlassCard>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--divider)] p-4"><div><h2 className="text-sm font-semibold text-[var(--text-primary)]">Vérifier les opérations extraites</h2><p className="text-xs text-[var(--text-muted)]">Confirmez le sens du mouvement et le montant avant de les ajouter au rapprochement.</p></div><div className="flex gap-2"><button className="btn-ghost h-9" onClick={() => setPdfPreview([])}>Annuler</button><button className="btn-primary h-9" onClick={commitPdfImport}><Check size={14} /> Importer {pdfPreview.length} opération(s)</button></div></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[860px] text-left text-sm"><thead><tr className="border-b border-[var(--divider)] text-[10px] uppercase text-[var(--text-muted)]"><th className="px-4 py-3">Date</th><th className="px-4 py-3">Libellé détecté</th>{includeOcrReference && <th className="px-4 py-3">Référence</th>}<th className="px-4 py-3">Sens à confirmer</th><th className="px-4 py-3 text-right">Montant</th></tr></thead><tbody>{pdfPreview.map((item) => <tr key={item.id} className="border-b border-[var(--divider)] last:border-0"><td className="px-4 py-3 text-xs">{new Date(`${item.bookingDate}T00:00:00`).toLocaleDateString('fr-FR')}</td><td className="px-4 py-3">{item.label}</td>{includeOcrReference && <td className="px-4 py-3"><input aria-label={`Référence de ${item.label}`} value={item.reference || ''} onChange={(event) => setPdfPreview((current) => current.map((row) => row.id === item.id ? { ...row, reference: event.target.value } : row))} className="glass-input h-8 w-36 px-2 text-xs" placeholder="Facultative" /></td>}<td className="px-4 py-3"><select value={item.direction} onChange={(event) => setPdfPreview((current) => current.map((row) => row.id === item.id ? { ...row, direction: event.target.value as 'credit' | 'debit' } : row))} className="glass-input h-8 px-2 text-xs"><option value="debit">Débit</option><option value="credit">Crédit</option></select></td><td className="px-4 py-3 text-right"><input type="number" min="0.01" step="0.01" value={item.amount} onChange={(event) => setPdfPreview((current) => current.map((row) => row.id === item.id ? { ...row, amount: Number(event.target.value) } : row))} className="glass-input h-8 w-36 px-2 text-right text-xs" /></td></tr>)}</tbody></table></div>
    </GlassCard>}

    <GlassCard>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--divider)] p-4"><div className="flex items-center gap-2"><Landmark size={16} className="text-[var(--accent-primary)]" /><h2 className="text-sm font-semibold text-[var(--text-primary)]">Rapprochement bancaire</h2></div><div className="flex flex-wrap items-center gap-2"><input value={search} onChange={(event) => setSearch(event.target.value)} className="glass-input h-9 min-w-52 px-3 text-sm" placeholder="Rechercher une opération" /><button onClick={() => void exportReconciliationPdf()} className="btn-secondary h-9" disabled={!transactions.length}><FileDown size={14} /> Exporter PDF</button></div></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead><tr className="border-b border-[var(--divider)] text-[10px] uppercase text-[var(--text-muted)]"><th className="px-4 py-3">Date / compte</th><th className="px-4 py-3">Libellé</th><th className="px-4 py-3">Sens</th><th className="px-4 py-3 text-right">Montant</th><th className="px-4 py-3">Écriture comptable</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3" /></tr></thead><tbody>
        {filtered.map((transaction) => <tr key={transaction.id} className="border-b border-[var(--divider)] last:border-0"><td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{new Date(`${transaction.bookingDate}T00:00:00`).toLocaleDateString('fr-FR')}<span className="mt-1 block text-[10px] text-[var(--text-muted)]">{transaction.accountName}</span></td><td className="px-4 py-3 text-sm text-[var(--text-primary)]">{transaction.label}{transaction.reference && <span className="mt-1 block text-xs text-[var(--text-muted)]">Réf. {transaction.reference}</span>}</td><td className="px-4 py-3">{transaction.direction === 'credit' ? <span className="flex items-center gap-1 text-xs text-emerald-600"><ArrowDownLeft size={13} /> Crédit</span> : <span className="flex items-center gap-1 text-xs text-rose-600"><ArrowUpRight size={13} /> Débit</span>}</td><td className="px-4 py-3 text-right tabular-nums font-medium">{money(transaction.amount)}</td><td className="px-4 py-3">{transaction.status === 'matched' ? <span className="text-xs text-[var(--text-secondary)]">{entries.find((entry) => entry.id === transaction.accountingEntryId)?.pieceNumber || transaction.accountingEntryId}</span> : <div className="flex gap-2"><select aria-label={`Écriture de ${transaction.label}`} value={selectedEntry[transaction.id] || ''} onChange={(event) => setSelectedEntry((current) => ({ ...current, [transaction.id]: event.target.value }))} className="glass-input h-8 min-w-56 px-2 text-xs"><option value="">Sélectionner l'écriture…</option>{candidateEntries(transaction).map((entry) => <option key={entry.id} value={entry.id}>{entry.date} · {entry.pieceNumber} · {entry.label}</option>)}</select><button type="button" className="btn-secondary h-8 text-xs" onClick={() => matchTransaction(transaction)}><RefreshCw size={12} /> Rapprocher</button></div>}</td><td className="px-4 py-3"><StatusBadge status={transaction.status === 'matched' ? 'approved' : transaction.status === 'ignored' ? 'rejected' : 'pending'} /></td><td className="px-4 py-3">{transaction.status === 'unmatched' && <button title="Supprimer l'opération" onClick={() => removeTransaction(transaction)} className="p-1.5 text-[var(--text-muted)] hover:text-rose-600"><Trash2 size={14} /></button>}{transaction.status === 'matched' && <Check size={15} className="text-emerald-600" />}</td></tr>)}
        {!filtered.length && <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-[var(--text-muted)]">Aucune opération bancaire. Importez un CSV ou ajoutez une opération.</td></tr>}
      </tbody></table></div>
    </GlassCard>
  </div>;
}

export function AnalyticsBudgetPage() {
  const { currency } = usePlatformFinancialSettings();
  const { setCurrentPageTitle, showToast } = useUIStore();
  const [budgets, setBudgets] = useState<FinanceBudget[]>([]);
  const [entries, setEntries] = useState<AccountingEntry[]>([]);
  const [expenses, setExpenses] = useState<{ id: string; amount: number; category: string; date: string; status: string }[]>([]);
  const [name, setName] = useState('');
  const [analyticCode, setAnalyticCode] = useState('');
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [amount, setAmount] = useState('');
  const money = (value: number) => formatPlatformCurrency(value, currency);

  useEffect(() => {
    setCurrentPageTitle('Analytique & budgets');
    setBudgets([...(getAll('financeBudgets') || []) as FinanceBudget[]]);
    setEntries([...(getAll('accountingEntries') || []) as AccountingEntry[]]);
    setExpenses([...(getAll('expenses') || []) as typeof expenses]);
  }, [setCurrentPageTitle]);

  const actualFor = (budget: FinanceBudget) => {
    const ledgerActual = entries.filter((entry) => entry.analyticCode === budget.analyticCode && entry.date.startsWith(budget.period)).reduce((total, entry) => total + entry.debit - entry.credit, 0);
    const expenseActual = expenses.filter((expense) => expense.category === budget.analyticCode && expense.date.startsWith(budget.period) && expense.status !== 'rejected').reduce((total, expense) => total + expense.amount, 0);
    return Math.max(0, ledgerActual) + expenseActual;
  };
  const saveBudget = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const numericAmount = Number(amount);
    if (!name.trim() || !analyticCode.trim() || !/^\d{4}-\d{2}$/.test(period) || numericAmount <= 0) { showToast('Renseignez l’intitulé, l’axe, la période et un budget positif.', 'warning'); return; }
    const budget: FinanceBudget = { id: `budget-${Date.now()}`, name: name.trim(), analyticCode: analyticCode.trim(), period, amount: numericAmount, companyId };
    addAndNotify('financeBudgets', budget);
    setBudgets((current) => [budget, ...current]); setName(''); setAnalyticCode(''); setAmount('');
    showToast('Budget enregistré.', 'success');
  };
  const removeBudget = (budget: FinanceBudget) => {
    removeAndNotify('financeBudgets', budget.id);
    setBudgets((current) => current.filter((item) => item.id !== budget.id));
  };

  return <div className="space-y-4">
    <GlassCard className="p-4"><div className="mb-3"><h2 className="text-sm font-semibold text-[var(--text-primary)]">Créer un budget analytique</h2><p className="text-xs text-[var(--text-muted)]">Utilisez le même axe analytique dans les écritures et les catégories de dépenses pour suivre le réalisé.</p></div>
      <form onSubmit={saveBudget} className="grid gap-2 md:grid-cols-5"><input value={name} onChange={(event) => setName(event.target.value)} className="glass-input h-9 px-3 text-sm" placeholder="Intitulé du budget" /><input value={analyticCode} onChange={(event) => setAnalyticCode(event.target.value)} className="glass-input h-9 px-3 text-sm" placeholder="Axe / centre de coût" /><input type="month" value={period} onChange={(event) => setPeriod(event.target.value)} className="glass-input h-9 px-3 text-sm" /><input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} className="glass-input h-9 px-3 text-sm" placeholder={`Montant (${currency})`} /><button className="btn-primary h-9"><Plus size={15} /> Ajouter</button></form>
    </GlassCard>
    <GlassCard><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="border-b border-[var(--divider)] text-[10px] uppercase text-[var(--text-muted)]"><th className="px-4 py-3">Budget / axe</th><th className="px-4 py-3">Période</th><th className="px-4 py-3 text-right">Prévision</th><th className="px-4 py-3 text-right">Réalisé</th><th className="px-4 py-3 text-right">Écart</th><th className="px-4 py-3">Consommation</th><th className="px-4 py-3" /></tr></thead><tbody>
      {budgets.map((budget) => { const actual = actualFor(budget); const variance = budget.amount - actual; const ratio = budget.amount ? Math.min(100, Math.round(actual / budget.amount * 100)) : 0; return <tr key={budget.id} className="border-b border-[var(--divider)] last:border-0"><td className="px-4 py-3"><span className="font-medium text-[var(--text-primary)]">{budget.name}</span><span className="mt-1 block text-xs text-[var(--text-muted)]">{budget.analyticCode}</span></td><td className="px-4 py-3 text-[var(--text-secondary)]">{budget.period}</td><td className="px-4 py-3 text-right tabular-nums">{money(budget.amount)}</td><td className="px-4 py-3 text-right tabular-nums">{money(actual)}</td><td className={`px-4 py-3 text-right tabular-nums font-medium ${variance < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{money(variance)}</td><td className="px-4 py-3"><div className="flex items-center gap-2"><div className="h-2 w-24 overflow-hidden rounded bg-[var(--bg-elevated)]"><div className={`h-full ${ratio > 100 ? 'bg-rose-500' : 'bg-[var(--accent-primary)]'}`} style={{ width: `${ratio}%` }} /></div><span className="text-xs">{ratio}%</span></div></td><td className="px-4 py-3"><button title="Supprimer le budget" onClick={() => removeBudget(budget)} className="p-1.5 text-[var(--text-muted)] hover:text-rose-600"><Trash2 size={14} /></button></td></tr>; })}
      {!budgets.length && <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-[var(--text-muted)]">Aucun budget. Ajoutez un axe pour comparer les prévisions aux dépenses et écritures.</td></tr>}
    </tbody></table></div></GlassCard>
    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]"><Wallet size={14} /> Les dépenses en attente sont incluses dans le réalisé pour donner une vue prudente de l’engagement budgétaire.</div>
  </div>;
}
