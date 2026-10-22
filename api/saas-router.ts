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
  assertCompanyBillingAccess,
  assertCompanyBillingManagementAccess,
  getCompanyAccessRole,
} from "./middleware";
import { getDb } from "./queries/connection";
import {
  plans,
  subscriptions,
  transactions,
  companies,
  companyProfiles,
  companyTaxRules,
  companyMemberships,
  companyAccessInvitations,
  users,
  clients,
  businessDocuments,
} from "@db/schema";
import { eq, desc, and, gte, lte, sql, count, sum, inArray, isNull } from "drizzle-orm";
import { getPaymentGateway } from "./payments/gateway";
import { OHADA_COUNTRY_CODES, OHADA_CURRENCY_CODES, OHADA_INDUSTRY_CODES, getOhadaCountry, getOhadaCountryDefaults, findOhadaCountry, type OhadaCountryCode, type OhadaCurrencyCode, type OhadaIndustryCode, type OhadaLocale } from "@/lib/ohada/countries";
import { SUBSCRIPTION_FEATURES, type SubscriptionFeatureKey } from "@/lib/subscription-features";
import { hasOverlappingTaxRulePeriod } from "@/lib/ohada/tax-rules";

type CompanyProfileValue = {
  companyId: number;
  countryCode: OhadaCountryCode;
  currencyCode: OhadaCurrencyCode;
  timezone: string;
  locale: OhadaLocale;
  fiscalYearStartMonth: number;
  fiscalYearStartDay: number;
  industryCode: OhadaIndustryCode;
  customIndustryName: string | null;
  accountingFramework: "SYSCOHADA_REVISED";
};
type TaxRuleType = "vat" | "withholding" | "excise" | "corporate_income" | "payroll_income" | "employee_social" | "employer_social" | "other";
type TaxRuleValue = { id: number; companyId: number; countryCode: string; code: string; name: string; taxType: TaxRuleType; rateBasisPoints: number; effectiveFrom: string; effectiveTo: string | null; isActive: boolean };
const designCompanyProfiles = new Map<number, CompanyProfileValue>();
const designCompanyTaxRules = new Map<number, TaxRuleValue[]>();

function paymentNotConfigured(): never {
  throw new TRPCError({
    code: "PRECONDITION_FAILED",
    message: "Les paiements en ligne ne sont pas encore configurés. Aucun montant n’a été débité.",
  });
}

function hashCompanyInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function isIsoDateOnly(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

async function assertCompanyUserQuota(companyId: number, options?: { excludeInviteId?: number }) {
  if (isDesignMode && companyId === designCompany.id) return;
  const db = getDb();
  const now = new Date();
  const [subscription] = await db.select({
    status: subscriptions.status,
    currentPeriodEnd: subscriptions.currentPeriodEnd,
    trialEndsAt: subscriptions.trialEndsAt,
    maxUsers: plans.maxUsers,
  }).from(subscriptions)
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .where(eq(subscriptions.companyId, companyId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);
  if (!subscription || !["active", "trial", "cancelled"].includes(subscription.status)) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Un abonnement actif est requis pour ajouter des utilisateurs." });
  }
  const validUntil = subscription.status === "trial" ? subscription.trialEndsAt : subscription.currentPeriodEnd;
  if (!validUntil || validUntil <= now) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "La période de l’abonnement est terminée. Renouvelez votre forfait avant d’ajouter des utilisateurs." });
  }
  if (subscription.maxUsers == null || subscription.maxUsers === 0) return;

  const [members] = await db.select({ count: count() }).from(companyMemberships).where(and(
    eq(companyMemberships.companyId, companyId),
    eq(companyMemberships.status, "active"),
  ));
  const invitations = await db.select({ id: companyAccessInvitations.id }).from(companyAccessInvitations).where(and(
    eq(companyAccessInvitations.companyId, companyId),
    isNull(companyAccessInvitations.claimedAt),
    gte(companyAccessInvitations.expiresAt, now),
  ));
  const reservedInvites = invitations.filter(({ id }) => id !== options?.excludeInviteId).length;
  if (Number(members?.count ?? 0) + reservedInvites >= subscription.maxUsers) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Le forfait autorise " + subscription.maxUsers + " utilisateur(s). Augmentez votre forfait ou libérez une place." });
  }
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
      countryCode: z.enum(OHADA_COUNTRY_CODES).optional(),
      industryCode: z.enum(OHADA_INDUSTRY_CODES).optional(),
      customIndustryName: z.string().max(120).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const country = input.countryCode
        ? getOhadaCountry(input.countryCode)
        : findOhadaCountry(input.country ?? "Cameroun");
      if (!country) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Sélectionnez l’un des 17 pays membres de l’OHADA." });
      }
      const db = getDb();
      const profileDefaults = {
        ...getOhadaCountryDefaults(country.code),
        industryCode: input.industryCode ?? "other",
        customIndustryName: input.industryCode === "other" ? input.customIndustryName?.trim() : null,
      };
      const company = await db.transaction(async (tx) => {
        const [created] = await tx.insert(companies).values({
          name: input.name,
          slug: input.slug,
          email: input.email,
          phone: input.phone,
          address: input.address,
          city: input.city,
          country: country.name,
          ownerUserId: ctx.user.id,
          status: "trial",
        }).$returningId();

        await tx.insert(companyMemberships).values({
          companyId: created.id,
          userId: ctx.user.id,
          role: "owner",
          status: "active",
        }).onDuplicateKeyUpdate({
          set: { role: "owner", status: "active", updatedAt: new Date() },
        });
        await tx.insert(companyProfiles).values({ companyId: created.id, ...profileDefaults });
        return created;
      });

      return { id: company.id, ...input, country: country.name, countryCode: country.code };
    }),

  profile: authedQuery
    .input(z.object({ companyId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      await assertCompanyAccess(ctx.user, input.companyId);
      if (isDesignMode && input.companyId === designCompany.id) {
        return designCompanyProfiles.get(input.companyId) ?? {
          companyId: input.companyId,
          ...getOhadaCountryDefaults("CM"),
        };
      }
      const db = getDb();
      const [stored] = await db.select().from(companyProfiles)
        .where(eq(companyProfiles.companyId, input.companyId)).limit(1);
      if (stored) return stored;

      const [company] = await db.select({ country: companies.country })
        .from(companies).where(eq(companies.id, input.companyId)).limit(1);
      const country = findOhadaCountry(company?.country) ?? getOhadaCountry("CM")!;
      return { companyId: input.companyId, ...getOhadaCountryDefaults(country.code) };
    }),

  updateProfile: authedQuery
    .input(z.object({
      companyId: z.number().int().positive(),
      countryCode: z.enum(OHADA_COUNTRY_CODES),
      currencyCode: z.enum(OHADA_CURRENCY_CODES),
      timezone: z.string().min(3).max(80),
      locale: z.enum(["fr-BJ", "fr-BF", "fr-CM", "fr-CF", "fr-KM", "fr-CG", "fr-CI", "fr-GA", "fr-GN", "pt-GW", "es-GQ", "fr-ML", "fr-NE", "fr-CD", "fr-SN", "fr-TD", "fr-TG"]),
      fiscalYearStartMonth: z.number().int().min(1).max(12),
      fiscalYearStartDay: z.number().int().min(1).max(31),
      industryCode: z.enum(OHADA_INDUSTRY_CODES),
      customIndustryName: z.string().max(120).optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertCompanyManagementAccess(ctx.user, input.companyId);
      const country = getOhadaCountry(input.countryCode)!;
      const maxDay = new Date(Date.UTC(2000, input.fiscalYearStartMonth, 0)).getUTCDate();
      try {
        new Intl.DateTimeFormat("fr-FR", { timeZone: input.timezone }).format(new Date());
      } catch {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Fuseau horaire IANA invalide." });
      }
      if (input.fiscalYearStartDay > maxDay) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Le jour de début d’exercice ne correspond pas au mois choisi." });
      }
      if (input.industryCode === "other" && !input.customIndustryName?.trim()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Précisez le secteur d’activité de l’entreprise." });
      }
      if (isDesignMode && input.companyId === designCompany.id) {
        const saved: CompanyProfileValue = { ...input, customIndustryName: input.industryCode === "other" ? input.customIndustryName?.trim() || null : null, accountingFramework: "SYSCOHADA_REVISED" };
        designCompanyProfiles.set(input.companyId, saved);
        return saved;
      }

      const db = getDb();
      const { companyId, ...profile } = input;
      await db.transaction(async (tx) => {
        // Keep country changes ordered with new tax-rule creation for this tenant.
        await tx.select({ id: companies.id }).from(companies)
          .where(eq(companies.id, companyId)).limit(1).for("update");
        await tx.insert(companyProfiles).values({
          companyId,
          ...profile,
          customIndustryName: profile.industryCode === "other" ? profile.customIndustryName?.trim() : null,
          accountingFramework: "SYSCOHADA_REVISED",
        }).onDuplicateKeyUpdate({
          set: {
            ...profile,
            customIndustryName: profile.industryCode === "other" ? profile.customIndustryName?.trim() : null,
            accountingFramework: "SYSCOHADA_REVISED",
            updatedAt: new Date(),
          },
        });
        await tx.update(companies).set({ country: country.name, updatedAt: new Date() })
          .where(eq(companies.id, companyId));
      });
      return { companyId, ...profile, countryName: country.name, accountingFramework: "SYSCOHADA_REVISED" };
    }),

  taxRules: authedQuery
    .input(z.object({ companyId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      await assertCompanyAccess(ctx.user, input.companyId);
      if (isDesignMode && input.companyId === designCompany.id) return designCompanyTaxRules.get(input.companyId) ?? [];
      return getDb().select().from(companyTaxRules)
        .where(eq(companyTaxRules.companyId, input.companyId))
        .orderBy(desc(companyTaxRules.effectiveFrom), companyTaxRules.name);
    }),

  createTaxRule: authedQuery
    .input(z.object({
      companyId: z.number().int().positive(),
      code: z.string().trim().min(2).max(40).regex(/^[A-Za-z0-9_-]+$/),
      name: z.string().trim().min(2).max(120),
      taxType: z.enum(["vat", "withholding", "excise", "corporate_income", "payroll_income", "employee_social", "employer_social", "other"]),
      ratePercent: z.number().finite().min(0).max(100),
      effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(isIsoDateOnly, "Date invalide."),
      effectiveTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(isIsoDateOnly, "Date invalide.").nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertCompanyManagementAccess(ctx.user, input.companyId);
      if (input.effectiveTo && input.effectiveTo < input.effectiveFrom) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "La fin d’application doit être postérieure au début." });
      }
      if (isDesignMode && input.companyId === designCompany.id) {
        const existingRules = designCompanyTaxRules.get(input.companyId) ?? [];
        if (hasOverlappingTaxRulePeriod(
          existingRules.filter((rule) => rule.taxType === input.taxType && rule.isActive),
          input,
        )) {
          throw new TRPCError({ code: "CONFLICT", message: "Une règle active de même type existe déjà sur cette période. Clôturez-la ou désactivez-la avant d’ajouter la nouvelle." });
        }
        const rule: TaxRuleValue = { companyId: input.companyId, code: input.code.toUpperCase(), name: input.name, taxType: input.taxType, id: Date.now(), rateBasisPoints: Math.round(input.ratePercent * 100), countryCode: String(designCompanyProfiles.get(input.companyId)?.countryCode ?? "CM"), effectiveFrom: input.effectiveFrom, effectiveTo: input.effectiveTo ?? null, isActive: true };
        designCompanyTaxRules.set(input.companyId, [...existingRules, rule]);
        return rule;
      }

      const db = getDb();
      return db.transaction(async (tx) => {
        // Serialize concurrent rule writes and country changes for this tenant.
        const [company] = await tx.select({ country: companies.country }).from(companies)
          .where(eq(companies.id, input.companyId)).limit(1).for("update");
        if (!company) throw new TRPCError({ code: "NOT_FOUND", message: "Entreprise introuvable." });
        const [profile] = await tx.select({ countryCode: companyProfiles.countryCode })
          .from(companyProfiles).where(eq(companyProfiles.companyId, input.companyId)).limit(1);
        const countryCode = profile?.countryCode ?? findOhadaCountry(company.country)?.code ?? "";
        if (!countryCode || !getOhadaCountry(countryCode)) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Configurez d’abord le pays OHADA de l’entreprise." });
        }
        const validatedCountryCode = countryCode as OhadaCountryCode;

        const existingRules = await tx.select({ effectiveFrom: companyTaxRules.effectiveFrom, effectiveTo: companyTaxRules.effectiveTo }).from(companyTaxRules).where(and(
          eq(companyTaxRules.companyId, input.companyId),
          eq(companyTaxRules.countryCode, validatedCountryCode),
          eq(companyTaxRules.taxType, input.taxType),
          eq(companyTaxRules.isActive, true),
        ));
        if (hasOverlappingTaxRulePeriod(existingRules, input)) {
          throw new TRPCError({ code: "CONFLICT", message: "Une règle active de même type existe déjà sur cette période. Clôturez-la ou désactivez-la avant d’ajouter la nouvelle." });
        }

        const [created] = await tx.insert(companyTaxRules).values({
          companyId: input.companyId,
          countryCode: validatedCountryCode,
          code: input.code.toUpperCase(),
          name: input.name,
          taxType: input.taxType,
          rateBasisPoints: Math.round(input.ratePercent * 100),
          effectiveFrom: input.effectiveFrom,
          effectiveTo: input.effectiveTo || null,
          createdByUserId: ctx.user.id,
        }).$returningId();
        return { ...input, id: created.id, countryCode: validatedCountryCode, rateBasisPoints: Math.round(input.ratePercent * 100), isActive: true };
      });
    }),

  archiveTaxRule: authedQuery
    .input(z.object({ companyId: z.number().int().positive(), taxRuleId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await assertCompanyManagementAccess(ctx.user, input.companyId);
      if (isDesignMode && input.companyId === designCompany.id) {
        designCompanyTaxRules.set(input.companyId, (designCompanyTaxRules.get(input.companyId) ?? []).map((rule) => rule.id === input.taxRuleId ? { ...rule, isActive: false } : rule));
        return { success: true };
      }
      const db = getDb();
      await db.update(companyTaxRules).set({ isActive: false, updatedAt: new Date() }).where(and(
        eq(companyTaxRules.id, input.taxRuleId),
        eq(companyTaxRules.companyId, input.companyId),
      ));
      return { success: true };
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

      const [existing] = await db.select({
        role: companyMemberships.role,
        status: companyMemberships.status,
      })
        .from(companyMemberships)
        .where(and(
          eq(companyMemberships.companyId, input.companyId),
          eq(companyMemberships.userId, input.userId),
        ))
        .limit(1);
      if (!existing || existing.status !== "active") {
        await assertCompanyUserQuota(input.companyId);
      }
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
      await assertCompanyUserQuota(input.companyId);
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

        if ((!existing || existing.status !== "active") && company.ownerUserId !== ctx.user.id) {
          await assertCompanyUserQuota(invite.companyId, { excludeInviteId: invite.id });
        }
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
      await assertCompanyBillingManagementAccess(ctx.user, input.companyId);
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
      await assertCompanyBillingAccess(ctx.user, input.companyId);
      const db = getDb();
      return db.select().from(subscriptions).where(eq(subscriptions.companyId, input.companyId)).orderBy(desc(subscriptions.createdAt));
    }),

  getActive: authedQuery
    .input(z.object({ companyId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertCompanyBillingAccess(ctx.user, input.companyId);
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
      await assertCompanyBillingManagementAccess(ctx.user, subscription.companyId);
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
      await assertCompanyBillingManagementAccess(ctx.user, sub.companyId);
      if (!getPaymentGateway()) paymentNotConfigured();
      paymentNotConfigured();
    }),

  reactivate: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.id, input.id)).limit(1);
      if (!subscription) throw new TRPCError({ code: "NOT_FOUND", message: "Abonnement introuvable" });
      await assertCompanyBillingManagementAccess(ctx.user, subscription.companyId);
      if (!getPaymentGateway()) paymentNotConfigured();
      paymentNotConfigured();
    }),

  startCheckout: authedQuery
    .input(z.object({
      companyId: z.number().int().positive(),
      planId: z.number().int().positive(),
      billingCycle: z.enum(["monthly", "yearly"]),
      paymentMethod: z.enum(["card", "mobile_money"]),
      paymentPhone: z.string().trim().min(6).max(32).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertCompanyBillingManagementAccess(ctx.user, input.companyId);
      const gateway = getPaymentGateway();
      if (!gateway) paymentNotConfigured();
      if (input.paymentMethod === "mobile_money" && !input.paymentPhone) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Saisissez le numéro Mobile Money à débiter." });
      }

      const db = getDb();
      const [plan] = await db.select().from(plans).where(and(
        eq(plans.id, input.planId),
        eq(plans.billingCycle, input.billingCycle),
        eq(plans.isActive, true),
      )).limit(1);
      if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Forfait ou cycle indisponible." });
      if (plan.isEnterprise || plan.priceXAF <= 0) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "L’offre Enterprise se souscrit sur devis." });
      }
      const [company] = await db.select().from(companies).where(eq(companies.id, input.companyId)).limit(1);
      if (!company) throw new TRPCError({ code: "NOT_FOUND", message: "Entreprise introuvable." });
      const [current] = await db.select().from(subscriptions)
        .where(eq(subscriptions.companyId, input.companyId))
        .orderBy(desc(subscriptions.createdAt))
        .limit(1);
      let amountXAF = plan.priceXAF;
      let replacesSubscriptionId: number | null = null;
      let preservePeriodEnd: Date | null = null;
      let type: "subscription" | "upgrade" = "subscription";
      if (current && ["active", "trial"].includes(current.status) && current.currentPeriodEnd > new Date()) {
        if (current.planId === plan.id && current.billingCycle === plan.billingCycle) {
          throw new TRPCError({ code: "CONFLICT", message: "Cette entreprise utilise déjà ce forfait." });
        }
        type = "upgrade";
        replacesSubscriptionId = current.id;
        if (current.status === "active" && current.billingCycle === plan.billingCycle) {
          if (plan.priceXAF < current.priceXAF) {
            throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Le passage vers un forfait inférieur doit être planifié à la prochaine échéance." });
          }
          if (plan.priceXAF > current.priceXAF) {
            const duration = current.currentPeriodEnd.getTime() - current.currentPeriodStart.getTime();
            const remaining = Math.max(0, current.currentPeriodEnd.getTime() - Date.now());
            amountXAF = duration > 0
              ? Math.ceil((plan.priceXAF - current.priceXAF) * Math.min(1, remaining / duration))
              : plan.priceXAF;
            preservePeriodEnd = current.currentPeriodEnd;
          }
        }
      }
      if (amountXAF < 100 || amountXAF % 5 !== 0) {
        amountXAF = Math.max(100, Math.ceil(amountXAF / 5) * 5);
      }

      const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL;
      if (!appUrl) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Configurez APP_URL pour démarrer le paiement." });
      let callbackUrl: string;
      let returnUrl: string;
      try {
        const origin = new URL(appUrl);
        if (process.env.NODE_ENV === "production" && origin.protocol !== "https:") throw new Error("HTTPS required");
        callbackUrl = new URL("/api/payments/webhook", origin).toString();
        returnUrl = new URL("/subscription?payment=pending", origin).toString();
      } catch {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "APP_URL doit être une URL valide en HTTPS." });
      }

      const now = new Date();
      const [createdSubscription] = await db.insert(subscriptions).values({
        companyId: input.companyId,
        planId: plan.id,
        status: "past_due",
        billingCycle: input.billingCycle,
        priceXAF: plan.priceXAF,
        startedAt: now,
        currentPeriodStart: now,
        currentPeriodEnd: now,
        autoRenew: false,
        paymentMethod: input.paymentMethod,
      }).$returningId();
      const [createdTransaction] = await db.insert(transactions).values({
        companyId: input.companyId,
        subscriptionId: createdSubscription.id,
        type,
        amountXAF,
        status: "pending",
        isVerified: false,
        paymentMethod: input.paymentMethod,
        description: JSON.stringify({
          planId: plan.id,
          planName: plan.name,
          billingCycle: input.billingCycle,
          fullPriceXAF: plan.priceXAF,
          replacesSubscriptionId,
          periodEndAt: preservePeriodEnd?.toISOString() ?? null,
        }),
      }).$returningId();

      const internalReference = "IDIBAGES-TX-" + createdTransaction.id;
      try {
        const checkout = await gateway.startPayment({
          internalReference,
          amountXAF,
          currency: "XAF",
          method: input.paymentMethod,
          phone: input.paymentPhone,
          customerEmail: company.email ?? ctx.user.email ?? undefined,
          callbackUrl,
          returnUrl,
        });
        await db.update(transactions).set({
          paymentProvider: gateway.name,
          providerTransactionId: checkout.providerReference,
        }).where(eq(transactions.id, createdTransaction.id));
        return { transactionId: createdTransaction.id, checkoutUrl: checkout.checkoutUrl ?? null, amountXAF, currency: "XAF" as const };
      } catch (error) {
        await db.transaction(async (tx) => {
          await tx.update(transactions).set({ status: "failed", paymentProvider: gateway.name })
            .where(and(eq(transactions.id, createdTransaction.id), eq(transactions.status, "pending")));
          await tx.update(subscriptions).set({ status: "expired" })
            .where(and(eq(subscriptions.id, createdSubscription.id), eq(subscriptions.status, "past_due")));
        });
        console.error("[subscriptions] Checkout session could not be started", error);
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Le prestataire n’a pas pu démarrer le paiement. L’abonnement n’a pas été activé." });
      }
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
      await assertCompanyBillingManagementAccess(ctx.user, input.companyId);
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
      const company = await assertCompanyBillingAccess(ctx.user, input.companyId);
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
      const subscriptionUntil = sub?.status === "trial" ? sub.trialEndsAt : sub?.currentPeriodEnd;
      const hasEntitlementPeriod = Boolean(
        sub && ["active", "trial", "cancelled"].includes(sub.status) &&
        subscriptionUntil && subscriptionUntil > new Date(),
      );

      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const [memberUsage] = await db.select({ count: count() }).from(companyMemberships)
        .where(and(eq(companyMemberships.companyId, input.companyId), eq(companyMemberships.status, "active")));
      const [clientUsage] = await db.select({ count: count() }).from(clients)
        .where(eq(clients.companyId, input.companyId));
      const [invoiceUsage] = await db.select({ count: count() }).from(businessDocuments)
        .where(and(
          eq(businessDocuments.companyId, input.companyId),
          eq(businessDocuments.documentType, "sales_invoice"),
          gte(businessDocuments.createdAt, monthStart),
        ));

      return {
        subscription: sub ?? null,
        plan: currentPlan && (!hasEntitlementPeriod || company.status === "suspended" || company.status === "cancelled")
          ? { ...currentPlan, moduleAccess: "[]" }
          : currentPlan,
        usage: {
          users: Number(memberUsage?.count ?? 0),
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
    const expiringActive = await db.select({ companyId: subscriptions.companyId }).from(subscriptions).where(and(
      eq(subscriptions.status, "active"), lte(subscriptions.currentPeriodEnd, now),
    ));
    const expiringTrials = await db.select({ companyId: subscriptions.companyId }).from(subscriptions).where(and(
      eq(subscriptions.status, "trial"), lte(subscriptions.trialEndsAt, now),
    ));
    await db.update(subscriptions)
      .set({ status: "expired" })
      .where(and(
        eq(subscriptions.status, "active"),
        lte(subscriptions.currentPeriodEnd, now)
      ));
    await db.update(subscriptions)
      .set({ status: "expired" })
      .where(and(eq(subscriptions.status, "trial"), lte(subscriptions.trialEndsAt, now)));
    const companyIds = [...new Set([...expiringActive, ...expiringTrials].map((row) => row.companyId))];
    for (const companyId of companyIds) {
      const [validActiveSubscription] = await db.select({ id: subscriptions.id }).from(subscriptions).where(and(
        eq(subscriptions.companyId, companyId), eq(subscriptions.status, "active"), gte(subscriptions.currentPeriodEnd, now),
      )).limit(1);
      const [validTrial] = await db.select({ id: subscriptions.id }).from(subscriptions).where(and(
        eq(subscriptions.companyId, companyId), eq(subscriptions.status, "trial"), gte(subscriptions.trialEndsAt, now),
      )).limit(1);
      if (!validActiveSubscription && !validTrial) await db.update(companies).set({ status: "suspended" }).where(eq(companies.id, companyId));
    }
    return { success: true, companiesChecked: companyIds.length };
  }),
});

