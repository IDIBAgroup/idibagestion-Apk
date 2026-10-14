import type { Company, Plan, User } from "@db/schema";
import { SUBSCRIPTION_PACKS, type SubscriptionCycle } from "@/data/subscription-plans";

// Design phase: under `next dev` the app signs in a fake admin so the UI can be worked on
// without a database. Never active in production builds. Set DESIGN_MODE=0 to use real auth in dev.
export const isDesignMode =
  process.env.NODE_ENV === "development" && process.env.DESIGN_MODE !== "0";

const now = new Date();

export const designUser: User = {
  id: 1,
  externalId: null,
  name: "Admin Démo",
  email: "admin@demo.idibages.test",
  googleSub: null,
  passwordHash: null,
  avatar: null,
  role: "admin",
  createdAt: now,
  updatedAt: now,
  lastSignInAt: now,
};

export const designPlans: Plan[] = SUBSCRIPTION_PACKS.flatMap((pack, packIndex) =>
  (['monthly', 'yearly'] as const).map((cycle: SubscriptionCycle, cycleIndex) => ({
    id: packIndex * 2 + cycleIndex + 1,
    slug: `${pack.slug}-${cycle}`,
    name: pack.name,
    description: pack.description,
    billingCycle: cycle,
    priceXAF: pack.priceXAF[cycle],
    originalPriceXAF: null,
    isPopular: pack.popular,
    isEnterprise: pack.enterprise,
    maxUsers: pack.limits.users,
    maxClients: pack.limits.clients,
    maxInvoices: pack.limits.invoices,
    maxProjects: pack.limits.projects,
    features: JSON.stringify(pack.features),
    supportLevel: pack.supportLevel,
    trialDays: 14,
    isActive: true,
    createdAt: now,
  })),
);

export const designCompany: Company = {
  id: 1,
  name: "IDIBA Démo SARL",
  slug: "idiba-demo",
  email: "contact@demo.idibages.test",
  phone: "+237 600 00 00 00",
  address: "Rue de la Démo",
  city: "Douala",
  country: "Cameroun",
  logoUrl: null,
  siret: null,
  taxId: null,
  niu: null,
  rccm: null,
  capitalSocial: null,
  status: "active",
  ownerUserId: 1,
  createdAt: now,
  updatedAt: now,
};
