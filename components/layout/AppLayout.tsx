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
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { trpc } from '@/providers/trpc';
import { parseSubscriptionFeatureKeys, subscriptionFeatureForRoute } from '@/lib/subscription-features';

export function AppLayout({ children }: { children: ReactNode }) {
  const { sidebarOpen } = useUIStore();
  const { primaryColor } = useBrandingStore();
  const { user, logout } = useAuth();
  const showToast = useUIActions((state) => state.showToast);
  const pathname = usePathname();
  const { companyId } = useActiveCompany();
  const subscriptionAccess = trpc.subscription.getUsage.useQuery({ companyId: companyId ?? 0 }, { enabled: Boolean(companyId), staleTime: 30_000 });
  const requiredFeature = subscriptionFeatureForRoute(pathname);
  const allowedFeatures = parseSubscriptionFeatureKeys(subscriptionAccess.data?.plan?.moduleAccess);
  const subscriptionCheckResolved = subscriptionAccess.isSuccess || subscriptionAccess.isError || !companyId;
  const lockedByPlan = Boolean(requiredFeature && subscriptionCheckResolved && (!subscriptionAccess.isSuccess || !allowedFeatures.includes(requiredFeature)));

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
          {lockedByPlan ? (
            <div className="mx-auto flex min-h-full max-w-2xl items-center justify-center p-6">
              <section className="w-full rounded-xl border border-[var(--divider)] bg-[var(--bg-card)] p-8 text-center">
                <h1 className="text-lg font-semibold text-[var(--text-primary)]">{subscriptionAccess.isError || !companyId ? 'Impossible de vérifier l’accès à ce module' : 'Cette fonctionnalité n’est pas incluse dans votre forfait'}</h1>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{subscriptionAccess.isError || !companyId ? 'Vérifiez la connexion à votre espace entreprise et actualisez la page.' : 'Consultez les offres disponibles pour activer ce module. Vos données restent conservées si vous changez de forfait.'}</p>
                <Link href="/subscription" className="btn-primary mt-5 inline-flex h-10 items-center px-4 text-sm">Voir les offres</Link>
              </section>
            </div>
          ) : <div className="p-6">{children}</div>}
        </main>
      </div>
    </div>
  );
}
