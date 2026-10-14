'use client';

import { useEffect, useState } from 'react';
import { Navigate } from '@/lib/navigation';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/providers/trpc';
import { PartnerPortalPage } from '@/views/PartnerPortalPage';
import { SessionLoading } from '@/components/guards';

function useInviteToken() {
  // undefined until the URL hash has been read on the client.
  const [token, setToken] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    setToken(new URLSearchParams(window.location.hash.slice(1)).get('invite'));
  }, []);
  return token;
}

export function PartnerPortalRoute() {
  const { user, isLoading: authLoading } = useAuth();
  const inviteToken = useInviteToken();
  const { data: partner, isLoading: partnerLoading } = trpc.partner.mine.useQuery(undefined, {
    enabled: !!user,
    retry: false,
  });
  const claimInvite = trpc.partner.claimAccount.useMutation({
    onSuccess: () => window.location.replace('/portal/partner'),
  });

  if (inviteToken === undefined || authLoading || (!!user && partnerLoading)) return <SessionLoading />;
  if (!user) {
    const loginPath = inviteToken
      ? '/login?returnTo=' + encodeURIComponent('/portal/partner#invite=' + inviteToken)
      : '/login';
    return <Navigate to={loginPath} replace />;
  }
  if (!partner) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] p-6">
        <section className="glass-card max-w-md p-6 text-center">
          {inviteToken && (
            <div className="mb-5 rounded-xl border border-[var(--glass-border)] p-4">
              <p className="text-sm text-[var(--text-secondary)]">
                Une invitation partenaire est prête à être associée à cette session.
              </p>
              <button
                type="button"
                className="btn-primary mt-4"
                disabled={claimInvite.isPending}
                onClick={() => claimInvite.mutate({ token: inviteToken })}
              >
                {claimInvite.isPending ? 'Association en cours…' : 'Associer mon compte'}
              </button>
              {claimInvite.error && (
                <p role="alert" className="mt-3 text-sm text-[var(--accent-danger)]">
                  {claimInvite.error.message}
                </p>
              )}
            </div>
          )}
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">Accès partenaire non disponible</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Cette session n'est associee a aucun compte partenaire actif.</p>
          <a className="btn-primary mt-5" href="/dashboard">Retour à IDIBAGES</a>
        </section>
      </main>
    );
  }
  return <PartnerPortalPage />;
}

export function CompanyInvitationRoute() {
  const { user, isLoading: authLoading } = useAuth();
  const inviteToken = useInviteToken();
  const acceptInvite = trpc.company.acceptInvite.useMutation({
    onSuccess: () => window.location.replace('/dashboard'),
  });

  if (inviteToken === undefined || authLoading) return <SessionLoading />;
  if (!user) {
    const returnTo = '/join-company#invite=' + (inviteToken ?? '');
    return <Navigate to={'/login?returnTo=' + encodeURIComponent(returnTo)} replace />;
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] p-6">
      <section className="glass-card max-w-md p-6 text-center">
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">Invitation à rejoindre une entreprise</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Acceptez l’invitation pour associer cette session à l’espace de travail.
        </p>
        {inviteToken ? (
          <>
            <button
              type="button"
              className="btn-primary mt-5"
              disabled={acceptInvite.isPending}
              onClick={() => acceptInvite.mutate({ token: inviteToken })}
            >
              {acceptInvite.isPending ? 'Association en cours…' : 'Accepter l’invitation'}
            </button>
            {acceptInvite.error && (
              <p role="alert" className="mt-3 text-sm text-[var(--accent-danger)]">
                {acceptInvite.error.message}
              </p>
            )}
          </>
        ) : (
          <p role="alert" className="mt-4 text-sm text-[var(--accent-danger)]">Le lien d’invitation est incomplet.</p>
        )}
        <a className="btn-ghost mt-5" href="/dashboard">Retour à IDIBAGES</a>
      </section>
    </main>
  );
}

