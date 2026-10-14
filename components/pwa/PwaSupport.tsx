'use client';

import { useEffect, useState } from 'react';
import { Download, RefreshCw, WifiOff, X } from 'lucide-react';
import { useOfflineStore } from '@/stores/offlineStore';
import { useBrandingStore } from '@/stores/brandingStore';
import { translate } from '@/lib/i18n';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PwaSupport() {
  const language = useBrandingStore((state) => state.language);
  const setOnline = useOfflineStore((state) => state.setOnline);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [iosInstructions, setIosInstructions] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);
  const [offline, setOffline] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const t = (copy: string) => translate(copy, language);

  useEffect(() => {
    const updateConnectivity = () => {
      const online = navigator.onLine;
      setOffline(!online);
      setOnline(online);
    };
    updateConnectivity();
    window.addEventListener('online', updateConnectivity);
    window.addEventListener('offline', updateConnectivity);

    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (!standalone && isIos && !sessionStorage.getItem('idibages-install-dismissed')) setIosInstructions(true);

    const captureInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const installed = () => {
      setInstallPrompt(null);
      setIosInstructions(false);
    };
    window.addEventListener('beforeinstallprompt', captureInstall);
    window.addEventListener('appinstalled', installed);

    let registration: ServiceWorkerRegistration | undefined;
    let activeController = Boolean(navigator.serviceWorker?.controller);
    const checkUpdate = () => {
      if (registration?.waiting && activeController) setUpdateReady(true);
    };
    if ('serviceWorker' in navigator && window.isSecureContext) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).then((registered) => {
        registration = registered;
        checkUpdate();
        registered.addEventListener('updatefound', () => {
          const worker = registered.installing;
          worker?.addEventListener('statechange', () => {
            if (worker.state === 'installed' && activeController) setUpdateReady(true);
          });
        });
      }).catch(() => { /* PWA enhancements must not block the app. */ });
      navigator.serviceWorker.addEventListener('controllerchange', () => { activeController = true; });
    }
    return () => {
      window.removeEventListener('online', updateConnectivity);
      window.removeEventListener('offline', updateConnectivity);
      window.removeEventListener('beforeinstallprompt', captureInstall);
      window.removeEventListener('appinstalled', installed);
    };
  }, [setOnline]);

  const dismiss = () => {
    setDismissed(true);
    setIosInstructions(false);
    sessionStorage.setItem('idibages-install-dismissed', '1');
  };

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') setInstallPrompt(null);
  };

  const applyUpdate = () => {
    navigator.serviceWorker?.getRegistration('/').then((registration) => {
      navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true });
      registration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
      window.setTimeout(() => window.location.reload(), 1500);
    });
  };

  if (updateReady) return <div className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] right-3 z-[70] flex max-w-[calc(100vw-1.5rem)] items-center gap-3 rounded-lg border border-[var(--glass-border)] bg-[var(--bg-card)] p-3 shadow-xl md:bottom-4"><span className="text-sm text-[var(--text-primary)]">{t('Une mise à jour est disponible.')}</span><button onClick={applyUpdate} className="inline-flex min-h-10 items-center gap-2 rounded bg-[var(--accent-primary)] px-3 text-sm font-semibold text-white"><RefreshCw size={15} />{t('Mettre à jour')}</button></div>;

  if (offline) return <div className="fixed inset-0 z-[100] grid place-items-center bg-[var(--bg-primary)]/95 p-5 backdrop-blur-sm" role="alertdialog" aria-modal="true" aria-labelledby="offline-title" aria-describedby="offline-description">
    <section className="w-full max-w-md rounded-xl border border-[var(--glass-border)] bg-[var(--bg-card)] p-6 text-center shadow-2xl">
      <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-amber-500/15 text-amber-600"><WifiOff size={22} /></span>
      <h2 id="offline-title" className="mb-2 text-lg font-semibold text-[var(--text-primary)]">{t('Connexion réseau requise')}</h2>
      <p id="offline-description" className="mb-5 text-sm text-[var(--text-muted)]">{t('Les opérations IDIBAGES ne sont pas disponibles hors ligne. Aucun changement local ne sera synchronisé automatiquement. Rétablissez votre connexion pour continuer.')}</p>
      <button type="button" onClick={() => window.location.reload()} className="min-h-11 w-full rounded bg-[var(--accent-primary)] px-4 text-sm font-semibold text-white">{t('Réessayer')}</button>
    </section>
  </div>;

  if (dismissed || (!installPrompt && !iosInstructions)) return null;
  return <aside aria-label={t('Installation IDIBAGES')} className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] left-3 right-3 z-[70] flex items-center gap-3 rounded-lg border border-[var(--glass-border)] bg-[var(--bg-card)] p-3 shadow-xl sm:left-auto sm:right-4 sm:w-[min(24rem,calc(100vw-2rem))] md:bottom-4">
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded bg-[var(--accent-primary)] text-white"><Download size={19} /></span>
    <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[var(--text-primary)]">{t('Installer IDIBAGES')}</p><p className="text-xs text-[var(--text-muted)]">{iosInstructions ? t('Dans le navigateur : Partager, puis Sur l’écran d’accueil.') : t('Accédez plus rapidement à la plateforme.')}</p></div>
    {installPrompt && <button onClick={install} className="min-h-10 shrink-0 rounded bg-[var(--accent-primary)] px-3 text-sm font-semibold text-white">{t('Installer')}</button>}
    <button aria-label={t('Fermer')} onClick={dismiss} className="grid h-9 w-9 shrink-0 place-items-center rounded text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)]"><X size={17} /></button>
  </aside>;
}
