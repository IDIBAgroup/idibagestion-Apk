export type SubscriptionCycle = 'monthly' | 'yearly';

export interface SubscriptionPack {
  slug: 'starter' | 'pro' | 'enterprise';
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
  supportLevel: 'email' | 'priority' | 'dedicated';
  popular: boolean;
  enterprise: boolean;
}

// Annual pricing is billed upfront and equals ten monthly payments (two months free).
export const SUBSCRIPTION_PACKS: SubscriptionPack[] = [
  {
    slug: 'starter',
    name: 'Essentiel',
    description: 'Les outils essentiels pour structurer la gestion d’une petite entreprise.',
    priceXAF: { monthly: 14900, yearly: 149000 },
    limits: { users: 5, clients: 100, invoices: 300, projects: 5 },
    features: [
      'Jusqu’à 5 utilisateurs',
      '100 clients et fournisseurs',
      'Jusqu’à 300 devis et factures par mois',
      'Devis, facturation, relances et dépenses',
      'Trésorerie et comptabilité de base',
      'Projets et tâches (5 projets)',
      'Messagerie interne et bibliothèque de documents',
      'Assistance par e-mail',
    ],
    supportLevel: 'email',
    popular: false,
    enterprise: false,
  },
  {
    slug: 'pro',
    name: 'Croissance',
    description: 'La suite de gestion complète pour les PME qui accélèrent.',
    priceXAF: { monthly: 49900, yearly: 499000 },
    limits: { users: 15, clients: 1000, invoices: 2000, projects: 25 },
    features: [
      'Jusqu’à 15 utilisateurs et 1 000 clients',
      'Jusqu’à 2 000 documents commerciaux par mois',
      'Tout le pack Essentiel',
      'Comptabilité SYSCOHADA révisée et rapports financiers',
      'Immobilisations, clôture comptable et préparation DSF OHADA',
      'Ressources humaines, congés, paie et CNPS',
      'VIBE Prospection et gestion des leads',
      'Portails clients et fournisseurs',
      'Messagerie et assistance prioritaire',
    ],
    supportLevel: 'priority',
    popular: true,
    enterprise: false,
  },
  {
    slug: 'enterprise',
    name: 'Business+',
    description: 'Une offre évolutive pour les organisations multi-équipes et multi-entités.',
    priceXAF: { monthly: 149000, yearly: 1490000 },
    limits: { users: 50, clients: 5000, invoices: 10000, projects: 999 },
    features: [
      'Jusqu’à 50 utilisateurs inclus et 5 000 clients',
      'Jusqu’à 10 000 documents commerciaux par mois',
      'Tout le pack Croissance',
      'Accès multi-sociétés et pilotage consolidé',
      'Rôles, accès et circuits de validation avancés',
      'Portails clients, fournisseurs et partenaires',
      'Accompagnement prioritaire au paramétrage',
      'Migration de données et intégrations spécifiques sur devis',
      'Tarification adaptée au volume au-delà des limites incluses',
    ],
    supportLevel: 'dedicated',
    popular: false,
    enterprise: true,
  },
];
