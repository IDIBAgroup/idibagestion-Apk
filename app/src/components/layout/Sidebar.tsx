import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, Receipt, Calculator,
  Building2, Users, Shield, Settings, HelpCircle, Lightbulb,
  Calendar, ChevronLeft, ChevronRight, QrCode, BarChart3,
  Wallet, FileText, ChevronDown, UserCheck, Briefcase,
  DollarSign, Target, Handshake, Award, ClipboardList, Printer,
  Radar, TrendingUp, Zap, MessageSquare, Star,
} from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useBrandingStore } from '@/stores/brandingStore';
import { cn } from '@/lib/utils';

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
}

const navGroups: NavGroup[] = [
  {
    label: 'GÉNÉRAL',
    items: [
      { label: 'Tableau de Bord', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
      { label: 'Projets', icon: <FolderKanban size={20} />, path: '/projects' },
      { label: 'Calendrier', icon: <Calendar size={20} />, path: '/marketing' },
      { label: 'Innovation', icon: <Lightbulb size={20} />, path: '/innovation' },
    ],
  },
  {
    label: 'COMMERCIAL',
    items: [
      { label: 'Clients', icon: <Handshake size={20} />, path: '/clients' },
      { label: 'Facturation', icon: <Receipt size={20} />, path: '/finance/invoices' },
      { label: 'Devis', icon: <FileText size={20} />, path: '/finance/quotes' },
      { label: 'Papier En-tete', icon: <Printer size={20} />, path: '/finance/invoice-header' },
    ],
  },
  {
    label: 'FINANCES',
    items: [
      { label: 'Comptabilité', icon: <Calculator size={20} />, path: '/finance/accounting' },
      { label: 'Clôture Exercice', icon: <FileText size={20} />, path: '/finance/closing' },
      { label: 'Immobilisations', icon: <QrCode size={20} />, path: '/finance/assets' },
      { label: 'Dépenses', icon: <Wallet size={20} />, path: '/finance/expenses' },
      { label: 'Rapports', icon: <BarChart3 size={20} />, path: '/finance/reports' },
    ],
  },
  {
    label: 'RH & PAIE',
    items: [
      { label: 'Employés', icon: <UserCheck size={20} />, path: '/hr/employees' },
      { label: 'Recrutement', icon: <Briefcase size={20} />, path: '/hr/recruitment' },
      { label: 'Paie & CNPS', icon: <DollarSign size={20} />, path: '/hr/payroll' },
      { label: 'Congés', icon: <Calendar size={20} />, path: '/hr/leaves' },
      { label: 'Performance', icon: <Award size={20} />, path: '/hr/performance' },
    ],
  },
  {
    label: 'VIBE PROSPECTING',
    items: [
      { label: 'Tableau de Bord', icon: <Radar size={20} />, path: '/vibe/dashboard' },
      { label: 'Tendances', icon: <TrendingUp size={20} />, path: '/vibe/trends' },
      { label: 'Signaux d\'Achat', icon: <Zap size={20} />, path: '/vibe/signals' },
      { label: 'Leads', icon: <Star size={20} />, path: '/vibe/leads' },
      { label: 'Messages IA', icon: <MessageSquare size={20} />, path: '/vibe/outreach' },
    ],
  },
  {
    label: 'ADMIN',
    items: [
      { label: 'Utilisateurs', icon: <Users size={20} />, path: '/admin/users' },
      { label: 'Rôles', icon: <Shield size={20} />, path: '/admin/roles' },
      { label: 'Départements', icon: <Building2 size={20} />, path: '/admin/departments' },
    ],
  },
  {
    label: 'SYSTÈME',
    items: [
      { label: 'Paramètres', icon: <Settings size={20} />, path: '/settings' },
      { label: 'Support', icon: <HelpCircle size={20} />, path: '/support' },
    ],
  },
];

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { companyName, logo } = useBrandingStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'GÉNÉRAL': true,
    'COMMERCIAL': true,
    'FINANCES': true,
    'RH & PAIE': true,
    'VIBE PROSPECTING': true,
    'ADMIN': true,
    'SYSTÈME': true,
  });

  const toggleGroup = (label: string) => {
    if (!sidebarOpen) return;
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <motion.aside
      animate={{ width: sidebarOpen ? 240 : 72 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="fixed left-0 top-0 h-screen bg-[var(--bg-sidebar)] border-r border-[var(--divider)] z-40 flex flex-col overflow-hidden"
    >
      {/* Logo */}
      <div className="h-[var(--header-height)] flex items-center px-4 border-b border-[var(--divider)] shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center shrink-0">
            {logo ? (
              <img src={logo} alt="logo" className="w-6 h-6 object-contain" />
            ) : (
              <span className="text-white font-bold text-sm">I</span>
            )}
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="font-semibold text-[var(--text-primary)] text-sm whitespace-nowrap overflow-hidden"
              >
                {companyName}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 scrollbar-thin">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-2">
            <button
              onClick={() => toggleGroup(group.label)}
              className={cn(
                'w-full flex items-center px-4 py-1.5 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider transition-opacity',
                !sidebarOpen && 'justify-center px-2'
              )}
            >
              {sidebarOpen ? (
                <>
                  <span>{group.label}</span>
                  <motion.span
                    animate={{ rotate: expandedGroups[group.label] ? 0 : -90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={12} className="ml-auto" />
                  </motion.span>
                </>
              ) : (
                <div className="w-5 h-px bg-[var(--divider)]" />
              )}
            </button>

            <AnimatePresence initial={false}>
              {(expandedGroups[group.label] || !sidebarOpen) && (
                <motion.div
                  initial={sidebarOpen ? { height: 0, opacity: 0 } : undefined}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={sidebarOpen ? { height: 0, opacity: 0 } : undefined}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                    return (
                      <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={cn(
                          'sidebar-item w-full',
                          isActive && 'sidebar-active',
                          !sidebarOpen && 'justify-center px-2'
                        )}
                        title={!sidebarOpen ? item.label : undefined}
                      >
                        <span className={cn(isActive ? 'text-[var(--accent-primary)]' : '')}>
                          {item.icon}
                        </span>
                        <AnimatePresence>
                          {sidebarOpen && (
                            <motion.span
                              initial={{ opacity: 0, width: 0 }}
                              animate={{ opacity: 1, width: 'auto' }}
                              exit={{ opacity: 0, width: 0 }}
                              className="whitespace-nowrap overflow-hidden"
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                        {item.badge && sidebarOpen && (
                          <span className="ml-auto text-[10px] bg-[var(--accent-primary)] text-[#0B0F14] rounded-full px-1.5 py-0.5 font-bold min-w-[18px] text-center">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </nav>

      {/* Toggle button */}
      <div className="shrink-0 p-3 border-t border-[var(--divider)]">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-white/5 transition-colors text-[var(--text-muted)]"
        >
          {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>
    </motion.aside>
  );
}
