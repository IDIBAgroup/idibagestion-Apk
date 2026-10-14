import { designCompany, designPlans, isDesignMode } from "./design-mode";
import { z } from "zod";
import { createHash, randomBytes } from "node:crypto";
import { TRPCError } from "@trpc/server";
import {
  createRouter,
  publicQuery,
  adminQuery,
  authedQuery,
  assertCompanyAccess,
  assertCompanyManagementAccess,
  getCompanyAccessRole,
} from "./middleware";
import { getDb } from "./queries/connection";
import {
  plans,
  subscriptions,
  transactions,
  companies,
  companyMemberships,
  companyAccessInvitations,
  users,
  invoices,
  clients,
} from "@db/schema";
import { eq, desc, and, gte, lte, sql, count, sum, inArray, isNull } from "drizzle-orm";
import { getPaymentGateway } from "./payments/gateway";

function paymentNotConfigured(): never {
  throw new TRPCError({
    code: "PRECONDITION_FAILED",
    message: "Les paiements en ligne ne sont pas encore configurés. Aucun montant n’a été débité.",
  });
}

function hashCompanyInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

// ============================================
// PLAN ROUTER — Forfaits d'abonnement
// ============================================

export const planRouter = createRouter({
  list: publicQuery.query(async () => {
    if (isDesignMode) return designPlans;
    const db = getDb();
    return db.select().from(plans).where(eq(plans.isActive, true)).orderBy(plans.billingCycle, plans.priceXAF);
  }),

  getBySlug: publicQuery
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db.select().from(plans).where(eq(plans.slug, input.slug)).limit(1);
      return rows[0] ?? null;
    }),
});

// ============================================
// COMPANY ROUTER — Tenants / Entreprises
// ============================================

