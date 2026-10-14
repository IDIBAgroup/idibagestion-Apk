import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { LandingPage } from '@/views/LandingPage';
import { RegisterPage } from '@/views/RegisterPage';
import { AdminDashboardPage } from '@/views/AdminDashboardPage';
import { SubscriptionPage } from '@/views/SubscriptionPage';
import { LoginPage } from '@/views/LoginPage';
import { DashboardPage } from '@/views/DashboardPage';
import { ProjectsPage } from '@/views/ProjectsPage';
import { ProjectDetailPage } from '@/views/ProjectDetailPage';
import { InvoicesPage } from '@/views/InvoicesPage';
import { ExpensesPage } from '@/views/ExpensesPage';
import { AccountingPage } from '@/views/AccountingPage';
import { AssetsPage } from '@/views/AssetsPage';
import { UsersPage } from '@/views/UsersPage';
import { RolesPage } from '@/views/RolesPage';
import { DepartmentsPage } from '@/views/DepartmentsPage';
import { SettingsPage } from '@/views/SettingsPage';
import { InnovationPage } from '@/views/InnovationPage';
import { SupportPage } from '@/views/SupportPage';
import { MarketingCalendar } from '@/views/MarketingCalendar';
import { DevisPage } from '@/views/DevisPage';
import { RapportsPage } from '@/views/RapportsPage';
import { PartnerPortalPage } from '@/views/PartnerPortalPage';
import { AdminPartnersPage } from '@/views/AdminPartnersPage';

// NEW PAGES
import { ClientsPage } from '@/views/ClientsPage';
import { VibeDashboardPage } from '@/views/vibe/VibeDashboardPage';
import { VibeProspectingPage } from '@/views/vibe/VibeProspectingPage';
import { VibeTrendsPage } from '@/views/vibe/VibeTrendsPage';
import { VibeSignalsPage } from '@/views/vibe/VibeSignalsPage';
import { VibeLeadsPage } from '@/views/vibe/VibeLeadsPage';
import { VibeOutreachPage } from '@/views/vibe/VibeOutreachPage';
import { VibeTrainAIPage } from '@/views/vibe/VibeTrainAIPage';
import { HrEmployeesPage } from '@/views/HrEmployeesPage';
import { RecruitmentPage } from '@/views/RecruitmentPage';
import { PayrollPage } from '@/views/PayrollPage';
import { LeavesPage } from '@/views/LeavesPage';
import { PerformancePage } from '@/views/PerformancePage';
import { YearEndClosingPage } from '@/views/YearEndClosingPage';
import { DSFPage } from '@/views/DSFPage';
import { InvoiceHeaderPage } from '@/views/InvoiceHeaderPage';
import { ActivityReportPage } from '@/views/ActivityReportPage';
import { LibraryPage } from '@/views/LibraryPage';
import { AdminPortalsPage } from '@/views/admin/AdminPortalsPage';
import { ChatPage } from '@/views/ChatPage';

import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/providers/trpc';
import { useEffect } from 'react';

const DevClientPortalPage = import.meta.env.DEV
  ? lazy(() => import('@/views/ClientPortalPage').then((page) => ({ default: page.ClientPortalPage })))
  : null;
const DevVendorPortalPage = import.meta.env.DEV
  ? lazy(() => import('@/views/VendorPortalPage').then((page) => ({ default: page.VendorPortalPage })))
  : null;
const DevSimplePortalPage = import.meta.env.DEV
  ? lazy(() => import('@/views/SimplePortalPage').then((page) => ({ default: page.SimplePortalPage })))
  : null;
const DevTestPage = import.meta.env.DEV
  ? lazy(() => import('@/views/TestPage').then((page) => ({ default: page.TestPage })))
  : null;

function SessionLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-[var(--glass-border)] border-t-[var(--accent-primary)]" />
    </div>
  );
}

