import { ErrorMessages } from "@contracts/constants";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { and, eq } from "drizzle-orm";
import { companies, companyMemberships, partners, type User } from "@db/schema";
import { getDb } from "./queries/connection";
import { designCompany, isDesignMode } from "./design-mode";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const createRouter = t.router;
export const publicQuery = t.procedure;

const requireAuth = t.middleware(async (opts) => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: ErrorMessages.unauthenticated,
    });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});

function requireRole(role: string) {
  return t.middleware(async (opts) => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== role) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: ErrorMessages.insufficientRole,
      });
    }

    return next({ ctx: { ...ctx, user: ctx.user } });
  });
}

export const authedQuery = t.procedure.use(requireAuth);
export const adminQuery = authedQuery.use(requireRole("admin"));

async function getCompanyAccess(user: User, companyId: number, allowInactive = false) {
  if (isDesignMode && companyId === designCompany.id && user.role === "admin") {
    return { company: designCompany, role: "platform_admin" as const };
  }
  const [company] = await getDb()
    .select()
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);

  if (!company) return null;
  if (user.role === "admin") return { company, role: "platform_admin" as const };
  // Super-admin suspension and cancellation must immediately revoke tenant API access.
  if (!allowInactive && (company.status === "suspended" || company.status === "cancelled")) return null;
  if (company.ownerUserId === user.id) return { company, role: "owner" as const };

  const [membership] = await getDb()
    .select({ role: companyMemberships.role })
    .from(companyMemberships)
    .where(and(
      eq(companyMemberships.companyId, companyId),
      eq(companyMemberships.userId, user.id),
      eq(companyMemberships.status, "active"),
    ))
    .limit(1);

  if (!membership) return null;
  return { company, role: membership.role };
}

export async function assertCompanyAccess(user: User, companyId: number) {
  const access = await getCompanyAccess(user, companyId);
  if (!access) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Entreprise introuvable" });
  }

  return access.company;
}

export async function getCompanyAccessRole(user: User, companyId: number) {
  const access = await getCompanyAccess(user, companyId);
  if (!access) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Entreprise introuvable" });
  }
  return access.role;
}

export async function assertCompanyManagementAccess(user: User, companyId: number) {
  const access = await getCompanyAccess(user, companyId);
  if (!access) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Entreprise introuvable" });
  }
  if (access.role !== "platform_admin" && access.role !== "owner" && access.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Droits de gestion insuffisants" });
  }
  return access;
}

export async function assertCompanyBillingAccess(user: User, companyId: number) {
  const access = await getCompanyAccess(user, companyId, true);
  if (!access) throw new TRPCError({ code: "NOT_FOUND", message: "Entreprise introuvable" });
  return access.company;
}

export async function assertCompanyBillingManagementAccess(user: User, companyId: number) {
  const access = await getCompanyAccess(user, companyId, true);
  if (!access) throw new TRPCError({ code: "NOT_FOUND", message: "Entreprise introuvable" });
  if (access.role !== "platform_admin" && access.role !== "owner" && access.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Droits de gestion insuffisants" });
  }
  return access;
}

export async function assertCompanyOwnerAccess(user: User, companyId: number) {
  const access = await getCompanyAccess(user, companyId);
  if (!access) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Entreprise introuvable" });
  }
  if (access.role !== "platform_admin" && access.role !== "owner") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Seul le propriétaire peut effectuer cette action" });
  }
  return access;
}

export async function assertPartnerAccess(user: User, partnerId: number) {
  const [partner] = await getDb()
    .select()
    .from(partners)
    .where(eq(partners.id, partnerId))
    .limit(1);

  const ownsPartner = partner?.userId === user.id;
  if (!partner || (user.role !== "admin" && (!ownsPartner || partner.status !== "active"))) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Partenaire introuvable" });
  }

  return partner;
}

export async function getCurrentPartner(user: User) {
  const [partner] = await getDb()
    .select()
    .from(partners)
    .where(and(
      eq(partners.userId, user.id),
      eq(partners.status, "active"),
    ))
    .limit(1);

  if (!partner && user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Aucun compte partenaire associé" });
  }

  return partner;
}
