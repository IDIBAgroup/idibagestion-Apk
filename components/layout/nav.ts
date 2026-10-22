import {
  LayoutDashboard, FolderKanban, Receipt, Calculator, Building2, Users, Shield,
  Settings, HelpCircle, Lightbulb, Calendar, QrCode, BarChart3, Wallet, FileText,
  UserCheck, Briefcase, DollarSign, Handshake, Award, Radar, TrendingUp,
  Zap, MessageSquare, Star, Brain, BookOpen, FileBarChart, Truck, Globe,
  CreditCard, Crown, Coins, Sparkles, SlidersHorizontal, ShoppingCart, PackageCheck,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavModule {
  id: string;
  label: string;
  subtitle: string;
  icon: LucideIcon;
  items: NavItem[];
}

export const panelConfig = {
  homeHref: '/dashboard',
  defaultModuleId: 'general',
  settingsHref: '/settings',
};

export const navModules: NavModule[] = [
  {
    id: 'general',
    label: 'Général',
    subtitle: 'Vue d’ensemble et organisation',
    icon: LayoutDashboard,
    items: [
      { label: 'Tableau de Bord', icon: LayoutDashboard, href: '/dashboard' },
      { label: 'Projets', icon: FolderKanban, href: '/projects' },
      { label: 'Calendrier', icon: Calendar, href: '/marketing' },
      { label: 'Innovation', icon: Lightbulb, href: '/innovation' },
    ],
  },
  {
    id: 'commercial',
    label: 'Commercial',
    subtitle: 'Clients, devis et factures',
    icon: Handshake,
    items: [
      { label: 'Clients', icon: Handshake, href: '/clients' },
      { label: 'Fournisseurs', icon: Truck, href: '/suppliers' },
      { label: 'Facturation', icon: Receipt, href: '/finance/invoices' },
      { label: 'Devis', icon: FileText, href: '/finance/quotes' },
      { label: 'Bons de commande', icon: ShoppingCart, href: '/commercial/orders' },
      { label: 'Bons de livraison', icon: PackageCheck, href: '/commercial/delivery-notes' },
    ],
  },
  {
    id: 'finances',
    label: 'Finances',
    subtitle: 'Comptabilité et reporting',
    icon: Coins,
    items: [
      { label: 'Comptabilité', icon: Calculator, href: '/finance/accounting' },
      { label: 'Clôture Exercice', icon: FileText, href: '/finance/closing' },
      { label: 'DSF OHADA', icon: Globe, href: '/finance/dsf' },
      { label: 'Immobilisations', icon: QrCode, href: '/finance/assets' },
      { label: 'Banque & rapprochement', icon: CreditCard, href: '/finance/banking' },
      { label: 'Analytique & budgets', icon: TrendingUp, href: '/finance/analytics' },
      { label: 'Dépenses', icon: Wallet, href: '/finance/expenses' },
      { label: 'Rapports', icon: BarChart3, href: '/finance/reports' },
    ],
  },
  {
    id: 'hr',
    label: 'RH & Paie',
    subtitle: 'Équipe, congés et paie',
    icon: UserCheck,
    items: [
      { label: 'Employés', icon: UserCheck, href: '/hr/employees' },
      { label: 'Recrutement', icon: Briefcase, href: '/hr/recruitment' },
      { label: 'Paie & CNPS', icon: DollarSign, href: '/hr/payroll' },
      { label: 'Congés', icon: Calendar, href: '/hr/leaves' },
      { label: 'Performance', icon: Award, href: '/hr/performance' },
      { label: 'Rapports Activ.', icon: FileBarChart, href: '/hr/activity-reports' },
    ],
  },
  {
    id: 'vibe',
    label: 'Vibe Prospecting',
    subtitle: 'Prospection assistée par IA',
    icon: Radar,
    items: [
      { label: 'Tableau de Bord', icon: Radar, href: '/vibe/dashboard' },
      { label: 'Prospection', icon: Sparkles, href: '/vibe/prospecting' },
      { label: 'Tendances', icon: TrendingUp, href: '/vibe/trends' },
      { label: 'Signaux d’Achat', icon: Zap, href: '/vibe/signals' },
      { label: 'Leads', icon: Star, href: '/vibe/leads' },
      { label: 'Messages IA', icon: MessageSquare, href: '/vibe/outreach' },
      { label: 'Nourrir l’IA', icon: Brain, href: '/vibe/train-ai' },
    ],
  },
  {
    id: 'portals',
    label: 'Portails externes',
    subtitle: 'Clients, fournisseurs, partenaires',
    icon: Globe,
    items: [
      { label: 'Portail Client', icon: Building2, href: '/portal/client' },
      { label: 'Portail Fournisseur', icon: Truck, href: '/portal/vendor' },
      { label: 'Portail Partenaire', icon: Handshake, href: '/portal/partner' },
    ],
  },
  {
    id: 'resources',
    label: 'Ressources',
    subtitle: 'Documents et échanges',
    icon: BookOpen,
    items: [
      { label: 'Bibliothèque', icon: BookOpen, href: '/library' },
      { label: 'Studio documentaire', icon: FileText, href: '/documents' },
      { label: 'Chat & Réunions', icon: MessageSquare, href: '/chat' },
    ],
  },
  {
    id: 'admin',
    label: 'Administration',
    subtitle: 'Utilisateurs, rôles et partenaires',
    icon: Shield,
    items: [
      { label: 'Utilisateurs', icon: Users, href: '/admin/users' },
      { label: 'Rôles', icon: Shield, href: '/admin/roles' },
      { label: 'Départements', icon: Building2, href: '/admin/departments' },
      { label: 'SaaS Admin', icon: Crown, href: '/admin/saas' },
    ],
  },
  {
    id: 'system',
    label: 'Système',
    subtitle: 'Abonnement, paramètres et aide',
    icon: SlidersHorizontal,
    items: [
      { label: 'Mon Plan', icon: CreditCard, href: '/subscription' },
      { label: 'Paramètres', icon: Settings, href: '/settings' },
      { label: 'Support', icon: HelpCircle, href: '/support' },
    ],
  },
];

export const isActivePath = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(href + '/');