export const companyRouter = createRouter({
  create: authedQuery
    .input(z.object({
      name: z.string().min(2),
      slug: z.string().min(2),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      country: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [company] = await db.insert(companies).values({
        ...input,
        ownerUserId: ctx.user.id,
        status: "trial",
      }).$returningId();

      await db.insert(companyMemberships).values({
        companyId: company.id,
        userId: ctx.user.id,
        role: "owner",
        status: "active",
      }).onDuplicateKeyUpdate({
        set: { role: "owner", status: "active", updatedAt: new Date() },
      });

      return { id: company.id, ...input };
    }),

  mine: authedQuery.query(async ({ ctx }) => {
    if (isDesignMode) return [designCompany];
    const db = getDb();
    const [ownedCompanies, memberships] = await Promise.all([
      db.select({ id: companies.id }).from(companies).where(eq(companies.ownerUserId, ctx.user.id)),
      db.select({ companyId: companyMemberships.companyId })
        .from(companyMemberships)
        .where(and(
          eq(companyMemberships.userId, ctx.user.id),
          eq(companyMemberships.status, "active"),
        )),
    ]);
    const companyIds = [...new Set([
      ...ownedCompanies.map(({ id }) => id),
      ...memberships.map(({ companyId }) => companyId),
    ])];
    if (companyIds.length === 0) return [];
    return db.select().from(companies).where(inArray(companies.id, companyIds));
  }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const rows = await db.select().from(companies).where(eq(companies.id, input.id)).limit(1);
      if (rows[0]) await assertCompanyAccess(ctx.user, rows[0].id);
      return rows[0] ?? null;
    }),

  accessRole: authedQuery
    .input(z.object({ companyId: z.number().int().positive() }))
    .query(({ ctx, input }) => getCompanyAccessRole(ctx.user, input.companyId)),

  listMembers: authedQuery
    .input(z.object({ companyId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      await assertCompanyManagementAccess(ctx.user, input.companyId);
      const db = getDb();
      return db.select({
        userId: users.id,
        name: users.name,
        email: users.email,
        role: companyMemberships.role,
        status: companyMemberships.status,
        createdAt: companyMemberships.createdAt,
      })
        .from(companyMemberships)
        .innerJoin(users, eq(companyMemberships.userId, users.id))
        .where(eq(companyMemberships.companyId, input.companyId));
    }),

  grantAccess: authedQuery
    .input(z.object({
      companyId: z.number().int().positive(),
      userId: z.number().int().positive(),
      role: z.enum(["admin", "manager", "member"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const actor = await assertCompanyManagementAccess(ctx.user, input.companyId);
      if (input.role === "admin" && actor.role !== "owner" && actor.role !== "platform_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Seul le propriétaire peut désigner un administrateur." });
      }

      const db = getDb();
      const [targetUser] = await db.select({ id: users.id })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);
      if (!targetUser) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Utilisateur introuvable" });
      }

      const [existing] = await db.select({ role: companyMemberships.role })
        .from(companyMemberships)
        .where(and(
          eq(companyMemberships.companyId, input.companyId),
          eq(companyMemberships.userId, input.userId),
        ))
        .limit(1);
      if (existing?.role === "owner") {
        throw new TRPCError({ code: "CONFLICT", message: "Le propriétaire ne peut pas être remplacé par cette opération." });
      }
      if (existing?.role === "admin" && actor.role !== "owner" && actor.role !== "platform_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Seul le propriétaire peut modifier un autre administrateur." });
      }

      await db.insert(companyMemberships).values({
        companyId: input.companyId,
        userId: input.userId,
        role: input.role,
        status: "active",
      }).onDuplicateKeyUpdate({
        set: { role: input.role, status: "active", updatedAt: new Date() },
      });
      return { success: true };
    }),

  revokeAccess: authedQuery
    .input(z.object({
      companyId: z.number().int().positive(),
      userId: z.number().int().positive(),
    }))
    .mutation(async ({ ctx, input }) => {
      const actor = await assertCompanyManagementAccess(ctx.user, input.companyId);
      const db = getDb();
      const [target] = await db.select({ role: companyMemberships.role })
        .from(companyMemberships)
        .where(and(
          eq(companyMemberships.companyId, input.companyId),
          eq(companyMemberships.userId, input.userId),
          eq(companyMemberships.status, "active"),
        ))
        .limit(1);
      if (!target) return { success: true };
      if (target.role === "owner") {
        throw new TRPCError({ code: "CONFLICT", message: "Le propriétaire principal ne peut pas être retiré." });
      }
      if (target.role === "admin" && actor.role !== "owner" && actor.role !== "platform_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Seul le propriétaire peut retirer un administrateur." });
      }

      await db.update(companyMemberships)
        .set({ status: "revoked", updatedAt: new Date() })
        .where(and(
          eq(companyMemberships.companyId, input.companyId),
          eq(companyMemberships.userId, input.userId),
          eq(companyMemberships.status, "active"),
        ));
      return { success: true };
    }),

  createInvite: authedQuery
    .input(z.object({
      companyId: z.number().int().positive(),
      role: z.enum(["admin", "manager", "member"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const actor = await assertCompanyManagementAccess(ctx.user, input.companyId);
      if (input.role === "admin" && actor.role !== "owner" && actor.role !== "platform_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Seul le propriétaire peut inviter un administrateur." });
      }

      const db = getDb();
      const token = randomBytes(32).toString("base64url");
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      await db.insert(companyAccessInvitations).values({
        companyId: input.companyId,
        role: input.role,
        tokenHash: hashCompanyInviteToken(token),
        expiresAt,
        createdByUserId: ctx.user.id,
      });
      return {
        invitePath: "/join-company#invite=" + token,
        expiresInDays: 7,
      };
    }),

  acceptInvite: authedQuery
    .input(z.object({ token: z.string().min(32).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const now = new Date();

      await db.transaction(async (tx) => {
        const [invite] = await tx.select()
          .from(companyAccessInvitations)
          .where(and(
            eq(companyAccessInvitations.tokenHash, hashCompanyInviteToken(input.token)),
            gte(companyAccessInvitations.expiresAt, now),
            isNull(companyAccessInvitations.claimedAt),
          ))
          .limit(1)
          .for("update");
        if (!invite) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Invitation invalide ou expirée." });
        }

        const [company] = await tx.select()
          .from(companies)
          .where(eq(companies.id, invite.companyId))
          .limit(1)
          .for("update");
        if (!company || (company.status !== "active" && company.status !== "trial")) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Cette entreprise n’accepte pas de nouveaux membres." });
        }

        const [existing] = await tx.select({
          role: companyMemberships.role,
          status: companyMemberships.status,
        })
          .from(companyMemberships)
          .where(and(
            eq(companyMemberships.companyId, invite.companyId),
            eq(companyMemberships.userId, ctx.user.id),
          ))
          .limit(1);

        if (!existing && company.ownerUserId !== ctx.user.id) {
          await tx.insert(companyMemberships).values({
            companyId: invite.companyId,
            userId: ctx.user.id,
            role: invite.role,
            status: "active",
          });
        } else if (existing && existing.status !== "active") {
          const role = existing.role === "owner" ? "owner" : invite.role;
          await tx.update(companyMemberships)
            .set({ role, status: "active", updatedAt: now })
            .where(and(
              eq(companyMemberships.companyId, invite.companyId),
              eq(companyMemberships.userId, ctx.user.id),
            ));
        }

        await tx.update(companyAccessInvitations)
          .set({ claimedAt: now })
          .where(eq(companyAccessInvitations.id, invite.id));
      });

      return { success: true };
    }),
});

