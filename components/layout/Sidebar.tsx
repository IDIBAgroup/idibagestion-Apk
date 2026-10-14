import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Search, Settings } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useBrandingStore } from '@/stores/brandingStore';
import { translate } from '@/lib/i18n';
import { navModules, panelConfig, isActivePath, type NavModule } from './nav';

// Items can be switched off per company in Paramètres (stored locally for now).
function isItemEnabled(path: string): boolean {
  try {
    const raw = localStorage.getItem('idibages_settings_v1');
    if (!raw) return true;
    const m = JSON.parse(raw)?.modules;
    if (!m) return true;
    if (path === '/projects' && m.projects === false) return false;
    if ((path.includes('/invoices') || path.includes('/quotes') || path.startsWith('/commercial/')) && m.commercial === false) return false;
    if (path.includes('/invoice-header') && m.invoiceHeader === false) return false;
    if (path.includes('/accounting') && m.accounting === false) return false;
    if (path.includes('/dsf') && m.dsf === false) return false;
    if (path.includes('/assets') && m.assets === false) return false;
    if (path.includes('/expenses') && m.expenses === false) return false;
    if (path.includes('/reports') && m.reports === false) return false;
    if (path.startsWith('/hr') && m.hr === false) return false;
    if (path.startsWith('/vibe') && m.vibe === false) return false;
    if (path === '/chat' && m.chat === false) return false;
    if (path === '/innovation' && m.innovation === false) return false;
    if (path === '/library' && m.library === false) return false;
    if (path === '/portal/partner' && m.partnerPortal === false) return false;
    if (path === '/portal/vendor' && m.vendorPortal === false) return false;
  } catch {
    // ignore malformed settings
  }
  return true;
}

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { companyName, logo, language } = useBrandingStore();
  const t = (text: string) => translate(text, language);
  const [mobileOpenPath, setMobileOpenPath] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [, setSettingsRevision] = useState(0);
  const [hovered, setHovered] = useState<{ module: NavModule; top: number } | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mobileOpen = mobileOpenPath === pathname;

  const modules = navModules
    .map((m) => ({ ...m, items: m.items.filter((item) => isItemEnabled(item.href)) }))
    .filter((m) => m.items.length > 0);

  const moduleForPath = modules.find((m) => m.items.some((i) => isActivePath(pathname, i.href)));
  const displayModule =
    moduleForPath ?? modules.find((m) => m.id === panelConfig.defaultModuleId) ?? modules[0];
  const menuItems =
    searchOpen && search.trim()
      ? modules
          .flatMap((m) => m.items)
          .filter((i) => i.label.toLowerCase().includes(search.trim().toLowerCase()))
      : displayModule.items;

  useEffect(() => {
    const refreshSettings = () => setSettingsRevision((revision) => revision + 1);
    window.addEventListener('idibages-settings-updated', refreshSettings);
    window.addEventListener('storage', refreshSettings);
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setHovered(null);
        setSearchOpen(false);
        setMobileOpenPath(null);
      }
    };
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('keydown', escape);
      window.removeEventListener('idibages-settings-updated', refreshSettings);
      window.removeEventListener('storage', refreshSettings);
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    };
  }, []);

  const openHover = (module: NavModule, top: number) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setHovered({
      module,
      top: Math.max(8, Math.min(top, window.innerHeight - 24 - (module.items.length + 2) * 44)),
    });
  };
  const closeHoverSoon = () => {
    hoverTimer.current = setTimeout(() => setHovered(null), 140);
  };

  const toggleMenu = () => {
    if (window.matchMedia('(max-width: 767px)').matches) {
      setMobileOpenPath((p) => (p === pathname ? null : pathname));
    } else {
      toggleSidebar();
    }
  };

  const railButton =
    'mx-1 my-0.5 flex w-[calc(100%-0.5rem)] shrink-0 items-center justify-center rounded transition-colors';

  return (
    <>
      {/* Icon rail */}
      <aside className="app-nav-rail fixed inset-y-0 left-0 z-40 flex w-16 flex-col">
        <button
          type="button"
          onClick={toggleMenu}
          title="Afficher / masquer le menu"
          aria-label="Afficher / masquer le menu"
          aria-controls="panel-sidebar"
          className={`${railButton} h-16 border-b border-white/10 text-white hover:bg-white/10`}
        >
          <Menu size={20} />
        </button>
        <button
          type="button"
          onClick={() => {
            if (!sidebarOpen) toggleSidebar();
            setMobileOpenPath(pathname);
            setSearchOpen((v) => !v);
          }}
          title="Rechercher dans le menu"
          aria-label="Rechercher dans le menu"
          aria-expanded={searchOpen}
          className={`${railButton} h-14 border-b border-white/10 ${
            searchOpen ? 'bg-[var(--accent-action)] text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
          }`}
        >
          <Search size={20} />
        </button>
        <nav aria-label="Modules" className="flex flex-1 flex-col overflow-y-auto">
          {modules.map((module) => {
            const Icon = module.icon;
            const isActive = module.id === displayModule.id;
            return (
              <Link
                key={module.id}
                href={module.items[0].href}
                aria-label={module.label}
                aria-current={isActive ? 'true' : undefined}
                onClick={() => {
                  setHovered(null);
                  setSearch('');
                }}
                onMouseEnter={(e) => openHover(module, e.currentTarget.getBoundingClientRect().top)}
                onMouseLeave={closeHoverSoon}
                className={`${railButton} h-14 ${
                  isActive ? 'bg-[var(--accent-action)] text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={20} />
              </Link>
            );
          })}
        </nav>
        <Link
          href={panelConfig.settingsHref}
          aria-label="Paramètres"
          title="Paramètres"
          className={`${railButton} h-14 border-t border-white/10 text-white/70 hover:bg-white/10 hover:text-white`}
        >
          <Settings size={20} />
        </Link>
      </aside>

      {/* Rail hover flyout */}
      {hovered && (
        <>
          <div aria-hidden className="pointer-events-none fixed inset-0 z-50 bg-black/30" />
          <div
            className="fixed left-16 z-[60] w-64 overflow-hidden border-y border-r border-[var(--divider)] bg-[var(--bg-card)] shadow-2xl"
            style={{ top: hovered.top }}
            onMouseEnter={() => hoverTimer.current && clearTimeout(hoverTimer.current)}
            onMouseLeave={closeHoverSoon}
          >
            <div className="border-b border-[var(--divider)] bg-[var(--accent-primary)]/[0.07] px-4 py-3">
              <p className="text-sm font-bold text-[var(--text-primary)]">{t(hovered.module.label)}</p>
              <p className="text-xs text-[var(--text-muted)]">{t(hovered.module.subtitle)}</p>
            </div>
            <div className="py-1.5">
              {hovered.module.items.map((item) => {
                const active = isActivePath(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setHovered(null)}
                    className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                      active
                        ? 'font-semibold text-[var(--accent-primary)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]'
                    }`}
                  >
                    <span className={`h-px w-4 shrink-0 ${active ? 'bg-[var(--accent-primary)]' : 'bg-[var(--glass-border-hover)]'}`} />
                    {t(item.label)}
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}

      {mobileOpen && (
        <button
          type="button"
          aria-label="Fermer le menu"
          onClick={() => setMobileOpenPath(null)}
          className="fixed inset-y-0 left-16 right-0 z-20 bg-black/30 md:hidden"
        />
      )}

      {/* Contextual sidebar */}
      <aside
        id="panel-sidebar"
        aria-label="Navigation de la section"
        className={`fixed inset-y-0 left-16 z-30 flex w-64 flex-col border-r border-[var(--divider)] bg-[var(--bg-sidebar)] transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${sidebarOpen ? 'md:translate-x-0' : 'md:-translate-x-full'}`}
      >
        <Link
          href={panelConfig.homeHref}
          className="flex h-16 shrink-0 items-center gap-2.5 border-b border-[var(--divider)] px-4"
        >
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={companyName} className="h-9 w-auto max-w-[200px] object-contain" />
          ) : (
            <Image
              src="/brand/options/04-monogram.png"
              alt="IDIBAGES"
              width={2172}
              height={724}
              priority
              className="h-11 w-[184px] shrink-0 object-cover"
            />
          )}
        </Link>

        {searchOpen && (
          <div className="flex h-10 shrink-0 items-center gap-3 border-b border-[var(--divider)] bg-[var(--bg-primary)] px-3">
            <Search size={16} className="shrink-0 text-[var(--text-muted)]" />
            <span className="h-5 w-px bg-[var(--divider)]" />
            <input
              autoFocus
              type="text"
              placeholder="Rechercher dans le menu…"
              aria-label="Rechercher dans le menu"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-full min-w-0 flex-1 border-none bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
            />
          </div>
        )}

        <div className="flex h-[60px] shrink-0 items-center gap-3 border-b border-[var(--divider)] px-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
            <displayModule.icon size={20} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-[var(--text-primary)]">{t(displayModule.label)}</span>
            <span className="block truncate text-xs text-[var(--text-muted)]">{t(displayModule.subtitle)}</span>
          </span>
        </div>

        {/* Branch-style menu */}
        <div className="flex-1 overflow-y-auto py-3">
          <p className="mb-1 px-4 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            {searchOpen && search.trim() ? 'Résultats' : displayModule.label}
          </p>
          <nav className="relative flex flex-col">
            <span aria-hidden className="absolute bottom-5 left-[26px] top-5 w-px bg-[var(--glass-border-hover)]" />
            {menuItems.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => {
                    setSearch('');
                    setSearchOpen(false);
                  }}
                  className={`relative flex items-center py-2.5 pl-11 pr-4 text-sm transition-colors ${
                    active
                      ? 'bg-[var(--accent-action)] font-medium text-white'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]'
                  }`}
                >
                  <span
                    aria-hidden
                    className={`absolute left-6 h-2 w-2 rounded-full border-2 ${
                      active ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]' : 'border-[var(--glass-border-hover)] bg-[var(--bg-sidebar)]'
                    }`}
                  />
                  <span
                    aria-hidden
                    className={`absolute left-[30px] h-px w-3 ${active ? 'bg-[var(--accent-primary)]' : 'bg-[var(--glass-border-hover)]'}`}
                  />
                  {t(item.label)}
                </Link>
              );
            })}
          </nav>
          {menuItems.length === 0 && <p className="px-4 py-3 text-sm text-[var(--text-muted)]">Aucun menu trouvé.</p>}
        </div>
      </aside>
    </>
  );
}
