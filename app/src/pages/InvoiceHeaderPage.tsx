import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Eye, FileText, Building2, Phone, Mail, MapPin, CreditCard, Receipt, Hash, CalendarDays, User, FileSpreadsheet, Download, Printer, ChevronLeft, ChevronRight } from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { useUIStore } from '@/stores/uiStore';
import { useBrandingStore } from '@/stores/brandingStore';

interface InvoiceLine {
  description: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export function InvoiceHeaderPage() {
  const { setCurrentPageTitle, showToast } = useUIStore();
  const { companyName, logo, primaryColor } = useBrandingStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'upload' | 'design'>('design');
  const [uploadedHeader, setUploadedHeader] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [docType, setDocType] = useState<'facture' | 'devis'>('facture');
  const [docNumber, setDocNumber] = useState('FAC-2024-00162');
  const [docDate, setDocDate] = useState(new Date().toISOString().split('T')[0]);
  const [clientRef, setClientRef] = useState('REF-2024-089');

  // Company info
  const [coInfo, setCoInfo] = useState({
    name: 'IDIBA Group SARL',
    rccm: 'RC/DLA/2019/M/0847',
    niu: 'M0123456789C',
    bank: 'SGBC - Compte: CMR987654321',
    phone: '+237 233 42 00 00',
    email: 'contact@idibagroup.cm',
    address: 'Rue Joffre, Immeuble IDIBA, 3e etage, Douala',
  });

  // Client info
  const [clInfo, setClInfo] = useState({
    company: 'Societe Generale Cameroun',
    address: 'Avenue Joffre, Centre Ville, Douala',
    rccm: 'RC/DLA/1998/A/001',
    niu: 'M0123456789P',
    phone: '+237 233 42 01 00',
    email: 'compta@sgc.cm',
  });

  // Invoice lines
  const [lines, setLines] = useState<InvoiceLine[]>([
    { description: 'Services connectivite fibre optique - Juillet 2024', qty: 1, unitPrice: 12500000, total: 12500000 },
    { description: 'Maintenance infrastructure reseau Q3', qty: 1, unitPrice: 4500000, total: 4500000 },
  ]);

  useEffect(() => { setCurrentPageTitle('Papier En-tete Facture'); }, [setCurrentPageTitle]);

  const tvaRate = 19.25;
  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  const tva = Math.round(subtotal * tvaRate / 100);
  const total = subtotal + tva;

  const formatXAF = (a: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(a);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => { setUploadedHeader(ev.target?.result as string); showToast('En-tete importe', 'success'); };
      reader.readAsDataURL(file);
    }
  };

