'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Bell, BriefcaseBusiness, House, Menu, UserRound, X } from 'lucide-react';
import { useBrandingStore } from '@/stores/brandingStore';
import { translate } from '@/lib/i18n';
import { panelConfig } from './nav';

const actions = [
  { label: 'Clients', href: '/clients' },
  { label: 'Facturation', href: '/finance/invoices' },
  { label: 'Projets', href: '/projects' },
  { label: 'Studio documentaire', href: '/documents' },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const language = useBrandingStore((state) => state.language);
  const [actionsOpen, setActionsOpen] = useState(false);
  const t = (copy: string) => translate(copy, language);
  const openModules = () => window.dispatchEvent(new CustomEvent('idibages:open-modules'));
  const openNotifications = () => window.dispatchEvent(new CustomEvent('idibages:open-notifications'));
  const openProfile = () => window.dispatchEvent(new CustomEvent('idibages:open-profile'));
  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    if (!actionsOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActionsOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [actionsOpen]);

  return <>
    <nav aria-label={t('Navigation principale mobile')} className="fixed inset-x-0 bottom-0 z-40 grid h-[calc(4.25rem+env(safe-area-inset-bottom))] grid-cols-5 border-t border-[var(--divider)] bg-[var(--bg-card)]/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <Link href={panelConfig.homeHref} aria-current={active(panelConfig.homeHref) ? 'page' : undefined} className={`flex min-w-0 flex-col items-center justify-center gap-1 text-[10px] ${active(panelConfig.homeHref) ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'}`}><House size={20} /><span>{t('Accueil')}</span></Link>
      <button onClick={openModules} className="flex min-w-0 flex-col items-center justify-center gap-1 text-[10px] text-[var(--text-muted)]"><Menu size={20} /><span>{t('Modules')}</span></button>
      <button onClick={() => setActionsOpen(true)} aria-expanded={actionsOpen} className="-mt-4 flex min-w-0 flex-col items-center justify-center gap-1 text-[10px] text-[var(--accent-primary)]"><span className="grid h-12 w-12 place-items-center rounded-full border-4 border-[var(--bg-card)] bg-[var(--accent-primary)] text-white shadow-lg"><BriefcaseBusiness size={20} /></span><span className="-mt-1">{t('Actions')}</span></button>
      <button onClick={openNotifications} className="flex min-w-0 flex-col items-center justify-center gap-1 text-[10px] text-[var(--text-muted)]"><Bell size={20} /><span>{t('Notifications')}</span></button>
      <button onClick={openProfile} className="flex min-w-0 flex-col items-center justify-center gap-1 text-[10px] text-[var(--text-muted)]"><UserRound size={20} /><span>{t('Profil')}</span></button>
    </nav>
    {actionsOpen && <div className="fixed inset-0 z-[60] flex items-end bg-black/40 md:hidden" onMouseDown={() => setActionsOpen(false)}>
      <section role="dialog" aria-modal="true" aria-label={t('Actions rapides')} onMouseDown={(event) => event.stopPropagation()} className="w-full rounded-t-2xl border-t border-[var(--divider)] bg-[var(--bg-card)] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl">
        <div className="mb-3 flex items-center justify-between"><h2 className="text-base font-semibold text-[var(--text-primary)]">{t('Actions rapides')}</h2><button aria-label={t('Fermer')} onClick={() => setActionsOpen(false)} className="grid h-10 w-10 place-items-center rounded text-[var(--text-muted)]"><X size={20} /></button></div>
        <div className="grid grid-cols-2 gap-2">{actions.map((action) => <Link key={action.href} href={action.href} onClick={() => setActionsOpen(false)} className="flex min-h-12 items-center rounded border border-[var(--glass-border)] px-3 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]">{t(action.label)}</Link>)}</div>
      </section>
    </div>}
  </>;
}
