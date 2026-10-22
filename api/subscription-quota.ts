import { and, count, desc, eq, gte } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { businessDocuments, clients, plans, subscriptions } from '@db/schema';
import { getDb } from './queries/connection';
import { isDesignMode } from './design-mode';
import { DEFAULT_PLAN_FEATURES, parseSubscriptionFeatureKeys, type SubscriptionFeatureKey } from '@/lib/subscription-features';

export async function getSubscriptionFeatureAccess(companyId: number): Promise<Set<SubscriptionFeatureKey>> {
  if (isDesignMode) return new Set(Object.values(DEFAULT_PLAN_FEATURES).flat());
  const db = getDb();
  const now = new Date();
  const [subscription] = await db.select({
    status: subscriptions.status,
    currentPeriodEnd: subscriptions.currentPeriodEnd,
    trialEndsAt: subscriptions.trialEndsAt,
    moduleAccess: plans.moduleAccess,
    planSlug: plans.slug,
  }).from(subscriptions)
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .where(eq(subscriptions.companyId, companyId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  if (!subscription || !['active', 'trial', 'cancelled'].includes(subscription.status)) return new Set();
  const validUntil = subscription.status === 'trial' ? subscription.trialEndsAt : subscription.currentPeriodEnd;
  if (!validUntil || validUntil <= now) return new Set();

  const keys = parseSubscriptionFeatureKeys(subscription.moduleAccess);
  if (keys.length) return new Set(keys);
  const packSlug = subscription.planSlug.split('-')[0];
  if (packSlug === 'starter' || packSlug === 'pro' || packSlug === 'business' || packSlug === 'enterprise') {
    return new Set(DEFAULT_PLAN_FEATURES[packSlug]);
  }
  return new Set();
}

export async function assertSubscriptionFeature(companyId: number, feature: SubscriptionFeatureKey) {
  const access = await getSubscriptionFeatureAccess(companyId);
  if (!access.has(feature)) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: `La fonctionnalité « ${feature} » n’est pas incluse dans le forfait actif. Passez à une offre supérieure pour y accéder.`,
    });
  }
}

export async function assertSubscriptionQuota(companyId: number, resource: 'clients' | 'invoices') {
  if (isDesignMode) return;
  const db = getDb();
  const now = new Date();
  const [subscription] = await db.select({
    status: subscriptions.status,
    periodEnd: subscriptions.currentPeriodEnd,
    trialEndsAt: subscriptions.trialEndsAt,
    maxClients: plans.maxClients,
    maxInvoices: plans.maxInvoices,
  }).from(subscriptions)
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .where(eq(subscriptions.companyId, companyId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  if (!subscription || !['active', 'trial', 'cancelled'].includes(subscription.status)) {
    throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Un abonnement actif est requis pour cette opération.' });
  }
  const validUntil = subscription.status === 'trial' ? subscription.trialEndsAt : subscription.periodEnd;
  if (!validUntil || validUntil <= now) {
    throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'La période de votre abonnement est terminée.' });
  }

  const limit = resource === 'clients' ? subscription.maxClients : subscription.maxInvoices;
  if (limit == null || limit === 0) return;
  let used: number;
  if (resource === 'clients') {
    const [result] = await db.select({ count: count() }).from(clients).where(eq(clients.companyId, companyId));
    used = Number(result?.count ?? 0);
  } else {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [result] = await db.select({ count: count() }).from(businessDocuments).where(and(
      eq(businessDocuments.companyId, companyId),
      eq(businessDocuments.documentType, 'sales_invoice'),
      gte(businessDocuments.createdAt, monthStart),
    ));
    used = Number(result?.count ?? 0);
  }
  if (used >= limit) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: resource === 'clients'
        ? 'La limite de clients de votre forfait est atteinte. Passez à un forfait supérieur.'
        : 'La limite mensuelle de factures de votre forfait est atteinte. Passez à un forfait supérieur.',
    });
  }
}