// ============================================
// SUBSCRIPTION ROUTER — Abonnements
// ============================================

export const subscriptionRouter = createRouter({
  create: authedQuery
    .input(z.object({
      companyId: z.number(),
      planId: z.number(),
      billingCycle: z.enum(["monthly", "yearly"]),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertCompanyAccess(ctx.user, input.companyId);
      const db = getDb();
      const planRows = await db.select().from(plans).where(and(
        eq(plans.id, input.planId),
        eq(plans.isActive, true),
      )).limit(1);
      const plan = planRows[0];
      if (!plan || plan.billingCycle !== input.billingCycle) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Forfait introuvable" });
      }
      const trialDays = plan.trialDays ?? 0;
      if (trialDays <= 0) paymentNotConfigured();

      const existing = await db.select({ id: subscriptions.id }).from(subscriptions)
        .where(eq(subscriptions.companyId, input.companyId)).limit(1);
      if (existing.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "Une période d’essai existe déjà pour cette entreprise." });
      }

      const now = new Date();
      const trialEnds = new Date(now);
      trialEnds.setDate(trialEnds.getDate() + trialDays);
      const periodEnd = new Date(now);
      if (input.billingCycle === "yearly") {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      const [sub] = await db.insert(subscriptions).values({
        companyId: input.companyId,
        planId: input.planId,
        status: "trial",
        billingCycle: input.billingCycle,
        priceXAF: plan.priceXAF,
        startedAt: now,
        trialEndsAt: trialEnds,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        autoRenew: false,
        nextPaymentAt: periodEnd,
      }).$returningId();

      return { id: sub.id, status: "trial" as const, trialEndsAt: trialEnds };
    }),

  listByCompany: authedQuery
    .input(z.object({ companyId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertCompanyAccess(ctx.user, input.companyId);
      const db = getDb();
      return db.select().from(subscriptions).where(eq(subscriptions.companyId, input.companyId)).orderBy(desc(subscriptions.createdAt));
    }),

  getActive: authedQuery
    .input(z.object({ companyId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertCompanyAccess(ctx.user, input.companyId);
      const db = getDb();
      const rows = await db.select().from(subscriptions)
        .where(and(
          eq(subscriptions.companyId, input.companyId),
          eq(subscriptions.status, "active")
        ))
        .orderBy(desc(subscriptions.createdAt))
        .limit(1);
      return rows[0] ?? null;
    }),

  cancel: authedQuery
    .input(z.object({ id: z.number(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.id, input.id)).limit(1);
      if (!subscription) throw new TRPCError({ code: "NOT_FOUND", message: "Abonnement introuvable" });
      await assertCompanyAccess(ctx.user, subscription.companyId);
      await db.update(subscriptions)
        .set({ status: "cancelled", cancelledAt: new Date(), cancelReason: input.reason, autoRenew: false })
        .where(eq(subscriptions.id, input.id));
      return { success: true };
    }),

  renew: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const rows = await db.select().from(subscriptions).where(eq(subscriptions.id, input.id)).limit(1);
      const sub = rows[0];
      if (!sub) throw new TRPCError({ code: "NOT_FOUND", message: "Abonnement introuvable" });
      await assertCompanyAccess(ctx.user, sub.companyId);
      if (!getPaymentGateway()) paymentNotConfigured();
      paymentNotConfigured();
    }),

  reactivate: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.id, input.id)).limit(1);
      if (!subscription) throw new TRPCError({ code: "NOT_FOUND", message: "Abonnement introuvable" });
      await assertCompanyAccess(ctx.user, subscription.companyId);
      if (!getPaymentGateway()) paymentNotConfigured();
      paymentNotConfigured();
    }),

  changePlan: authedQuery
    .input(z.object({
      companyId: z.number(),
      newPlanId: z.number(),
      billingCycle: z.enum(["monthly", "yearly"]),
      paymentMethod: z.enum(["card", "mobile_money", "bank_transfer", "cash"]),
      paymentPhone: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertCompanyAccess(ctx.user, input.companyId);
      const gateway = getPaymentGateway();
      if (!gateway) paymentNotConfigured();
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Le fournisseur est détecté, mais le flux de paiement vérifié n’est pas encore raccordé.",
      });
    }),
  getUsage: authedQuery
    .input(z.object({ companyId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertCompanyAccess(ctx.user, input.companyId);
      const db = getDb();
      const activeSubs = await db.select().from(subscriptions)
        .where(eq(subscriptions.companyId, input.companyId))
        .orderBy(desc(subscriptions.createdAt))
        .limit(1);

      const sub = activeSubs[0];
      let currentPlan: typeof plans.$inferSelect | null = null;
      if (sub) {
        const planRows = await db.select().from(plans).where(eq(plans.id, sub.planId)).limit(1);
        currentPlan = planRows[0] ?? null;
      }

      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const [clientUsage] = await db.select({ count: count() }).from(clients)
        .where(eq(clients.companyId, input.companyId));
      const [invoiceUsage] = await db.select({ count: count() }).from(invoices)
        .where(and(eq(invoices.companyId, input.companyId), gte(invoices.createdAt, monthStart)));

      return {
        subscription: sub ?? null,
        plan: currentPlan,
        usage: {
          users: 1,
          clients: Number(clientUsage?.count ?? 0),
          invoicesThisMonth: Number(invoiceUsage?.count ?? 0),
          projects: 0,
        }
      };
    }),

  // Check and update expired subscriptions (called by cron or admin)
  checkExpired: adminQuery.mutation(async () => {
    const db = getDb();
    const now = new Date();
    await db.update(subscriptions)
      .set({ status: "expired" })
      .where(and(
        eq(subscriptions.status, "active"),
        lte(subscriptions.currentPeriodEnd, now)
      ));
    return { success: true };
  }),
});

