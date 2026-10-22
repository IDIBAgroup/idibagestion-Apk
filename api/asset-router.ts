import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { fixedAssets } from "@db/schema";
import { createRouter, authedQuery, assertCompanyAccess, assertCompanyManagementAccess } from "./middleware";
import { getDb } from "./queries/connection";
import { isDesignMode } from "./design-mode";
import { assertSubscriptionFeature } from "./subscription-quota";
import { resolveCompanyCurrencyCode } from "./company-currency";

const assetStatuses = ["active", "maintenance", "disposed", "out_of_service"] as const;
const depreciationMethods = ["linear", "degressive"] as const;
const designAssets = new Map<number, AssetRecord[]>();

type AssetRecord = {
  id: number;
  companyId: number;
  name: string;
  category: string;
  serialNumber: string;
  description: string | null;
  acquisitionDate: string | null;
  acquisitionValue: number;
  currencyCode: string;
  location: string | null;
  status: (typeof assetStatuses)[number];
  usefulLifeYears: number | null;
  depreciationMethod: (typeof depreciationMethods)[number] | null;
  createdAt: Date;
  updatedAt: Date;
};

function mapAsset(row: typeof fixedAssets.$inferSelect): AssetRecord {
  return {
    ...row,
    acquisitionValue: Number(row.acquisitionValue),
  };
}

function isDuplicateKeyError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ER_DUP_ENTRY";
}

function isIsoDateOnly(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const companyInput = z.object({ companyId: z.number().int().positive() });

export const assetRouter = createRouter({
  list: authedQuery.input(companyInput).query(async ({ ctx, input }) => {
    await assertCompanyAccess(ctx.user, input.companyId);
    await assertSubscriptionFeature(input.companyId, "fixed_assets");
    if (isDesignMode) return designAssets.get(input.companyId) ?? [];

    const rows = await getDb().select().from(fixedAssets)
      .where(eq(fixedAssets.companyId, input.companyId))
      .orderBy(desc(fixedAssets.createdAt));
    return rows.map(mapAsset);
  }),

  create: authedQuery.input(companyInput.extend({
    name: z.string().trim().min(1).max(255),
    category: z.string().trim().min(1).max(180),
    serialNumber: z.string().trim().min(1).max(120),
    description: z.string().trim().max(5000).optional(),
    acquisitionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
    acquisitionValue: z.number().finite().positive().max(1_000_000_000_000),
    location: z.string().trim().max(255).optional(),
    status: z.enum(assetStatuses).default("active"),
    usefulLifeYears: z.number().int().positive().max(100).optional(),
    depreciationMethod: z.enum(depreciationMethods).optional(),
  }).refine((input) => !input.acquisitionDate || isIsoDateOnly(input.acquisitionDate), {
    path: ["acquisitionDate"], message: "Date d’acquisition invalide.",
  })).mutation(async ({ ctx, input }) => {
    await assertCompanyManagementAccess(ctx.user, input.companyId);
    await assertSubscriptionFeature(input.companyId, "fixed_assets");
    const currencyCode = await resolveCompanyCurrencyCode(input.companyId);
    if (Boolean(input.usefulLifeYears) !== Boolean(input.depreciationMethod)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Indiquez à la fois la durée d’usage et la méthode d’amortissement." });
    }

    if (isDesignMode) {
      const assets = designAssets.get(input.companyId) ?? [];
      if (assets.some((asset) => asset.serialNumber.toLocaleLowerCase() === input.serialNumber.toLocaleLowerCase())) {
        throw new TRPCError({ code: "CONFLICT", message: "Ce numéro de série est déjà utilisé dans cette entreprise." });
      }
      const now = new Date();
      const asset: AssetRecord = {
        ...input,
        id: Date.now(),
        acquisitionDate: input.acquisitionDate || null,
        acquisitionValue: input.acquisitionValue,
        currencyCode,
        description: input.description || null,
        location: input.location || null,
        usefulLifeYears: input.usefulLifeYears ?? null,
        depreciationMethod: input.depreciationMethod ?? null,
        createdAt: now,
        updatedAt: now,
      };
      designAssets.set(input.companyId, [asset, ...assets]);
      return asset;
    }

    try {
      const [created] = await getDb().insert(fixedAssets).values({
        companyId: input.companyId,
        name: input.name,
        category: input.category,
        serialNumber: input.serialNumber,
        description: input.description || null,
        acquisitionDate: input.acquisitionDate || null,
        acquisitionValue: input.acquisitionValue.toFixed(2),
        currencyCode,
        location: input.location || null,
        status: input.status,
        usefulLifeYears: input.usefulLifeYears ?? null,
        depreciationMethod: input.depreciationMethod ?? null,
        createdByUserId: ctx.user.id,
      }).$returningId();
      const [asset] = await getDb().select().from(fixedAssets).where(and(
        eq(fixedAssets.id, created.id), eq(fixedAssets.companyId, input.companyId),
      )).limit(1);
      if (!asset) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Immobilisation créée mais introuvable." });
      return mapAsset(asset);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new TRPCError({ code: "CONFLICT", message: "Ce numéro de série est déjà utilisé dans cette entreprise." });
      }
      throw error;
    }
  }),

  setStatus: authedQuery.input(companyInput.extend({
    assetId: z.number().int().positive(),
    status: z.enum(assetStatuses),
  })).mutation(async ({ ctx, input }) => {
    await assertCompanyManagementAccess(ctx.user, input.companyId);
    await assertSubscriptionFeature(input.companyId, "fixed_assets");
    if (isDesignMode) {
      const assets = designAssets.get(input.companyId) ?? [];
      const asset = assets.find((item) => item.id === input.assetId);
      if (!asset) throw new TRPCError({ code: "NOT_FOUND", message: "Immobilisation introuvable." });
      const updated = { ...asset, status: input.status, updatedAt: new Date() };
      designAssets.set(input.companyId, assets.map((item) => item.id === input.assetId ? updated : item));
      return updated;
    }

    const db = getDb();
    const [asset] = await db.select().from(fixedAssets).where(and(
      eq(fixedAssets.id, input.assetId), eq(fixedAssets.companyId, input.companyId),
    )).limit(1);
    if (!asset) throw new TRPCError({ code: "NOT_FOUND", message: "Immobilisation introuvable." });
    await db.update(fixedAssets).set({ status: input.status, updatedAt: new Date() }).where(and(
      eq(fixedAssets.id, input.assetId), eq(fixedAssets.companyId, input.companyId),
    ));
    return { ...mapAsset(asset), status: input.status, updatedAt: new Date() };
  }),
});
