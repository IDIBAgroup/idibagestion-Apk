import { DEFAULT_PLAN_FEATURES, type SubscriptionFeatureKey } from '@/lib/subscription-features';

export type SubscriptionCycle = 'monthly' | 'yearly';
export type SubscriptionPackSlug = 'starter' | 'pro' | 'business' | 'enterprise';

export const ANNUAL_DISCOUNT_PERCENT = 20;

export interface SubscriptionPack {
  slug: SubscriptionPackSlug;
  name: string;
  description: string;
  priceXAF: Record<SubscriptionCycle, number>;
  limits: {
    users: number;
    clients: number;
    invoices: number;
    projects: number;
  };
  features: string[];
  modules: SubscriptionFeatureKey[];
  supportLevel: 'email' | 'priority' | 'dedicated';
  popular: boolean;
  enterprise: boolean;
}

// Prices are stored in XAF. Annual packs apply the configurable 20% discount
// to twelve monthly payments and are billed upfront.
export const SUBSCRIPTION_PACKS: SubscriptionPack[] = [
  {
    slug: 'starter',
    name: 'Starter',
    description: 'Les outils essentiels pour gérer votre activité au quotidien.',
    priceXAF: { monthly: 5_000, yearly: 48_000 },
    limits: { users: 2, clients: 100, invoices: 300, projects: 0 },
    features: [
      '2 utilisateurs',
      'Gestion des clients et fournisseurs',
      'Devis, facturation et paiements',
      'Gestion des dépenses',
      'Documents PDF',
    ],
    modules: DEFAULT_PLAN_FEATURES.starter,
    supportLevel: 'email',
    popular: false,
    enterprise: false,
  },
  {
    slug: 'pro',
    name: 'Pro',
    description: 'Les outils de collaboration et de pilotage pour les équipes en croissance.',
    priceXAF: { monthly: 15_000, yearly: 144_000 },
    limits: { users: 5, clients: 1_000, invoices: 2_000, projects: 25 },
    features: [
      '5 utilisateurs',
      'Tout Starter',
      'CRM et gestion des prospects',
      'Projets et tâches',
      'Ressources humaines de base',
      'Stocks et ressources',
    ],
    modules: DEFAULT_PLAN_FEATURES.pro,
    supportLevel: 'priority',
    popular: true,
    enterprise: false,
  },
  {
    slug: 'business',
    name: 'Business',
    description: 'Une gestion financière et opérationnelle avancée pour les entreprises structurées.',
    priceXAF: { monthly: 30_000, yearly: 288_000 },
    limits: { users: 15, clients: 5_000, invoices: 10_000, projects: 999 },
    features: [
      '15 utilisateurs',
      'Tout Pro',
      'Comptabilité SYSCOHADA révisée',
      'Budgets et rapports avancés',
      'Paie',
      'Automatisations',
    ],
    modules: DEFAULT_PLAN_FEATURES.business,
    supportLevel: 'priority',
    popular: false,
    enterprise: false,
  },
  {
    slug: 'enterprise',
    name: 'Enterprise',
    description: 'Une offre sur mesure pour les groupes et les organisations multi-sociétés.',
    priceXAF: { monthly: 0, yearly: 0 },
    limits: { users: 0, clients: 0, invoices: 0, projects: 0 },
    features: [
      'Tarification sur devis',
      'Toutes les fonctionnalités Business',
      'Gestion multi-sociétés',
      'API personnalisées',
      'Sécurité avancée',
      'Support dédié',
    ],
    modules: DEFAULT_PLAN_FEATURES.enterprise,
    supportLevel: 'dedicated',
    popular: false,
    enterprise: true,
  },
];