// ============================================
// TRANSACTION ROUTER — Paiements
// ============================================

export const transactionRouter = createRouter({
  listByCompany: authedQuery
    .input(z.object({ companyId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertCompanyAccess(ctx.user, input.companyId);
      const db = getDb();
      return db.select().from(transactions).where(eq(transactions.companyId, input.companyId)).orderBy(desc(transactions.createdAt));
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const rows = await db.select().from(transactions).where(eq(transactions.id, input.id)).limit(1);
      if (rows[0]) await assertCompanyAccess(ctx.user, rows[0].companyId);
      return rows[0] ?? null;
    }),
});

// ============================================
// ADMIN ROUTER — Super Admin Dashboard
// ============================================

export const adminRouter = createRouter({
  stats: adminQuery.query(async () => {
    const db = getDb();
    const [companiesCount] = await db.select({ count: count() }).from(companies);
    const [subsCount] = await db.select({ count: count() }).from(subscriptions);
    const [activeSubs] = await db.select({ count: count() }).from(subscriptions).where(eq(subscriptions.status, "active"));
    const [totalRevenue] = await db.select({ total: sum(transactions.amountXAF) }).from(transactions).where(and(
      eq(transactions.status, "completed"),
      eq(transactions.isVerified, true),
    ));
    const [pendingRevenue] = await db.select({ total: sum(transactions.amountXAF) }).from(transactions).where(eq(transactions.status, "pending"));

    return {
      companies: companiesCount?.count ?? 0,
      subscriptions: subsCount?.count ?? 0,
      activeSubscriptions: activeSubs?.count ?? 0,
      totalRevenueXAF: Number(totalRevenue?.total ?? 0),
      pendingRevenueXAF: Number(pendingRevenue?.total ?? 0),
    };
  }),

  allTransactions: adminQuery.query(async () => {
    const db = getDb();
    return db.select().from(transactions).orderBy(desc(transactions.createdAt));
  }),

  allSubscriptions: adminQuery.query(async () => {
    const db = getDb();
    return db.select().from(subscriptions).orderBy(desc(subscriptions.createdAt));
  }),

  allCompanies: adminQuery.query(async () => {
    const db = getDb();
    return db.select().from(companies).orderBy(desc(companies.createdAt));
  }),

  revenueByMonth: adminQuery.query(async () => {
    const db = getDb();
    // Group by month using raw SQL for simplicity
    const result = await db.execute(sql`
      SELECT 
        DATE_FORMAT(createdAt, '%Y-%m') as month,
        SUM(amountXAF) as revenue,
        COUNT(*) as count
      FROM transactions
      WHERE status = 'completed' AND isVerified = TRUE
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `);
    return result[0] as unknown as Array<{ month: string; revenue: number; count: number }>;
  }),
});
