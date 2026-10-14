'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Truck } from 'lucide-react';
import { ExternalMiniPortal } from '@/components/portal/ExternalMiniPortal';
import { portalLogin, getPortalSession, setPortalSession, portalLogout, logPortalActivity } from '@/lib/api';
import type { PortalUser } from '@/types';

export function VendorPortalPage() {
  const [session, setSession] = useState<{ user: PortalUser; token: string } | null>(null);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const existing = getPortalSession();
    if (existing?.user.portalType === 'vendor') setSession(existing);
  }, []);

  const handleLogin = () => {
    setLoginError('');
    const result = portalLogin({ ...loginForm, portalType: 'vendor' });
    if (!result.success || !result.user || !result.token) {
      setLoginError(result.error || 'Email ou mot de passe incorrect');
      return;
    }
    setPortalSession(result.user, result.token);
    setSession({ user: result.user, token: result.token });
    logPortalActivity(result.user.id, 'vendor', 'login', 'Connexion au portail fournisseur');
  };

  const handleLogout = () => {
    if (session) logPortalActivity(session.user.id, 'vendor', 'login', 'Déconnexion du portail fournisseur');
    portalLogout();
    setSession(null);
  };

  if (session) return <ExternalMiniPortal user={session.user} onLogout={handleLogout} />;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f8f7] p-4">
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md rounded-xl border border-[#dce3e0] bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#073c60] text-white"><Truck size={22} /></div>
          <h1 className="text-xl font-semibold text-[#10212c]">Espace fournisseur</h1>
          <p className="mt-1 text-sm text-[#64737c]">Connectez-vous pour consulter vos commandes et documents partagés.</p>
        </div>
        {loginError && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{loginError}</p>}
        <form onSubmit={(event) => { event.preventDefault(); handleLogin(); }} className="space-y-4">
          <label className="block text-sm font-medium text-[#263740]">Adresse e-mail<input type="email" required autoComplete="username" value={loginForm.email} onChange={(event) => setLoginForm((value) => ({ ...value, email: event.target.value }))} className="mt-1.5 h-11 w-full rounded-lg border border-[#d6ddda] px-3 text-sm outline-none focus:border-[#1f7a63]" /></label>
          <label className="block text-sm font-medium text-[#263740]">Mot de passe<input type="password" required autoComplete="current-password" value={loginForm.password} onChange={(event) => setLoginForm((value) => ({ ...value, password: event.target.value }))} className="mt-1.5 h-11 w-full rounded-lg border border-[#d6ddda] px-3 text-sm outline-none focus:border-[#1f7a63]" /></label>
          <button type="submit" className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#111] text-sm font-semibold text-white transition hover:bg-[#2c3438]"><LogIn size={16} />Se connecter</button>
        </form>
      </motion.section>
    </main>
  );
}
