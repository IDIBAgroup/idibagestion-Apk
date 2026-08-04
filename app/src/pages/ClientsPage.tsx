import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, X, Phone, Mail, MapPin, Building2, Receipt, Eye } from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useUIStore } from '@/stores/uiStore';
import { getAll } from '@/lib/db';

export function ClientsPage() {
  const { setCurrentPageTitle, showToast } = useUIStore();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showDrawer, setShowDrawer] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [newClient, setNewClient] = useState({ name: '', email: '', phone: '', address: '', city: '', contactName: '', contactEmail: '', type: 'entreprise', sector: '' });

  useEffect(() => { setCurrentPageTitle('Gestion des Clients'); }, [setCurrentPageTitle]);

  const clients = getAll('clients');
  const invoices = getAll('invoices');

  const filtered = clients.filter((c: any) => {
    const m = c.name.toLowerCase().includes(search.toLowerCase()) || c.contactName.toLowerCase().includes(search.toLowerCase());
    return m && (typeFilter === 'all' || c.type === typeFilter);
  });

  const formatXAF = (a: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(a);

  const handleCreate = () => {
    showToast('Client créé avec succès', 'success');
    setShowDrawer(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Clients</h2>
          <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-elevated)] rounded-full px-2.5 py-1">{clients.length}</span>
        </div>
        <button onClick={() => setShowDrawer(true)} className="btn-primary h-9"><Plus size={16} /> Nouveau Client</button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full h-9 pl-9 pr-4 glass-input text-sm" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-9 px-3 glass-input text-sm">
          <option value="all">Tous types</option><option value="entreprise">Entreprise</option><option value="particulier">Particulier</option><option value="administration">Administration</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((client: any, i: number) => {
          const clientInvoices = invoices.filter((inv: any) => inv.clientName === client.name);
          return (
            <GlassCard key={client.id} delay={i * 0.05}>
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white font-bold text-sm">
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">{client.name}</h3>
                      <span className="text-[10px] text-[var(--text-muted)] px-1.5 py-0.5 rounded bg-[var(--bg-elevated)]">{client.sector}</span>
                    </div>
                  </div>
                  <StatusBadge status={client.status === 'active' ? 'active' : 'inactive'} />
                </div>

                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                    <UserIcon size={12} /> {client.contactName}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                    <Mail size={12} /> {client.contactEmail}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                    <Phone size={12} /> {client.phone}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <MapPin size={12} /> {client.city}
                  </div>
                </div>

                <div className="h-px bg-[var(--divider)] my-2" />

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-[var(--text-muted)]">Facturé</span><p className="text-[var(--text-primary)] font-medium">{formatXAF(client.totalInvoiced)}</p></div>
                  <div><span className="text-[var(--text-muted)]">Restant</span><p className={client.outstandingBalance > 0 ? 'text-[var(--accent-warning)]' : 'text-[var(--accent-primary)]'}>{formatXAF(client.outstandingBalance)}</p></div>
                </div>

                <div className="flex gap-2 mt-3">
                  <button onClick={() => setSelectedClient(client)} className="flex-1 btn-secondary h-8 text-xs justify-center">
                    <Eye size={12} /> Détails
                  </button>
                  <button onClick={() => showToast(`${clientInvoices.length} facture(s) trouvée(s)`, 'info')} className="flex-1 btn-secondary h-8 text-xs justify-center">
                    <Receipt size={12} /> {clientInvoices.length} fact.
                  </button>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Client Detail Modal (centered - short form) */}
      <AnimatePresence>
        {selectedClient && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setSelectedClient(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md glass-card z-50 max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">{selectedClient.name}</h2>
                  <button onClick={() => setSelectedClient(null)} className="p-2 rounded-lg hover:bg-white/5"><X size={18} className="text-[var(--text-muted)]" /></button>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div><span className="text-[var(--text-muted)] text-xs">Contact</span><p className="text-[var(--text-primary)]">{selectedClient.contactName}</p></div>
                    <div><span className="text-[var(--text-muted)] text-xs">Email</span><p className="text-[var(--text-primary)]">{selectedClient.contactEmail}</p></div>
                    <div><span className="text-[var(--text-muted)] text-xs">Téléphone</span><p className="text-[var(--text-primary)]">{selectedClient.phone}</p></div>
                    <div><span className="text-[var(--text-muted)] text-xs">Type</span><p className="text-[var(--text-primary)]">{selectedClient.type}</p></div>
                    <div><span className="text-[var(--text-muted)] text-xs">IFU</span><p className="text-[var(--text-primary)]">{selectedClient.ifu || '-'}</p></div>
                    <div><span className="text-[var(--text-muted)] text-xs">RCCM</span><p className="text-[var(--text-primary)]">{selectedClient.rccm || '-'}</p></div>
                  </div>
                  <div><span className="text-[var(--text-muted)] text-xs">Adresse</span><p className="text-[var(--text-primary)]">{selectedClient.address}, {selectedClient.city}</p></div>
                  <div className="h-px bg-[var(--divider)]" />
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-[var(--bg-elevated)]">
                      <p className="text-xs text-[var(--text-muted)]">Facturé</p><p className="text-sm font-semibold text-[var(--text-primary)]">{formatXAF(selectedClient.totalInvoiced)}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-[var(--bg-elevated)]">
                      <p className="text-xs text-[var(--text-muted)]">Payé</p><p className="text-sm font-semibold text-[var(--accent-primary)]">{formatXAF(selectedClient.totalPaid)}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-[var(--bg-elevated)]">
                      <p className="text-xs text-[var(--text-muted)]">Restant</p><p className="text-sm font-semibold text-[var(--accent-warning)]">{formatXAF(selectedClient.outstandingBalance)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* New Client Drawer (right sidebar - long form) */}
      <AnimatePresence>
        {showDrawer && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowDrawer(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[var(--bg-card)] border-l border-[var(--glass-border)] z-50 overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Nouveau Client</h2>
                  <button onClick={() => setShowDrawer(false)} className="p-2 rounded-lg hover:bg-white/5"><X size={18} className="text-[var(--text-muted)]" /></button>
                </div>
                <div className="space-y-4">
                  <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Nom de l'entreprise</label><input value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} className="w-full h-10 px-3 glass-input text-sm" placeholder="Ex: ABC Sarl" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Type</label><select value={newClient.type} onChange={(e) => setNewClient({ ...newClient, type: e.target.value })} className="w-full h-10 px-3 glass-input text-sm"><option>entreprise</option><option>particulier</option><option>administration</option></select></div>
                    <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Secteur</label><input value={newClient.sector} onChange={(e) => setNewClient({ ...newClient, sector: e.target.value })} className="w-full h-10 px-3 glass-input text-sm" placeholder="Télécoms" /></div>
                  </div>
                  <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Email</label><input value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} className="w-full h-10 px-3 glass-input text-sm" placeholder="contact@client.cm" /></div>
                  <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Téléphone</label><input value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} className="w-full h-10 px-3 glass-input text-sm" placeholder="+237 699 00 00 00" /></div>
                  <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Adresse</label><input value={newClient.address} onChange={(e) => setNewClient({ ...newClient, address: e.target.value })} className="w-full h-10 px-3 glass-input text-sm" /></div>
                  <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Ville</label><input value={newClient.city} onChange={(e) => setNewClient({ ...newClient, city: e.target.value })} className="w-full h-10 px-3 glass-input text-sm" /></div>
                  <div className="h-px bg-[var(--divider)]" />
                  <p className="text-sm font-medium text-[var(--text-primary)]">Contact principal</p>
                  <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Nom</label><input value={newClient.contactName} onChange={(e) => setNewClient({ ...newClient, contactName: e.target.value })} className="w-full h-10 px-3 glass-input text-sm" /></div>
                  <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Email contact</label><input value={newClient.contactEmail} onChange={(e) => setNewClient({ ...newClient, contactEmail: e.target.value })} className="w-full h-10 px-3 glass-input text-sm" /></div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowDrawer(false)} className="flex-1 btn-ghost h-10 justify-center">Annuler</button>
                    <button onClick={handleCreate} className="flex-1 btn-primary h-10 justify-center">Créer</button>
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

function UserIcon({ size, className }: { size: number; className?: string }) {
  return <Building2 size={size} className={className} />;
}
