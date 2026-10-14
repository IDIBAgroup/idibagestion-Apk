'use client';

import type { ReactNode } from 'react';
import { Navigate } from '@/lib/navigation';
import { useAuth } from '@/hooks/useAuth';

export function SessionLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-[var(--glass-border)] border-t-[var(--accent-primary)]" />
    </div>
  );
}

export function PortalUnavailable() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] p-6">
      <section className="glass-card max-w-lg p-7 text-center">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Portail en préparation</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
          Ce portail utilise encore des données de démonstration locales. Il est désactivé en production jusqu’à son raccordement aux comptes et aux données serveur.
        </p>
        <a className="btn-primary mt-5" href="/login">Retour à la connexion IDIBAGES</a>
      </section>
    </main>
  );
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <SessionLoading />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function RedirectIfAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <SessionLoading />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <SessionLoading />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
