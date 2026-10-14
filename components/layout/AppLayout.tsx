import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastProvider } from '@/components/shared/ToastProvider';
import { SearchModal } from '@/components/shared/SearchModal';
import { ChatBubbles } from '@/components/shared/ChatBubbles';
import { useUIStore } from '@/stores/uiStore';
import { useBrandingStore } from '@/stores/brandingStore';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore as useUIActions } from '@/stores/uiStore';
import { useEffect } from 'react';

export function AppLayout({ children }: { children: ReactNode }) {
  const { sidebarOpen } = useUIStore();
  const { primaryColor } = useBrandingStore();
  const { user, logout } = useAuth();
  const showToast = useUIActions((state) => state.showToast);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent-primary', primaryColor);
  }, [primaryColor]);

  useEffect(() => {
    try {
      const settings = JSON.parse(localStorage.getItem('idibages_settings_v1') || '{}');
      const appearance = settings.appearance || {};
      if (appearance.theme) document.documentElement.dataset.theme = appearance.theme;
      if (appearance.denseMode !== undefined) document.documentElement.classList.toggle('platform-dense', Boolean(appearance.denseMode));
      if (appearance.animations !== undefined) document.documentElement.dataset.animations = appearance.animations ? 'on' : 'off';
    } catch { /* Ignore an invalid local settings snapshot. */ }
  }, []);

  useEffect(() => {
    const runLocalBackup = () => {
      try {
        const settings = JSON.parse(localStorage.getItem('idibages_settings_v1') || '{}');
        const system = settings.system || {};
        if (!system.autoBackup) return;
        const now = Date.now();
        const interval = system.backupFrequency === 'weekly' ? 7 : system.backupFrequency === 'monthly' ? 30 : 1;
        const lastBackup = Number(localStorage.getItem('idibages_backup_last_at') || 0);
        if (now - lastBackup < interval * 24 * 60 * 60 * 1000) return;
        const database = localStorage.getItem('idibages_db_v7');
        localStorage.setItem('idibages_backup_latest', JSON.stringify({ createdAt: new Date(now).toISOString(), settings, database: database ? JSON.parse(database) : {} }));
        localStorage.setItem('idibages_backup_last_at', String(now));
      } catch { /* A full browser store should not interrupt access to the dashboard. */ }
    };
    runLocalBackup();
    window.addEventListener('idibages-settings-updated', runLocalBackup);
    return () => window.removeEventListener('idibages-settings-updated', runLocalBackup);
  }, []);

  useEffect(() => {
    if (!user) return;
    const readTimeout = () => {
      try { return Number(JSON.parse(localStorage.getItem('idibages_settings_v1') || '{}').security?.sessionTimeout ?? 30); }
      catch { return 30; }
    };
    let timer: ReturnType<typeof setTimeout> | undefined;
    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      const timeoutMinutes = readTimeout();
      if (timeoutMinutes > 0) timer = setTimeout(() => { showToast('Session terminée après inactivité.', 'warning'); logout(); }, timeoutMinutes * 60_000);
    };
    const events: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }));
    window.addEventListener('idibages-settings-updated', resetTimer);
    resetTimer();
    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      window.removeEventListener('idibages-settings-updated', resetTimer);
    };
  }, [user, logout, showToast]);

  return (
    <div className="h-screen overflow-hidden bg-[var(--bg-primary)]">
      <Sidebar />
      <ToastProvider />
      <SearchModal />
      <ChatBubbles />

      <div
        className={`flex h-screen flex-col ml-16 transition-[margin] duration-300 ${
          sidebarOpen ? 'md:ml-[320px]' : ''
        }`}
      >
        <Header />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
