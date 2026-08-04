import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { ProjectDetailPage } from '@/pages/ProjectDetailPage';
import { InvoicesPage } from '@/pages/InvoicesPage';
import { ExpensesPage } from '@/pages/ExpensesPage';
import { AccountingPage } from '@/pages/AccountingPage';
import { AssetsPage } from '@/pages/AssetsPage';
import { UsersPage } from '@/pages/UsersPage';
import { RolesPage } from '@/pages/RolesPage';
import { DepartmentsPage } from '@/pages/DepartmentsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { InnovationPage } from '@/pages/InnovationPage';
import { SupportPage } from '@/pages/SupportPage';
import { MarketingCalendar } from '@/pages/MarketingCalendar';
import { PlaceholderPage } from '@/pages/PlaceholderPage';

// NEW PAGES
import { ClientsPage } from '@/pages/ClientsPage';
import { VibeDashboardPage } from '@/pages/vibe/VibeDashboardPage';
import { VibeTrendsPage } from '@/pages/vibe/VibeTrendsPage';
import { VibeSignalsPage } from '@/pages/vibe/VibeSignalsPage';
import { VibeLeadsPage } from '@/pages/vibe/VibeLeadsPage';
import { VibeOutreachPage } from '@/pages/vibe/VibeOutreachPage';
import { HrEmployeesPage } from '@/pages/HrEmployeesPage';
import { RecruitmentPage } from '@/pages/RecruitmentPage';
import { PayrollPage } from '@/pages/PayrollPage';
import { LeavesPage } from '@/pages/LeavesPage';
import { PerformancePage } from '@/pages/PerformancePage';
import { YearEndClosingPage } from '@/pages/YearEndClosingPage';
import { InvoiceHeaderPage } from '@/pages/InvoiceHeaderPage';

import { useAuthStore } from '@/stores/authStore';
import { useEffect } from 'react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
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
        <Route path="/login" element={<RedirectIfAuth><LoginPage /></RedirectIfAuth>} />
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="marketing" element={<MarketingCalendar />} />
          <Route path="innovation" element={<InnovationPage />} />

          {/* COMMERCIAL */}
          <Route path="clients" element={<ClientsPage />} />
          <Route path="finance/invoices" element={<InvoicesPage />} />
          <Route path="finance/quotes" element={<PlaceholderPage title="Gestion des Devis" />} />
          <Route path="finance/invoice-header" element={<InvoiceHeaderPage />} />

          {/* FINANCES */}
          <Route path="finance/accounting" element={<AccountingPage />} />
          <Route path="finance/closing" element={<YearEndClosingPage />} />
          <Route path="finance/assets" element={<AssetsPage />} />
          <Route path="finance/expenses" element={<ExpensesPage />} />
          <Route path="finance/reports" element={<PlaceholderPage title="Rapports Financiers" />} />

          {/* RH & PAIE */}
          <Route path="hr/employees" element={<HrEmployeesPage />} />
          <Route path="hr/recruitment" element={<RecruitmentPage />} />
          <Route path="hr/payroll" element={<PayrollPage />} />
          <Route path="hr/leaves" element={<LeavesPage />} />
          <Route path="hr/performance" element={<PerformancePage />} />

          {/* VIBE PROSPECTING */}
          <Route path="vibe/dashboard" element={<VibeDashboardPage />} />
          <Route path="vibe/trends" element={<VibeTrendsPage />} />
          <Route path="vibe/signals" element={<VibeSignalsPage />} />
          <Route path="vibe/leads" element={<VibeLeadsPage />} />
          <Route path="vibe/outreach" element={<VibeOutreachPage />} />

          {/* ADMIN */}
          <Route path="admin/users" element={<UsersPage />} />
          <Route path="admin/roles" element={<RolesPage />} />
          <Route path="admin/departments" element={<DepartmentsPage />} />

          {/* SYSTEM */}
          <Route path="settings" element={<SettingsPage />} />
          <Route path="support" element={<SupportPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
