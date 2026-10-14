import { z } from "zod";
import { createHash, randomBytes } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery, adminQuery, authedQuery, assertPartnerAccess, getCurrentPartner } from "./middleware";
import { getDb } from "./queries/connection";
import {
  partners, partnerLevels, partnerProspects, partnerOpportunities,
  partnerCommissions, partnerNotifications, partnerAccountInvitations
} from "@db/schema";
import { eq, desc, and, gte, lte, count, sum, like, or, sql, isNull, ne } from "drizzle-orm";

function generateLeadId() {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 900000 + 100000);
  return `IDIBA-LEAD-${year}-${random}`;
}

function hashInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function issuePartnerInvite(
  db: ReturnType<typeof getDb>,
  partnerId: number,
  createdByUserId: number,
) {
  const now = new Date();
  const token = randomBytes(32).toString("base64url");

  await db.update(partnerAccountInvitations)
    .set({ expiresAt: now })
    .where(and(
      eq(partnerAccountInvitations.partnerId, partnerId),
      isNull(partnerAccountInvitations.claimedAt),
      gte(partnerAccountInvitations.expiresAt, now),
    ));

  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  await db.insert(partnerAccountInvitations).values({
    partnerId,
    tokenHash: hashInviteToken(token),
    expiresAt,
    createdByUserId,
  });

  return token;
}

