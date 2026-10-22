import { getDb } from "../api/queries/connection";
import { SUBSCRIPTION_PACKS, type SubscriptionCycle } from "../data/subscription-plans";
import { plans } from "./schema";

async function seed() {
  const db = getDb();
  const existingPlans = await db.select().from(plans);
  if (existingPlans.length > 0) {
    console.log("Plans already exist, skipping seed");
    return;
  }

  const planValues = SUBSCRIPTION_PACKS.flatMap(pack =>
    (['monthly', 'yearly'] as const).map((billingCycle: SubscriptionCycle) => ({
      slug: `${pack.slug}-${billingCycle}`,
      name: pack.name,
      description: pack.description,
      billingCycle,
      priceXAF: pack.priceXAF[billingCycle],
      originalPriceXAF: null,
      isPopular: pack.popular,
      isEnterprise: pack.enterprise,
      maxUsers: pack.limits.users,
      maxClients: pack.limits.clients,
      maxInvoices: pack.limits.invoices,
      maxProjects: pack.limits.projects,
      features: JSON.stringify(pack.features),
      moduleAccess: JSON.stringify(pack.modules),
      supportLevel: pack.supportLevel,
      trialDays: 14,
    })),
  );

  await db.insert(plans).values(planValues);
  console.log("Seeded the Starter, Pro, Business, and Enterprise subscription packs");
}

seed().catch(console.error);
