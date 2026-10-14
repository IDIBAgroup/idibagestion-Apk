import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, FolderKanban, Receipt, Users, Lightbulb, HelpCircle } from 'lucide-react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useUIStore } from '@/stores/uiStore';
import { useNavigate } from '@/lib/navigation';
import { getAll } from '@/lib/db';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: string;
  icon: React.ReactNode;
  path: string;
}

export function SearchModal() {
  const { searchOpen, setSearchOpen } = useUIStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      }
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen, setSearchOpen]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const items: SearchResult[] = [];

    getAll('projects').forEach((p) => {
      if (p.name.toLowerCase().includes(q)) {
        items.push({
          id: p.id,
          title: p.name,
          subtitle: 'Projet',
          type: 'project',
          icon: <FolderKanban size={16} className="text-[var(--accent-primary)]" />,
          path: `/projects/${p.id}`,
        });
      }
    });

    getAll('invoices').forEach((inv) => {
      if (inv.number.toLowerCase().includes(q) || inv.clientName.toLowerCase().includes(q)) {
        items.push({
          id: inv.id,
          title: inv.number,
          subtitle: inv.clientName,
          type: 'invoice',
          icon: <Receipt size={16} className="text-[var(--accent-warning)]" />,
          path: '/finance/invoices',
        });
      }
    });

    getAll('users').forEach((u) => {
      if (u.displayName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) {
        items.push({
          id: u.uid,
          title: u.displayName,
          subtitle: u.roleName,
          type: 'user',
          icon: <Users size={16} className="text-[var(--accent-secondary)]" />,
          path: '/admin/users',
        });
      }
    });

    getAll('ideas').forEach((idea) => {
      if (idea.title.toLowerCase().includes(q)) {
        items.push({
          id: idea.id,
          title: idea.title,
          subtitle: `Idée par ${idea.authorName}`,
          type: 'idea',
          icon: <Lightbulb size={16} className="text-[var(--accent-purple)]" />,
          path: '/innovation',
        });
      }
    });

    getAll('tickets').forEach((t) => {
      if (t.subject.toLowerCase().includes(q)) {
        items.push({
          id: t.id,
          title: t.subject,
          subtitle: `Ticket ${t.status}`,
          type: 'ticket',
          icon: <HelpCircle size={16} className="text-[var(--accent-danger)]" />,
          path: '/support',
        });
      }
    });

    return items.slice(0, 10);
  }, [query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      navigate(results[selectedIndex].path);
      setSearchOpen(false);
      setQuery('');
    }
  };

  return (
    <AnimatePresence>
      {searchOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            onClick={() => { setSearchOpen(false); setQuery(''); }}
          />
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-lg z-[70]"
          >
            <div className="glass-card overflow-hidden">
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--divider)]">
                <Search size={18} className="text-[var(--text-muted)]" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Rechercher projets, factures, utilisateurs..."
                  className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                />
                <button
                  onClick={() => { setSearchOpen(false); setQuery(''); }}
                  className="p-1 rounded hover:bg-white/5"
                >
                  <kbd className="text-[10px] px-1.5 py-0.5 bg-white/5 rounded border border-[var(--glass-border)] text-[var(--text-muted)]">ESC</kbd>
                </button>
              </div>

              {/* Results */}
              <div className="max-h-80 overflow-y-auto">
                {query.trim() && results.length === 0 && (
                  <div className="p-8 text-center text-sm text-[var(--text-muted)]">
                    Aucun résultat pour &ldquo;{query}&rdquo;
                  </div>
                )}
                {results.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => {
                      navigate(result.path);
                      setSearchOpen(false);
                      setQuery('');
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      index === selectedIndex ? 'bg-white/5' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    {result.icon}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--text-primary)] truncate">{result.title}</p>
                      <p className="text-xs text-[var(--text-muted)]">{result.subtitle}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center gap-4 px-4 py-2 border-t border-[var(--divider)] text-[10px] text-[var(--text-muted)]">
                <span className="flex items-center gap-1"><kbd className="px-1 bg-white/5 rounded">↑↓</kbd> Naviguer</span>
                <span className="flex items-center gap-1"><kbd className="px-1 bg-white/5 rounded">↵</kbd> Ouvrir</span>
                <span className="flex items-center gap-1"><kbd className="px-1 bg-white/5 rounded">esc</kbd> Fermer</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