function PortalUnavailable() {
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <SessionLoading />;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <SessionLoading />;
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function AdminRoute({ children }: { children?: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <SessionLoading />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children ? <>{children}</> : <Outlet />;
}

function PartnerPortalRoute() {
  const { user, isLoading: authLoading } = useAuth();
  const inviteToken = new URLSearchParams(window.location.hash.slice(1)).get('invite');
  const { data: partner, isLoading: partnerLoading } = trpc.partner.mine.useQuery(undefined, {
    enabled: !!user,
    retry: false,
  });
  const claimInvite = trpc.partner.claimAccount.useMutation({
    onSuccess: () => window.location.replace('/portal/partner'),
  });

  if (authLoading || (!!user && partnerLoading)) return <SessionLoading />;
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

function CompanyInvitationRoute() {
  const { user, isLoading: authLoading } = useAuth();
  const inviteToken = new URLSearchParams(window.location.hash.slice(1)).get('invite');
  const acceptInvite = trpc.company.acceptInvite.useMutation({
    onSuccess: () => window.location.replace('/dashboard'),
  });

  if (authLoading) return <SessionLoading />;
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

function App() {
  useEffect(() => {
    const branding = localStorage.getItem('idibages-branding');
    if (branding) {
      try {
        const parsed = JSON.parse(branding);
        if (parsed.state?.primaryColor) {
          document.documentElement.style.setProperty('--accent-primary', parsed.state.primaryColor);
        }
      } catch {
        // ignore
      }
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<RedirectIfAuth><LoginPage /></RedirectIfAuth>} />
        <Route path="/register" element={<ProtectedRoute><RegisterPage /></ProtectedRoute>} />

        {/* ADMIN ROUTES */}
        <Route path="/admin/saas" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />

        {/* SUBSCRIPTION SELF-SERVICE */}
        <Route path="/subscription" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<SubscriptionPage />} />
        </Route>

        {/* PROTECTED APP ROUTES */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="marketing" element={<MarketingCalendar />} />
          <Route path="innovation" element={<InnovationPage />} />

          {/* COMMERCIAL */}
          <Route path="clients" element={<ClientsPage />} />
          <Route path="finance/invoices" element={<InvoicesPage />} />
          <Route path="finance/quotes" element={<DevisPage />} />
          <Route path="finance/invoice-header" element={<InvoiceHeaderPage />} />

          {/* FINANCES */}
          <Route path="finance/accounting" element={<AccountingPage />} />
          <Route path="finance/closing" element={<YearEndClosingPage />} />
          <Route path="finance/dsf" element={<DSFPage />} />
          <Route path="finance/assets" element={<AssetsPage />} />
          <Route path="finance/expenses" element={<ExpensesPage />} />
          <Route path="finance/reports" element={<RapportsPage />} />

          {/* RH & PAIE */}
          <Route path="hr/employees" element={<HrEmployeesPage />} />
          <Route path="hr/recruitment" element={<RecruitmentPage />} />
          <Route path="hr/payroll" element={<PayrollPage />} />
          <Route path="hr/leaves" element={<LeavesPage />} />
          <Route path="hr/performance" element={<PerformancePage />} />
          <Route path="hr/activity-reports" element={<ActivityReportPage />} />

          {/* VIBE PROSPECTING */}
          <Route path="vibe/dashboard" element={<VibeDashboardPage />} />
          <Route path="vibe/prospecting" element={<VibeProspectingPage />} />
          <Route path="vibe/trends" element={<VibeTrendsPage />} />
          <Route path="vibe/signals" element={<VibeSignalsPage />} />
          <Route path="vibe/leads" element={<VibeLeadsPage />} />
          <Route path="vibe/outreach" element={<VibeOutreachPage />} />
          <Route path="vibe/train-ai" element={<VibeTrainAIPage />} />

          {/* ADMIN */}
          <Route path="admin" element={<AdminRoute />}>
            <Route path="users" element={<UsersPage />} />
            <Route path="roles" element={<RolesPage />} />
            <Route path="departments" element={<DepartmentsPage />} />
            <Route path="news" element={<AdminPortalsPage />} />
            <Route path="portals" element={<AdminPortalsPage />} />
            <Route path="partners" element={<AdminPartnersPage />} />
          </Route>

          {/* RESSOURCES */}
          <Route path="library" element={<LibraryPage />} />
          <Route path="chat" element={<ChatPage />} />

          {/* SYSTEM */}
          <Route path="settings" element={<SettingsPage />} />
          <Route path="support" element={<SupportPage />} />
        </Route>

        {/* PORTAILS EXTERNES - Sans AppLayout */}
        <Route path="/portal/client" element={DevClientPortalPage ? <Suspense fallback={<SessionLoading />}><DevClientPortalPage /></Suspense> : <PortalUnavailable />} />
        <Route path="/portal/simple" element={DevSimplePortalPage ? <Suspense fallback={<SessionLoading />}><DevSimplePortalPage /></Suspense> : <PortalUnavailable />} />
        <Route path="/portal/test" element={DevTestPage ? <Suspense fallback={<SessionLoading />}><DevTestPage /></Suspense> : <PortalUnavailable />} />
        <Route path="/portal/vendor" element={DevVendorPortalPage ? <Suspense fallback={<SessionLoading />}><DevVendorPortalPage /></Suspense> : <PortalUnavailable />} />
        <Route path="/portal/partner" element={<PartnerPortalRoute />} />
        <Route path="/join-company" element={<CompanyInvitationRoute />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
