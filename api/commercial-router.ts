import { z } from "zod";
import { createRouter, authedQuery, assertCompanyAccess } from "./middleware";
import { getDb } from "./queries/connection";
import { clients, products } from "@db/schema";
import { eq, desc, and } from "drizzle-orm";
import { assertSubscriptionFeature, assertSubscriptionQuota } from "./subscription-quota";

// ============================================
// CLIENT ROUTER — Portefeuille Clients (NIU / RCCM)
// ============================================

export const clientRouter = createRouter({
  listByCompany: authedQuery
    .input(z.object({ companyId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertCompanyAccess(ctx.user, input.companyId);
      await assertSubscriptionFeature(input.companyId, "customers");
      const db = getDb();
      return db
        .select()
        .from(clients)
        .where(eq(clients.companyId, input.companyId))
        .orderBy(desc(clients.createdAt));
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const rows = await db.select().from(clients).where(eq(clients.id, input.id)).limit(1);
      if (rows[0]) {
        await assertCompanyAccess(ctx.user, rows[0].companyId);
        await assertSubscriptionFeature(rows[0].companyId, "customers");
      }
      return rows[0] ?? null;
    }),

  create: authedQuery
    .input(
      z.object({
        companyId: z.number(),
        name: z.string().min(2),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        whatsapp: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        country: z.string().default("Cameroun"),
        niu: z.string().optional(),
        rccm: z.string().optional(),
        taxCategory: z.string().optional(),
        status: z.enum(["active", "inactive", "lead"]).default("active"),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertCompanyAccess(ctx.user, input.companyId);
      await assertSubscriptionFeature(input.companyId, "customers");
      await assertSubscriptionQuota(input.companyId, "clients");
      const db = getDb();
      const [res] = await db.insert(clients).values(input).$returningId();
      return { id: res.id, ...input };
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(2).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        whatsapp: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        niu: z.string().optional(),
        rccm: z.string().optional(),
        taxCategory: z.string().optional(),
        status: z.enum(["active", "inactive", "lead"]).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...data } = input;
      const [client] = await db.select({ companyId: clients.companyId }).from(clients).where(eq(clients.id, id)).limit(1);
      if (!client) return { success: false };
      await assertCompanyAccess(ctx.user, client.companyId);
      await assertSubscriptionFeature(client.companyId, "customers");
      await db.update(clients).set(data).where(eq(clients.id, id));
      return { success: true };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [client] = await db.select({ companyId: clients.companyId }).from(clients).where(eq(clients.id, input.id)).limit(1);
      if (!client) return { success: false };
      await assertCompanyAccess(ctx.user, client.companyId);
      await assertSubscriptionFeature(client.companyId, "customers");
      await db.delete(clients).where(eq(clients.id, input.id));
      return { success: true };
    }),
});

// ============================================
// PRODUCT ROUTER — Catalogue Articles / Prestations
// ============================================

export const productRouter = createRouter({
  listByCompany: authedQuery
    .input(z.object({ companyId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertCompanyAccess(ctx.user, input.companyId);
      const db = getDb();
      return db
        .select()
        .from(products)
        .where(and(eq(products.companyId, input.companyId), eq(products.isActive, true)))
        .orderBy(desc(products.createdAt));
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const rows = await db.select().from(products).where(eq(products.id, input.id)).limit(1);
      if (rows[0]) await assertCompanyAccess(ctx.user, rows[0].companyId);
      return rows[0] ?? null;
    }),

  create: authedQuery
    .input(
      z.object({
        companyId: z.number(),
        code: z.string().optional(),
        name: z.string().min(2),
        description: z.string().optional(),
        unitPriceHT: z.number(),
        taxRate: z.string().default("19.25"),
        unit: z.string().default("Unité"),
        category: z.string().default("Service"),
        stockQuantity: z.number().default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertCompanyAccess(ctx.user, input.companyId);
      const db = getDb();
      const [res] = await db.insert(products).values(input).$returningId();
      return { id: res.id, ...input };
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        code: z.string().optional(),
        name: z.string().optional(),
        description: z.string().optional(),
        unitPriceHT: z.number().optional(),
        taxRate: z.string().optional(),
        unit: z.string().optional(),
        category: z.string().optional(),
        stockQuantity: z.number().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...data } = input;
      const [product] = await db.select({ companyId: products.companyId }).from(products).where(eq(products.id, id)).limit(1);
      if (!product) return { success: false };
      await assertCompanyAccess(ctx.user, product.companyId);
      await db.update(products).set(data).where(eq(products.id, id));
      return { success: true };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [product] = await db.select({ companyId: products.companyId }).from(products).where(eq(products.id, input.id)).limit(1);
      if (!product) return { success: false };
      await assertCompanyAccess(ctx.user, product.companyId);
      await db.update(products).set({ isActive: false }).where(eq(products.id, input.id));
      return { success: true };
    }),
});
