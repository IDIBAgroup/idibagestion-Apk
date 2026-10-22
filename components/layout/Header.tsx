import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, Wifi, WifiOff, RefreshCw, X, Check } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useOfflineStore } from '@/stores/offlineStore';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { useBrandingStore, AVAILABLE_LANGUAGES } from '@/stores/brandingStore';
import { applyPlatformLanguage } from '@/lib/language';
import { translate } from '@/lib/i18n';

import { CompanySwitcher } from '@/components/shared/CompanySwitcher';
import { navModules, isActivePath } from './nav';

export function Header() {
  const { currentPageTitle, notifications, unreadCount, markNotificationRead, markAllNotificationsRead, setSearchOpen } = useUIStore();
  const { isOnline, isSyncing, pendingQueue } = useOfflineStore();
  const { user, logout, isLoading } = useAuth();
  const language = useBrandingStore((state) => state.language);
  const t = (text: string) => translate(text, language);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const pathname = usePathname();
  const activeModule = navModules.find((m) => m.items.some((i) => isActivePath(pathname, i.href)));
  const activeItem = activeModule?.items.find((i) => isActivePath(pathname, i.href));

  return (
    <header className="relative z-20 flex h-[76px] shrink-0 items-center border-b border-[var(--divider)] bg-[var(--bg-card)] px-3 sm:px-6">
      {/* Page title with accent bars */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <span className="h-[30px] w-[9px] shrink-0 rounded-sm bg-[var(--accent-primary)]" />
          <h1 className="truncate text-2xl font-bold text-[var(--text-primary)]">{t(activeItem?.label ?? currentPageTitle)}</h1>
        </div>
        <div className="mt-0.5 flex items-center gap-3">
          <span className="h-3.5 w-[9px] shrink-0 rounded-sm bg-[var(--glass-border-hover)]" />
          <p className="truncate text-sm text-[var(--text-muted)]">IDIBAGES{activeModule ? ` · ${activeModule.label}` : ''}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
      <label className="sr-only" htmlFor="dashboard-language">Platform language</label>
      <select id="dashboard-language" aria-label="Platform language" value={language} onChange={(event) => applyPlatformLanguage(event.target.value as 'fr' | 'en' | 'es')} className="h-10 max-w-16 rounded border border-[var(--glass-border)] bg-[var(--bg-card)] px-2 text-xs text-[var(--text-primary)] sm:max-w-28">
        {AVAILABLE_LANGUAGES.map((item) => <option key={item.code} value={item.code}>{item.code.toUpperCase()}</option>)}
      </select>
      {/* Multi-Company Swapper */}
      <div className="hidden md:block">
        <CompanySwitcher />
      </div>

      {/* Search */}
      <button
        onClick={() => setSearchOpen(true)}
        className="flex h-10 items-center gap-2 rounded border border-[var(--glass-border)] bg-[var(--bg-card)] px-3 text-sm text-[var(--text-muted)] transition-colors hover:border-[var(--glass-border-hover)] hover:bg-[var(--bg-card-hover)] md:w-56"
      >
        <Search size={16} className="shrink-0" />
        <span className="hidden flex-1 text-left md:inline">Rechercher…</span>
        <kbd className="hidden rounded border border-[var(--glass-border)] bg-[var(--bg-card-hover)] px-1.5 py-0.5 font-sans text-[10px] font-medium text-[var(--text-muted)] lg:inline-flex">Ctrl K</kbd>
      </button>

      {/* Connection Status */}
      <div
        className="relative hidden h-10 shrink-0 items-center justify-center gap-2 rounded border border-[var(--glass-border)] bg-[var(--bg-card)] px-3 sm:flex"
        title={isOnline ? 'En ligne' : 'Hors ligne'}
      >
        {isOnline ? (
          <Wifi size={16} className="text-[var(--text-primary)]" />
        ) : (
          <WifiOff size={16} className="text-[var(--accent-danger)]" />
        )}
        <span
          aria-hidden
          className={cn(
            'absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full',
            isOnline ? 'bg-[var(--accent-success)]' : 'bg-[var(--accent-danger)]',
          )}
        />
        {!isOnline && (
          <span className="text-xs text-[var(--accent-danger)] hidden md:inline">Hors ligne</span>
        )}
        {isSyncing && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <RefreshCw size={14} className="text-[var(--accent-warning)]" />
          </motion.div>
        )}
        {pendingQueue.length > 0 && (
          <span className="text-[10px] bg-[var(--accent-warning)]/20 text-[var(--accent-warning)] rounded-full px-1.5 py-0.5">
            {pendingQueue.length}
          </span>
        )}
      </div>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded border border-[var(--glass-border)] bg-[var(--bg-card)] transition-colors hover:border-[var(--glass-border-hover)] hover:bg-[var(--bg-card-hover)]"
        >
          <Bell size={18} className="text-[var(--text-primary)]" />
          {unreadCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded bg-[var(--accent-primary)] px-1 text-[10px] font-bold text-white justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        <AnimatePresence>
          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-full mt-2 w-80 glass-card-compact z-50 overflow-hidden"
              >
                <div className="flex items-center justify-between p-3 border-b border-[var(--divider)]">
                  <span className="text-sm font-semibold text-[var(--text-primary)]">Notifications</span>
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-xs text-[var(--accent-primary)] hover:underline"
                  >
                    Tout lire
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-[var(--text-muted)]">
                      Aucune notification
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <button
                        key={notif.id}
                        onClick={() => { markNotificationRead(notif.id); setShowNotifications(false); }}
                        className={cn(
                          'w-full flex items-start gap-3 p-3 text-left hover:bg-white/5 transition-colors border-b border-[var(--divider)] last:border-0',
                          !notif.read && 'bg-white/[0.02]'
                        )}
                      >
                        <div className={cn(
                          'w-2 h-2 rounded-full mt-1.5 shrink-0',
                          notif.type === 'success' && 'bg-[var(--accent-primary)]',
                          notif.type === 'error' && 'bg-[var(--accent-danger)]',
                          notif.type === 'warning' && 'bg-[var(--accent-warning)]',
                          notif.type === 'info' && 'bg-[var(--accent-secondary)]',
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[var(--text-primary)] truncate">{notif.title}</p>
                          <p className="text-xs text-[var(--text-muted)] line-clamp-2">{notif.message}</p>
                        </div>
                        {!notif.read && <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] shrink-0" />}
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Profile */}
      <div className="relative">
        <button
          onClick={() => setShowProfile(!showProfile)}
          className="flex h-10 items-center gap-2.5 rounded border border-[var(--glass-border)] bg-[var(--bg-card)] pl-1 pr-3 transition-colors hover:border-[var(--glass-border-hover)] hover:bg-[var(--bg-card-hover)]"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded bg-[var(--rail-bg)] text-xs font-semibold text-white">
            {user?.displayName?.charAt(0) || 'U'}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-[var(--text-primary)] leading-tight">{user?.displayName}</p>
            <p className="text-[11px] text-[var(--text-muted)] leading-tight">{user?.roleName}</p>
          </div>
        </button>

        <AnimatePresence>
          {showProfile && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)} />
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-full mt-2 w-56 glass-card-compact z-50 py-1"
              >
                <div className="px-3 py-2 border-b border-[var(--divider)]">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{user?.displayName}</p>
                  <p className="text-xs text-[var(--text-muted)]">{user?.email}</p>
                </div>
                <button
                  disabled={isLoading}
                  onClick={() => { setShowProfile(false); logout(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--accent-danger)] transition-colors disabled:opacity-60"
                >
                  <X size={14} /> Déconnexion
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
      </div>
    </header>
  );
}
