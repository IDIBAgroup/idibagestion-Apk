import { SUBSCRIPTION_PACKS, type SubscriptionCycle } from '@/data/subscription-plans';

export interface LandingPlan {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  billing: string;
  features: string[];
  cta: string;
  popular: boolean;
  enterprise: boolean;
}

export function defaultPlans(isYearly: boolean): LandingPlan[] {
  const cycle: SubscriptionCycle = isYearly ? 'yearly' : 'monthly';
  return SUBSCRIPTION_PACKS.map(pack => ({
    id: `${pack.slug}-${cycle}`,
    slug: `${pack.slug}-${cycle}`,
    name: pack.name,
    description: pack.description,
    price: pack.priceXAF[cycle],
    billing: cycle === 'yearly' ? 'an' : 'mois',
    features: pack.features,
    cta: pack.enterprise ? 'Parlons de votre entreprise' : 'Essai gratuit de 14 jours',
    popular: pack.popular,
    enterprise: pack.enterprise,
  }));
}
