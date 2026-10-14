import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Building2, Check, ChevronDown, Plus } from 'lucide-react';
import { useNavigate } from '@/lib/navigation';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { useCompanySelectionStore } from '@/stores/companySelectionStore';

export function CompanySwitcher() {
  const navigate = useNavigate();
  const { companies, company, isLoading } = useActiveCompany();
  const setActiveCompanyId = useCompanySelectionStore((state) => state.setActiveCompanyId);
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading) {
    return <div className="h-10 w-40 animate-pulse rounded bg-[var(--bg-card-hover)]" />;
  }

  if (companies.length === 0) {
    return (
      <button onClick={() => navigate('/register')} className="btn-secondary h-10 rounded px-3 text-xs">
        <Plus size={14} /> Créer mon entreprise
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => companies.length > 1 && setIsOpen((open) => !open)}
        aria-haspopup={companies.length > 1 ? 'listbox' : undefined}
        aria-expanded={companies.length > 1 ? isOpen : undefined}
        className="flex h-10 items-center gap-2.5 rounded border border-[var(--glass-border)] bg-[var(--bg-card)] pl-1 pr-3 text-xs transition hover:border-[var(--glass-border-hover)] hover:bg-[var(--bg-card-hover)]"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded bg-[var(--bg-card-hover)] text-[var(--text-primary)]">
          <Building2 size={14} />
        </span>
        <span className="hidden max-w-40 truncate text-left font-semibold text-[var(--text-primary)] sm:block">
          {company?.name}
        </span>
        {companies.length > 1 ? <ChevronDown size={14} className="text-[var(--text-muted)]" /> : null}
      </button>

      <AnimatePresence>
        {isOpen && companies.length > 1 && (
          <>
            <button aria-label="Fermer la liste des entreprises" className="fixed inset-0 z-40 cursor-default" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="absolute right-0 top-full z-50 mt-2 w-72 rounded border border-[var(--glass-border)] bg-[var(--bg-card)] p-2 shadow-[var(--shadow-elevated)]"
              role="listbox"
              aria-label="Entreprises accessibles"
            >
              <p className="px-3 py-2 text-xs font-semibold text-[var(--text-muted)]">MES ENTREPRISES</p>
              {companies.map((item) => (
                <button
                  key={item.id}
                  role="option"
                  aria-selected={item.id === company?.id}
                  onClick={() => {
                    setActiveCompanyId(item.id);
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded px-3 py-2.5 text-left text-sm text-[var(--text-primary)] transition hover:bg-[var(--bg-card-hover)]"
                >
                  <span className="min-w-0 truncate">{item.name}</span>
                  {item.id === company?.id ? <Check size={15} className="ml-2 shrink-0 text-[var(--accent-primary)]" /> : null}
                </button>
              ))}
              <div className="mt-1 border-t border-[var(--divider)] pt-1">
                <button onClick={() => navigate('/register')} className="flex w-full items-center gap-2 rounded px-3 py-2.5 text-sm font-medium text-[var(--accent-primary)] transition hover:bg-[var(--accent-primary)]/5">
                  <Plus size={15} /> Ajouter une entreprise
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