export const partnerRouter = createRouter({
  // === PARTNER LEVELS ===
  listLevels: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(partnerLevels).orderBy(partnerLevels.minRevenueXAF);
  }),

  // === PARTNERS ===
  createPartner: authedQuery
    .input(z.object({
      firstName: z.string().min(2),
      lastName: z.string().min(2),
      email: z.string().email(),
      phone: z.string().optional(),
      whatsapp: z.string().optional(),
      city: z.string().optional(),
      companyName: z.string().optional(),
      jobTitle: z.string().optional(),
      levelId: z.number(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Seuls les administrateurs peuvent créer des comptes partenaires." });
      }
      const db = getDb();
      const existing = await db.select({ id: partners.id }).from(partners)
        .where(sql`LOWER(${partners.email}) = ${input.email.toLowerCase()}`).limit(1);
      if (existing.length) {
        throw new TRPCError({ code: "CONFLICT", message: "Un compte partenaire utilise deja cette adresse e-mail." });
      }
      const code = `PTN-${Date.now().toString(36).toUpperCase()}`;
      const [partner] = await db.insert(partners).values({
        ...input,
        code,
        partnershipDate: new Date(),
        status: 'active',
      }).$returningId();
      const inviteToken = await issuePartnerInvite(db, partner.id, ctx.user.id);
      return {
        id: partner.id,
        code,
        inviteToken,
        invitePath: "/portal/partner#invite=" + inviteToken,
      };
    }),

  createAccountInvite: adminQuery
    .input(z.object({ partnerId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [partner] = await db.select({ id: partners.id, userId: partners.userId })
        .from(partners)
        .where(eq(partners.id, input.partnerId))
        .limit(1);
      if (!partner) throw new TRPCError({ code: "NOT_FOUND", message: "Partenaire introuvable" });
      if (partner.userId) {
        throw new TRPCError({ code: "CONFLICT", message: "Ce partenaire est déjà associé à un compte." });
      }

      const inviteToken = await issuePartnerInvite(db, partner.id, ctx.user.id);
      return {
        inviteToken,
        invitePath: "/portal/partner#invite=" + inviteToken,
        expiresInDays: 7,
      };
    }),

  claimAccount: authedQuery
    .input(z.object({ token: z.string().min(32).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const now = new Date();

      await db.transaction(async (tx) => {
        const [invite] = await tx.select()
          .from(partnerAccountInvitations)
          .where(and(
            eq(partnerAccountInvitations.tokenHash, hashInviteToken(input.token)),
            gte(partnerAccountInvitations.expiresAt, now),
            isNull(partnerAccountInvitations.claimedAt),
          ))
          .limit(1)
          .for("update");
        if (!invite) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Invitation invalide ou expirée." });
        }

        const [partner] = await tx.select()
          .from(partners)
          .where(eq(partners.id, invite.partnerId))
          .limit(1)
          .for("update");
        if (!partner || partner.status !== "active") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Ce compte partenaire n’est pas actif." });
        }
        if (partner.userId && partner.userId !== ctx.user.id) {
          throw new TRPCError({ code: "CONFLICT", message: "Ce compte partenaire est déjà associé à un autre utilisateur." });
        }

        const [otherPartner] = await tx.select({ id: partners.id })
          .from(partners)
          .where(and(
            eq(partners.userId, ctx.user.id),
            ne(partners.id, partner.id),
          ))
          .limit(1);
        if (otherPartner) {
          throw new TRPCError({ code: "CONFLICT", message: "Cette session est déjà associée à un autre compte partenaire." });
        }

        await tx.update(partners)
          .set({ userId: ctx.user.id, updatedAt: now })
          .where(eq(partners.id, partner.id));
        await tx.update(partnerAccountInvitations)
          .set({ claimedAt: now })
          .where(eq(partnerAccountInvitations.id, invite.id));
      });

      return { success: true };
    }),

  listPartners: adminQuery.query(async () => {
    const db = getDb();
    return db.select().from(partners).orderBy(desc(partners.createdAt));
  }),

  getPartner: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertPartnerAccess(ctx.user, input.id);
      const db = getDb();
      const rows = await db.select().from(partners).where(eq(partners.id, input.id)).limit(1);
      const partner = rows[0];
      if (!partner || ctx.user.role === "admin") return partner ?? null;
      const { notes: _notes, internalManagerId: _internalManagerId, ...publicPartner } = partner;
      return publicPartner;
    }),

  mine: authedQuery.query(async ({ ctx }) => {
    const partner = await getCurrentPartner(ctx.user);
    if (!partner) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Aucun compte partenaire actif n’est associé à cette session." });
    }
    const { notes: _notes, internalManagerId: _internalManagerId, ...publicPartner } = partner;
    return publicPartner;
  }),

  updatePartner: adminQuery
    .input(z.object({
      id: z.number(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      city: z.string().optional(),
      levelId: z.number().optional(),
      status: z.enum(['active','suspended','inactive','pending']).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(partners).set(data).where(eq(partners.id, id));
      return { success: true };
    }),

  getPartnerStats: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertPartnerAccess(ctx.user, input.id);
      const db = getDb();
      const [prospectCount] = await db.select({ count: count() }).from(partnerProspects).where(eq(partnerProspects.partnerId, input.id));
      const [oppCount] = await db.select({ count: count() }).from(partnerOpportunities).where(eq(partnerOpportunities.partnerId, input.id));
      const [wonCount] = await db.select({ count: count() }).from(partnerOpportunities).where(and(
        eq(partnerOpportunities.partnerId, input.id),
        eq(partnerOpportunities.contractStatus, 'signed')
      ));
      const [revenue] = await db.select({ total: sum(partnerOpportunities.contractAmount) }).from(partnerOpportunities).where(and(
        eq(partnerOpportunities.partnerId, input.id),
        eq(partnerOpportunities.contractStatus, 'signed')
      ));
      const [commissionTotal] = await db.select({ total: sum(partnerCommissions.amount) }).from(partnerCommissions).where(eq(partnerCommissions.partnerId, input.id));
      const [commissionPaid] = await db.select({ total: sum(partnerCommissions.amount) }).from(partnerCommissions).where(and(
        eq(partnerCommissions.partnerId, input.id),
        eq(partnerCommissions.status, 'paid')
      ));
      return {
        prospects: prospectCount?.count ?? 0,
        opportunities: oppCount?.count ?? 0,
        contractsWon: wonCount?.count ?? 0,
        revenueGenerated: Number(revenue?.total ?? 0),
        commissionTotal: Number(commissionTotal?.total ?? 0),
        commissionPaid: Number(commissionPaid?.total ?? 0)
      };
    }),

  // === PROSPECTS ===
  createProspect: authedQuery
    .input(z.object({
      partnerId: z.number(),
      companyName: z.string().min(2),
      contactName: z.string().optional(),
      contactFunction: z.string().optional(),
      phone: z.string().optional(),
      whatsapp: z.string().optional(),
      email: z.string().email().optional(),
      city: z.string().optional(),
      sector: z.string().optional(),
      need: z.string().optional(),
      serviceSearched: z.string().optional(),
      estimatedBudget: z.number().optional(),
      urgency: z.enum(['low','medium','high','critical']).optional(),
      description: z.string().optional(),
      source: z.string().optional(),
      estimatedAmount: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const partner = await assertPartnerAccess(ctx.user, input.partnerId);
      const db = getDb();
      // Check for duplicates
      const dupChecks = [];
      if (input.phone) dupChecks.push(eq(partnerProspects.phone, input.phone));
      if (input.email) dupChecks.push(eq(partnerProspects.email, input.email));
      if (input.companyName) dupChecks.push(like(partnerProspects.companyName, `%${input.companyName}%`));
      if (dupChecks.length > 0) {
        const existing = await db.select({ id: partnerProspects.id }).from(partnerProspects).where(and(
          eq(partnerProspects.partnerId, partner.id),
          or(...dupChecks),
        )).limit(1);
        if (existing.length > 0) {
          return { success: false, duplicate: true };
        }
      }
      const leadId = generateLeadId();
      const protectionEnd = new Date();
      protectionEnd.setFullYear(protectionEnd.getFullYear() + 1);
      const [prospect] = await db.insert(partnerProspects).values({
        ...input,
        leadId,
        status: 'new',
        protectionEndDate: protectionEnd,
      }).$returningId();
      return { success: true, id: prospect.id, leadId };
    }),

  listProspects: authedQuery
    .input(z.object({
      partnerId: z.number().optional(),
      status: z.enum(['new','to_qualify','qualified','appointment','proposal','negotiation','won','lost','cancelled']).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const conditions = [];
      if (input.partnerId) {
        await assertPartnerAccess(ctx.user, input.partnerId);
        conditions.push(eq(partnerProspects.partnerId, input.partnerId));
      } else if (ctx.user.role !== 'admin') {
        const partner = await getCurrentPartner(ctx.user);
        conditions.push(eq(partnerProspects.partnerId, partner!.id));
      }
      if (input.status) conditions.push(eq(partnerProspects.status, input.status));
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      return db.select().from(partnerProspects).where(where).orderBy(desc(partnerProspects.createdAt));
    }),

  updateProspectStatus: authedQuery
    .input(z.object({
      id: z.number(),
      status: z.enum(['new','to_qualify','qualified','appointment','proposal','negotiation','won','lost','cancelled']),
      assignedTo: z.number().optional(),
      nextAction: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...data } = input;
      const [prospect] = await db.select({ partnerId: partnerProspects.partnerId }).from(partnerProspects)
        .where(eq(partnerProspects.id, id)).limit(1);
      if (!prospect) throw new TRPCError({ code: 'NOT_FOUND', message: 'Prospect introuvable' });
      await assertPartnerAccess(ctx.user, prospect.partnerId);
      await db.update(partnerProspects).set(data as any).where(eq(partnerProspects.id, id));
      return { success: true };
    }),

  // === OPPORTUNITIES ===
  createOpportunity: authedQuery
    .input(z.object({
      prospectId: z.number(),
      partnerId: z.number(),
      quoteNumber: z.string().optional(),
      quoteAmountHT: z.number().optional(),
      quoteAmountTTC: z.number().optional(),
      contractNumber: z.string().optional(),
      contractAmount: z.number().optional(),
      contractType: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const partner = await assertPartnerAccess(ctx.user, input.partnerId);
      const db = getDb();
      const [prospect] = await db.select({ id: partnerProspects.id }).from(partnerProspects).where(and(
        eq(partnerProspects.id, input.prospectId),
        eq(partnerProspects.partnerId, partner.id),
      )).limit(1);
      if (!prospect) throw new TRPCError({ code: 'NOT_FOUND', message: 'Prospect introuvable' });
      const [level] = await db.select({ commissionRate: partnerLevels.commissionRate })
        .from(partnerLevels).where(eq(partnerLevels.id, partner.levelId)).limit(1);
      const [opp] = await db.insert(partnerOpportunities).values({
        ...input,
        partnerId: partner.id,
        commissionRate: level?.commissionRate,
      } as any).$returningId();
      return { id: opp.id };
    }),

  updateOpportunity: adminQuery
    .input(z.object({
      id: z.number(),
      quoteStatus: z.enum(['draft','sent','viewed','accepted','rejected','expired']).optional(),
      contractStatus: z.enum(['draft','signed','active','terminated','cancelled']).optional(),
      collectedAmount: z.number().optional(),
      commissionEarned: z.number().optional(),
      commissionStatus: z.enum(['pending','validated','paid','cancelled']).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      if (data.collectedAmount !== undefined) {
        const [opp] = await db.select().from(partnerOpportunities).where(eq(partnerOpportunities.id, id)).limit(1);
        if (opp) {
          (data as any).remainingAmount = (opp.contractAmount ?? 0) - data.collectedAmount;
          if (opp.commissionRate && data.collectedAmount > 0) {
            const rate = Number(opp.commissionRate);
            (data as any).commissionEarned = Math.round(data.collectedAmount * rate / 100);
          }
        }
      }
      await db.update(partnerOpportunities).set(data as any).where(eq(partnerOpportunities.id, id));
      return { success: true };
    }),

  // === COMMISSIONS ===
  createCommission: adminQuery
    .input(z.object({
      partnerId: z.number(),
      opportunityId: z.number(),
      collectedAmount: z.number(),
      rate: z.number(),
      invoiceNumber: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const amount = Math.round(input.collectedAmount * input.rate / 100);
      const [comm] = await db.insert(partnerCommissions).values({
        ...input,
        amount,
        status: 'pending'
      } as any).$returningId();
      return { id: comm.id, amount };
    }),

  listCommissions: authedQuery
    .input(z.object({ partnerId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertPartnerAccess(ctx.user, input.partnerId);
      const db = getDb();
      return db.select().from(partnerCommissions).where(eq(partnerCommissions.partnerId, input.partnerId)).orderBy(desc(partnerCommissions.createdAt));
    }),

  validateCommission: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(partnerCommissions).set({ status: 'validated', validatedAt: new Date() }).where(eq(partnerCommissions.id, input.id));
      return { success: true };
    }),

  payCommission: adminQuery
    .input(z.object({
      id: z.number(),
      paymentMethod: z.enum(['bank_transfer','mobile_money','cash','other']),
      paymentReference: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(partnerCommissions).set({
        status: 'paid',
        paidAt: new Date(),
        paymentMethod: input.paymentMethod,
        paymentReference: input.paymentReference,
        notes: input.notes
      }).where(eq(partnerCommissions.id, input.id));
      return { success: true };
    }),

  // === NOTIFICATIONS ===
  listNotifications: authedQuery
    .input(z.object({ partnerId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertPartnerAccess(ctx.user, input.partnerId);
      const db = getDb();
      return db.select().from(partnerNotifications).where(eq(partnerNotifications.partnerId, input.partnerId)).orderBy(desc(partnerNotifications.createdAt));
    }),

  markNotificationRead: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [notification] = await db.select({ partnerId: partnerNotifications.partnerId })
        .from(partnerNotifications).where(eq(partnerNotifications.id, input.id)).limit(1);
      if (!notification) throw new TRPCError({ code: 'NOT_FOUND', message: 'Notification introuvable' });
      await assertPartnerAccess(ctx.user, notification.partnerId);
      await db.update(partnerNotifications).set({ isRead: true }).where(eq(partnerNotifications.id, input.id));
      return { success: true };
    }),

  // === ADMIN DASHBOARD STATS ===
  adminStats: adminQuery.query(async () => {
    const db = getDb();
    const [activePartners] = await db.select({ count: count() }).from(partners).where(eq(partners.status, 'active'));
    const [totalProspects] = await db.select({ count: count() }).from(partnerProspects);
    const [activeOpps] = await db.select({ count: count() }).from(partnerProspects).where(
      and(gte(partnerProspects.status, 'new'), lte(partnerProspects.status, 'negotiation'))
    );
    const [totalRevenue] = await db.select({ total: sum(partnerOpportunities.contractAmount) }).from(partnerOpportunities).where(
      eq(partnerOpportunities.contractStatus, 'signed')
    );
    const [dueCommissions] = await db.select({ total: sum(partnerCommissions.amount) }).from(partnerCommissions).where(
      eq(partnerCommissions.status, 'validated')
    );
    const [paidCommissions] = await db.select({ total: sum(partnerCommissions.amount) }).from(partnerCommissions).where(
      eq(partnerCommissions.status, 'paid')
    );
    return {
      activePartners: activePartners?.count ?? 0,
      totalProspects: totalProspects?.count ?? 0,
      activeOpportunities: activeOpps?.count ?? 0,
      totalRevenueXAF: Number(totalRevenue?.total ?? 0),
      dueCommissionsXAF: Number(dueCommissions?.total ?? 0),
      paidCommissionsXAF: Number(paidCommissions?.total ?? 0)
    };
  }),
});
