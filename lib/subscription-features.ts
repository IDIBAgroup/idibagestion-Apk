export const SUBSCRIPTION_FEATURES = [
  { key: 'customers', label: 'Clients' },
  { key: 'suppliers', label: 'Fournisseurs' },
  { key: 'quotes', label: 'Devis' },
  { key: 'orders', label: 'Bons de commande' },
  { key: 'delivery_notes', label: 'Bons de livraison' },
  { key: 'invoices', label: 'Facturation' },
  { key: 'payments', label: 'Paiements' },
  { key: 'expenses', label: 'Dépenses' },
  { key: 'documents', label: 'Documents PDF et Studio documentaire' },
  { key: 'crm', label: 'CRM et prospection' },
  { key: 'projects', label: 'Projets et tâches' },
  { key: 'hr', label: 'Ressources humaines' },
  { key: 'inventory', label: 'Stocks' },
  { key: 'resources', label: 'Ressources' },
  { key: 'accounting', label: 'Comptabilité SYSCOHADA' },
  { key: 'banking', label: 'Trésorerie et rapprochement bancaire' },
  { key: 'fixed_assets', label: 'Immobilisations' },
  { key: 'budgets', label: 'Budgets' },
  { key: 'payroll', label: 'Paie' },
  { key: 'automations', label: 'Automatisations' },
  { key: 'advanced_reports', label: 'Rapports avancés' },
  { key: 'multi_company', label: 'Multi-sociétés' },
  { key: 'custom_api', label: 'API personnalisées' },
  { key: 'advanced_security', label: 'Sécurité avancée' },
  { key: 'dedicated_support', label: 'Support dédié' },
] as const;

export type SubscriptionFeatureKey = typeof SUBSCRIPTION_FEATURES[number]['key'];

const STARTER_FEATURES: SubscriptionFeatureKey[] = [
  'customers', 'suppliers', 'quotes', 'orders', 'delivery_notes', 'invoices', 'payments', 'expenses', 'documents',
];
const PRO_FEATURES: SubscriptionFeatureKey[] = [
  ...STARTER_FEATURES, 'crm', 'projects', 'hr', 'inventory', 'resources',
];
const BUSINESS_FEATURES: SubscriptionFeatureKey[] = [
  ...PRO_FEATURES, 'accounting', 'banking', 'fixed_assets', 'budgets', 'payroll', 'automations', 'advanced_reports',
];

export const DEFAULT_PLAN_FEATURES: Record<'starter' | 'pro' | 'business' | 'enterprise', SubscriptionFeatureKey[]> = {
  starter: STARTER_FEATURES,
  pro: PRO_FEATURES,
  business: BUSINESS_FEATURES,
  enterprise: [...BUSINESS_FEATURES, 'multi_company', 'custom_api', 'advanced_security', 'dedicated_support'],
};

export function isSubscriptionFeatureKey(value: string): value is SubscriptionFeatureKey {
  return SUBSCRIPTION_FEATURES.some((feature) => feature.key === value);
}

export function subscriptionFeatureForRoute(path: string): SubscriptionFeatureKey | undefined {
  if (path === '/clients') return 'customers';
  if (path === '/suppliers' || path.startsWith('/portal/vendor')) return 'suppliers';
  if (path === '/finance/quotes') return 'quotes';
  if (path === '/commercial/orders') return 'orders';
  if (path === '/commercial/delivery-notes') return 'delivery_notes';
  if (path === '/finance/invoices' || path === '/finance/invoice-header') return 'invoices';
  if (path === '/finance/expenses') return 'expenses';
  if (path === '/documents' || path === '/library') return 'documents';
  if (path.startsWith('/vibe')) return 'crm';
  if (path === '/projects' || path === '/marketing' || path === '/chat' || path === '/innovation') return 'projects';
  if (path.startsWith('/hr/payroll')) return 'payroll';
  if (path.startsWith('/hr')) return 'hr';
  if (path === '/admin/departments') return 'hr';
  if (path === '/finance/accounting' || path === '/finance/closing' || path === '/finance/dsf') return 'accounting';
  if (path === '/finance/assets') return 'fixed_assets';
  if (path === '/finance/banking') return 'banking';
  if (path === '/finance/analytics') return 'budgets';
  if (path === '/finance/reports' || path.startsWith('/hr/activity-reports')) return 'advanced_reports';
  if (path === '/portal/client') return 'customers';
  if (path === '/portal/partner') return 'multi_company';
  return undefined;
}

export function parseSubscriptionFeatureKeys(value: string | null | undefined): SubscriptionFeatureKey[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((item): item is SubscriptionFeatureKey => typeof item === 'string' && isSubscriptionFeatureKey(item)))];
  } catch {
    return [];
  }
}
