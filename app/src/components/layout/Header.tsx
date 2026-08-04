import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, Wifi, WifiOff, RefreshCw, X, Check } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useOfflineStore } from '@/stores/offlineStore';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

export function Header() {
  const { currentPageTitle, notifications, unreadCount, markNotificationRead, markAllNotificationsRead, setSearchOpen } = useUIStore();
  const { isOnline, isSyncing, pendingQueue } = useOfflineStore();
  const { user, logout } = useAuthStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  return (
    <header className="fixed top-0 right-0 h-[var(--header-height)] bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-[var(--divider)] z-30 flex items-center px-6"
      style={{ left: 'var(--sidebar-width, 240px)' }}
    >
      {/* Page Title */}
      <div className="flex-1">
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">{currentPageTitle}</h1>
      </div>

      {/* Search */}
      <button
        onClick={() => setSearchOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--glass-border)] text-[var(--text-muted)] text-sm hover:border-[var(--glass-border-hover)] transition-colors mr-3"
      >
        <Search size={14} />
        <span className="hidden md:inline">Rechercher...</span>
        <kbd className="hidden lg:inline-flex px-1.5 py-0.5 text-[10px] bg-white/5 rounded border border-[var(--glass-border)]">Ctrl+K</kbd>
      </button>

      {/* Connection Status */}
      <div className="flex items-center gap-2 mr-3" title={isOnline ? 'En ligne' : 'Hors ligne'}>
        {isOnline ? (
          <Wifi size={16} className="text-[var(--accent-primary)]" />
        ) : (
          <WifiOff size={16} className="text-[var(--accent-danger)]" />
        )}
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
      <div className="relative mr-3">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <Bell size={18} className="text-[var(--text-secondary)]" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[var(--accent-danger)] rounded-full text-[10px] font-bold text-white flex items-center justify-center">
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
          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white font-semibold text-xs">
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
                  onClick={() => { setShowProfile(false); logout(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--accent-danger)] transition-colors"
                >
                  <X size={14} /> Déconnexion
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