// ============================================
// TRANSACTION ROUTER — Paiements
// ============================================

export const transactionRouter = createRouter({
  listByCompany: authedQuery
    .input(z.object({ companyId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertCompanyBillingAccess(ctx.user, input.companyId);
      const db = getDb();
      return db.select().from(transactions).where(eq(transactions.companyId, input.companyId)).orderBy(desc(transactions.createdAt));
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const rows = await db.select().from(transactions).where(eq(transactions.id, input.id)).limit(1);
      if (rows[0]) await assertCompanyBillingAccess(ctx.user, rows[0].companyId);
      return rows[0] ?? null;
    }),
});

// ============================================
// ADMIN ROUTER — Super Admin Dashboard
// ============================================

export const adminRouter = createRouter({
  listPlans: adminQuery.query(async () => {
    const db = getDb();
    return db.select().from(plans).orderBy(plans.slug, plans.billingCycle);
  }),

  savePlan: adminQuery
    .input(z.object({
      id: z.number().int().positive().optional(),
      slug: z.string().trim().min(2).max(50).regex(/^[a-z0-9-]+$/),
      name: z.string().trim().min(2).max(100),
      description: z.string().trim().max(2000).nullable().optional(),
      billingCycle: z.enum(["monthly", "yearly"]),
      priceXAF: z.number().int().min(0).max(2_000_000_000),
      originalPriceXAF: z.number().int().min(0).max(2_000_000_000).nullable().optional(),
      maxUsers: z.number().int().min(0).max(1_000_000),
      maxClients: z.number().int().min(0).max(10_000_000),
      maxInvoices: z.number().int().min(0).max(10_000_000),
      maxProjects: z.number().int().min(0).max(1_000_000),
      features: z.array(z.string().trim().min(1).max(240)).max(100),
      moduleAccess: z.array(z.enum(SUBSCRIPTION_FEATURES.map(({ key }) => key) as [SubscriptionFeatureKey, ...SubscriptionFeatureKey[]])).max(SUBSCRIPTION_FEATURES.length),
      supportLevel: z.enum(["email", "priority", "dedicated"]),
      isPopular: z.boolean(),
      isEnterprise: z.boolean(),
      trialDays: z.number().int().min(0).max(90),
      isActive: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      if (input.isEnterprise && input.priceXAF !== 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Une offre Enterprise sur devis doit garder un prix nul dans le catalogue." });
      }
      const db = getDb();
      const { id, features, moduleAccess, ...fields } = input;
      const values = { ...fields, features: JSON.stringify(features), moduleAccess: JSON.stringify(moduleAccess) };
      if (id) {
        const [existing] = await db.select({ id: plans.id }).from(plans).where(eq(plans.id, id)).limit(1);
        if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Forfait introuvable." });
        await db.update(plans).set(values).where(eq(plans.id, id));
        return { id, updated: true };
      }
      const [created] = await db.insert(plans).values(values).$returningId();
      return { id: created.id, created: true };
    }),

  setPlanActive: adminQuery
    .input(z.object({ id: z.number().int().positive(), isActive: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [existing] = await db.select({ id: plans.id }).from(plans).where(eq(plans.id, input.id)).limit(1);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Forfait introuvable." });
      await db.update(plans).set({ isActive: input.isActive }).where(eq(plans.id, input.id));
      return { success: true };
    }),

  stats: adminQuery.query(async () => {
    const db = getDb();
    const [companiesCount] = await db.select({ count: count() }).from(companies);
    const [subsCount] = await db.select({ count: count() }).from(subscriptions);
    const [activeSubs] = await db.select({ count: count() }).from(subscriptions).where(eq(subscriptions.status, "active"));
    const [trialSubs] = await db.select({ count: count() }).from(subscriptions).where(eq(subscriptions.status, "trial"));
    const [totalRevenue] = await db.select({ total: sum(transactions.amountXAF) }).from(transactions).where(and(
      eq(transactions.status, "completed"),
      eq(transactions.isVerified, true),
    ));
    const [pendingRevenue] = await db.select({ total: sum(transactions.amountXAF) }).from(transactions).where(eq(transactions.status, "pending"));
    const [mrr] = await db.select({ total: sum(subscriptions.priceXAF) }).from(subscriptions).where(and(
      eq(subscriptions.status, "active"), eq(subscriptions.billingCycle, "monthly"),
    ));
    const [arrMrr] = await db.select({ total: sum(subscriptions.priceXAF) }).from(subscriptions).where(and(
      eq(subscriptions.status, "active"), eq(subscriptions.billingCycle, "yearly"),
    ));

    return {
      companies: Number(companiesCount?.count ?? 0),
      subscriptions: Number(subsCount?.count ?? 0),
      activeSubscriptions: Number(activeSubs?.count ?? 0),
      trialSubscriptions: Number(trialSubs?.count ?? 0),
      totalRevenueXAF: Number(totalRevenue?.total ?? 0),
      pendingRevenueXAF: Number(pendingRevenue?.total ?? 0),
      mrr: Number(mrr?.total ?? 0) + Math.round(Number(arrMrr?.total ?? 0) / 12),
    };
  }),

  allTransactions: adminQuery.query(async () => {
    const db = getDb();
    const rows = await db.select({
      id: transactions.id,
      companyId: transactions.companyId,
      subscriptionId: transactions.subscriptionId,
      type: transactions.type,
      amountXAF: transactions.amountXAF,
      status: transactions.status,
      isVerified: transactions.isVerified,
      paymentMethod: transactions.paymentMethod,
      paymentProvider: transactions.paymentProvider,
      providerTransactionId: transactions.providerTransactionId,
      description: transactions.description,
      paidAt: transactions.paidAt,
      createdAt: transactions.createdAt,
      companyName: companies.name,
      planName: plans.name,
    }).from(transactions)
      .leftJoin(companies, eq(transactions.companyId, companies.id))
      .leftJoin(subscriptions, eq(transactions.subscriptionId, subscriptions.id))
      .leftJoin(plans, eq(subscriptions.planId, plans.id))
      .orderBy(desc(transactions.createdAt));
    return rows;
  }),

  allSubscriptions: adminQuery.query(async () => {
    const db = getDb();
    return db.select({
      id: subscriptions.id,
      companyId: subscriptions.companyId,
      planId: subscriptions.planId,
      status: subscriptions.status,
      billingCycle: subscriptions.billingCycle,
      priceXAF: subscriptions.priceXAF,
      startedAt: subscriptions.startedAt,
      trialEndsAt: subscriptions.trialEndsAt,
      currentPeriodStart: subscriptions.currentPeriodStart,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      cancelledAt: subscriptions.cancelledAt,
      cancelReason: subscriptions.cancelReason,
      autoRenew: subscriptions.autoRenew,
      paymentMethod: subscriptions.paymentMethod,
      createdAt: subscriptions.createdAt,
      companyName: companies.name,
      planName: plans.name,
    }).from(subscriptions)
      .innerJoin(companies, eq(subscriptions.companyId, companies.id))
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .orderBy(desc(subscriptions.createdAt));
  }),

  allCompanies: adminQuery.query(async () => {
    const db = getDb();
    const rows = await db.select({
      id: companies.id,
      name: companies.name,
      slug: companies.slug,
      email: companies.email,
      phone: companies.phone,
      country: companies.country,
      status: companies.status,
      createdAt: companies.createdAt,
      subscriptionCount: count(subscriptions.id),
    }).from(companies)
      .leftJoin(subscriptions, eq(companies.id, subscriptions.companyId))
      .groupBy(companies.id)
      .orderBy(desc(companies.createdAt));
    return rows.map((company) => ({ ...company, subscriptionCount: Number(company.subscriptionCount) }));
  }),

  setCompanyStatus: adminQuery
    .input(z.object({ id: z.number().int().positive(), status: z.enum(["active", "suspended", "cancelled", "trial"]) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [existing] = await db.select({ id: companies.id }).from(companies).where(eq(companies.id, input.id)).limit(1);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Entreprise introuvable." });
      if (input.status === "active" || input.status === "trial") {
        const now = new Date();
        const [validActive] = await db.select({ id: subscriptions.id }).from(subscriptions).where(and(
          eq(subscriptions.companyId, input.id), eq(subscriptions.status, "active"), gte(subscriptions.currentPeriodEnd, now),
        )).limit(1);
        const [validTrial] = await db.select({ id: subscriptions.id }).from(subscriptions).where(and(
          eq(subscriptions.companyId, input.id), eq(subscriptions.status, "trial"), gte(subscriptions.trialEndsAt, now),
        )).limit(1);
        if (!validActive && !validTrial) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Un abonnement actif ou en essai valide est requis pour rétablir l’accès." });
        }
      }
      await db.update(companies).set({ status: input.status }).where(eq(companies.id, input.id));
      return { success: true };
    }),

  cancelSubscription: adminQuery
    .input(z.object({ id: z.number().int().positive(), reason: z.string().trim().min(3).max(500) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [existing] = await db.select({ id: subscriptions.id, companyId: subscriptions.companyId, status: subscriptions.status }).from(subscriptions)
        .where(eq(subscriptions.id, input.id)).limit(1);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Abonnement introuvable." });
      if (existing.status === "cancelled" || existing.status === "expired") {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Cet abonnement est déjà terminé." });
      }
      await db.update(subscriptions).set({ status: "cancelled", autoRenew: false, cancelledAt: new Date(), cancelReason: input.reason })
        .where(eq(subscriptions.id, input.id));
      const [remainingAccess] = await db.select({ count: count() }).from(subscriptions).where(and(
        eq(subscriptions.companyId, existing.companyId),
        inArray(subscriptions.status, ["active", "trial"]),
        gte(subscriptions.currentPeriodEnd, new Date()),
      ));
      if (Number(remainingAccess?.count ?? 0) === 0) {
        await db.update(companies).set({ status: "cancelled" }).where(eq(companies.id, existing.companyId));
      }
      return { success: true };
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