  const addLine = () => setLines([...lines, { description: '', qty: 1, unitPrice: 0, total: 0 }]);
  const updateLine = (i: number, field: keyof InvoiceLine, value: string | number) => {
    const newLines = [...lines];
    (newLines[i] as any)[field] = value;
    if (field === 'qty' || field === 'unitPrice') newLines[i].total = newLines[i].qty * newLines[i].unitPrice;
    setLines(newLines);
  };
  const removeLine = (i: number) => setLines(lines.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-lg font-semibold text-[var(--text-primary)]">Papier En-tete</h2><p className="text-xs text-[var(--text-muted)]">Personnalisation des factures et devis</p></div>
        <div className="flex gap-2">
          <button onClick={() => setShowPreview(!showPreview)} className="btn-secondary h-9 text-xs"><Eye size={14} /> {showPreview ? 'Editer' : 'Apercu'}</button>
          <button onClick={() => { const printWindow = window.open('', '_blank'); if (printWindow) printWindow.document.write(`<html><body style="background:white;padding:40px;">${document.getElementById('invoice-preview')?.innerHTML}</body></html>`); }} className="btn-secondary h-9 text-xs"><Printer size={14} /> Imprimer</button>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 bg-[var(--bg-elevated)] rounded-lg p-0.5 w-fit">
        <button onClick={() => setMode('upload')} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md ${mode === 'upload' ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}><Upload size={12} /> Importer</button>
        <button onClick={() => setMode('design')} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md ${mode === 'design' ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}><FileText size={12} /> Concevoir</button>
      </div>

      {mode === 'upload' ? (
        <GlassCard>
          <div className="p-8 text-center">
            <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-[var(--glass-border)] rounded-2xl p-12 cursor-pointer hover:border-[var(--accent-primary)]/30 transition-colors">
              <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileUpload} />
              {uploadedHeader ? (
                <img src={uploadedHeader} alt="En-tete" className="max-h-48 mx-auto object-contain" />
              ) : (
                <>
                  <Upload size={32} className="mx-auto text-[var(--text-muted)] mb-3" />
                  <p className="text-sm text-[var(--text-secondary)]">Cliquez pour importer votre papier en-tete</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">PNG, JPG ou PDF — Resolution recommandee: 2480x350px (A4)</p>
                </>
              )}
            </div>
            {uploadedHeader && (
              <button onClick={() => setUploadedHeader(null)} className="mt-3 text-xs text-[var(--accent-danger)] hover:underline">Retirer l'en-tete</button>
            )}
          </div>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Editor */}
          <div className="space-y-3">
            {/* Doc type */}
            <GlassCard>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2"><Receipt size={14} className="text-[var(--accent-primary)]" /> Document</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[var(--text-secondary)] mb-1">Type</label>
                    <select value={docType} onChange={(e) => setDocType(e.target.value as 'facture' | 'devis')} className="w-full h-9 px-2 glass-input text-sm">
                      <option value="facture">Facture</option><option value="devis">Devis</option>
                    </select>
                  </div>
                  <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Numero</label><input value={docNumber} onChange={(e) => setDocNumber(e.target.value)} className="w-full h-9 px-2 glass-input text-sm" /></div>
                  <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Date</label><input type="date" value={docDate} onChange={(e) => setDocDate(e.target.value)} className="w-full h-9 px-2 glass-input text-sm" /></div>
                  <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Reference client</label><input value={clientRef} onChange={(e) => setClientRef(e.target.value)} className="w-full h-9 px-2 glass-input text-sm" /></div>
                </div>
              </div>
            </GlassCard>

            {/* Company info */}
            <GlassCard>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2"><Building2 size={14} className="text-[var(--accent-primary)]" /> Informations entreprise (vendeur)</h3>
                <div className="space-y-2">
                  {Object.entries(coInfo).map(([key, val]) => {
                    const labels: Record<string, string> = { name: 'Nom', rccm: 'RCCM', niu: 'NIU', bank: 'Compte bancaire', phone: 'Telephone', email: 'Email', address: 'Adresse' };
                    return (
                      <div key={key} className="grid grid-cols-[100px_1fr] gap-2 items-center">
                        <label className="text-[10px] text-[var(--text-muted)]">{labels[key]}</label>
                        <input value={val} onChange={(e) => setCoInfo({ ...coInfo, [key]: e.target.value })} className="h-8 px-2 glass-input text-xs" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </GlassCard>

            {/* Client info */}
            <GlassCard>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2"><User size={14} className="text-[var(--accent-secondary)]" /> Informations client (acheteur)</h3>
                <div className="space-y-2">
                  {Object.entries(clInfo).map(([key, val]) => {
                    const labels: Record<string, string> = { company: 'Nom entreprise', address: 'Adresse', rccm: 'RCCM', niu: 'NIU', phone: 'Telephone', email: 'Email' };
                    return (
                      <div key={key} className="grid grid-cols-[100px_1fr] gap-2 items-center">
                        <label className="text-[10px] text-[var(--text-muted)]">{labels[key]}</label>
                        <input value={val} onChange={(e) => setClInfo({ ...clInfo, [key]: e.target.value })} className="h-8 px-2 glass-input text-xs" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </GlassCard>

            {/* Lines */}
            <GlassCard>
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2"><FileSpreadsheet size={14} className="text-[var(--accent-primary)]" /> Lignes</h3>
                  <button onClick={addLine} className="text-xs text-[var(--accent-primary)] hover:underline">+ Ajouter</button>
                </div>
                <div className="space-y-2">
                  {lines.map((line, i) => (
                    <div key={i} className="grid grid-cols-[1fr_50px_80px_80px_24px] gap-1 items-center">
                      <input value={line.description} onChange={(e) => updateLine(i, 'description', e.target.value)} className="h-8 px-2 glass-input text-xs" placeholder="Description" />
                      <input type="number" value={line.qty} onChange={(e) => updateLine(i, 'qty', Number(e.target.value))} className="h-8 px-1 glass-input text-xs text-center" min={1} />
                      <input type="number" value={line.unitPrice} onChange={(e) => updateLine(i, 'unitPrice', Number(e.target.value))} className="h-8 px-1 glass-input text-xs text-right" />
                      <span className="text-xs text-[var(--text-primary)] text-right font-medium">{formatXAF(line.total)}</span>
                      <button onClick={() => removeLine(i)} className="text-[var(--accent-danger)] hover:opacity-70"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Preview */}
          <div>
            <GlassCard className="sticky top-20">
              <div className="p-4">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2"><Eye size={14} className="text-[var(--accent-primary)]" /> Apercu</h3>
                <div id="invoice-preview" className="bg-white rounded-lg overflow-hidden text-black" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px' }}>
                  {/* Header */}
                  {uploadedHeader ? (
                    <>
                      {/* En-tete importe comme background/bandeau visuel */}
                      <img src={uploadedHeader} alt="En-tete" className="w-full h-auto" />
                      {/* Infos document sous l'en-tete importe */}
                      <div className="p-4 border-b-2 flex justify-end" style={{ borderColor: primaryColor }}>
                        <div className="text-right">
                          <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: primaryColor, color: 'white' }}>
                            {docType === 'facture' ? 'FACTURE' : 'DEVIS'}
                          </span>
                          <p className="text-[9px] text-gray-500 mt-1"><strong>N:</strong> {docNumber}</p>
                          <p className="text-[9px] text-gray-500"><strong>Date:</strong> {new Date(docDate).toLocaleDateString('fr-FR')}</p>
                          <p className="text-[9px] text-gray-500"><strong>Ref:</strong> {clientRef}</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 border-b-2" style={{ borderColor: primaryColor }}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h1 className="text-lg font-bold" style={{ color: primaryColor }}>{coInfo.name}</h1>
                          <p className="text-[9px] text-gray-600">{coInfo.address}</p>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[8px] text-gray-500 mt-1">
                            <span><strong>Tel:</strong> {coInfo.phone}</span>
                            <span><strong>Email:</strong> {coInfo.email}</span>
                            <span><strong>RCCM:</strong> {coInfo.rccm}</span>
                            <span><strong>NIU:</strong> {coInfo.niu}</span>
                            <span><strong>Bank:</strong> {coInfo.bank}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: primaryColor, color: 'white' }}>
                            {docType === 'facture' ? 'FACTURE' : 'DEVIS'}
                          </span>
                          <p className="text-[9px] text-gray-500 mt-1"><strong>N:</strong> {docNumber}</p>
                          <p className="text-[9px] text-gray-500"><strong>Date:</strong> {new Date(docDate).toLocaleDateString('fr-FR')}</p>
                          <p className="text-[9px] text-gray-500"><strong>Ref:</strong> {clientRef}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Client block */}
                  <div className="p-4 bg-gray-50">
                    <p className="text-[8px] text-gray-400 uppercase mb-1">Facturer a</p>
                    <p className="text-xs font-bold text-gray-800">{clInfo.company}</p>
                    <p className="text-[9px] text-gray-600">{clInfo.address}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[8px] text-gray-500 mt-0.5">
                      <span><strong>Tel:</strong> {clInfo.phone}</span>
                      <span><strong>Email:</strong> {clInfo.email}</span>
                      <span><strong>RCCM:</strong> {clInfo.rccm}</span>
                      <span><strong>NIU:</strong> {clInfo.niu}</span>
                    </div>
                  </div>

                  {/* Lines table */}
                  <table className="w-full text-[9px]">
                    <thead><tr className="bg-gray-100"><th className="text-left p-2">Description</th><th className="text-center p-2">Qt</th><th className="text-right p-2">P.U.</th><th className="text-right p-2">Total</th></tr></thead>
                    <tbody>
                      {lines.map((l, i) => (
                        <tr key={i} className="border-b border-gray-100"><td className="p-2">{l.description}</td><td className="text-center p-2">{l.qty}</td><td className="text-right p-2">{formatXAF(l.unitPrice)}</td><td className="text-right p-2 font-medium">{formatXAF(l.total)}</td></tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Totals */}
                  <div className="p-4 border-t">
                    <div className="flex justify-end gap-4 text-[9px]">
                      <div className="text-right space-y-1">
                        <p className="text-gray-500">Sous-total HT</p>
                        <p className="text-gray-500">TVA ({tvaRate}%)</p>
                        <p className="font-bold text-sm" style={{ color: primaryColor }}>TOTAL TTC</p>
                      </div>
                      <div className="text-right space-y-1 min-w-[100px]">
                        <p>{formatXAF(subtotal)}</p>
                        <p>{formatXAF(tva)}</p>
                        <p className="font-bold text-sm" style={{ color: primaryColor }}>{formatXAF(total)}</p>
                      </div>
                    </div>
                    <div className="mt-3 text-center text-[8px] text-gray-400">
                      <p>Conformement a la legislation fiscale en vigueur en Republique du Cameroun</p>
                      <p>{coInfo.name} - RCCM: {coInfo.rccm} - NIU: {coInfo.niu}</p>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
}
