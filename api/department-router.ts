import { and, desc, eq, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { companies, companyMemberships, departmentMembers, departments, users } from "@db/schema";
import { createRouter, authedQuery, assertCompanyAccess, getCompanyAccessRole } from "./middleware";
import { getDb } from "./queries/connection";
import { isDesignMode } from "./design-mode";
import { assertSubscriptionFeature } from "./subscription-quota";
import { belongsToDepartmentCompany, canManageDepartments } from "@/lib/hr/department-policy";

type DepartmentPerson = { id: number; name: string; email: string | null; role: string };
type DepartmentRecord = {
  id: number;
  companyId: number;
  name: string;
  managerId: number | null;
  managerName: string | null;
  managerEmail: string | null;
  members: DepartmentPerson[];
  createdAt: Date;
  updatedAt: Date;
};

const designDepartments = new Map<number, DepartmentRecord[]>();
const designDepartmentMemberIds = new Map<number, Map<number, number[]>>();
const companyInput = z.object({ companyId: z.number().int().positive() });

async function assertCanManage(user: typeof users.$inferSelect, companyId: number) {
  const role = await getCompanyAccessRole(user, companyId);
  if (!canManageDepartments(role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Droits de gestion des départements insuffisants." });
  }
}

async function assertCompanyPerson(companyId: number, personId: number) {
  const db = getDb();
  const [company] = await db.select({ ownerUserId: companies.ownerUserId }).from(companies)
    .where(eq(companies.id, companyId)).limit(1);
  const [membership] = await db.select({ userId: companyMemberships.userId }).from(companyMemberships)
    .where(and(
      eq(companyMemberships.companyId, companyId),
      eq(companyMemberships.userId, personId),
      eq(companyMemberships.status, "active"),
    )).limit(1);
  if (!belongsToDepartmentCompany(company?.ownerUserId === personId, Boolean(membership))) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "La personne sélectionnée n'appartient pas à cette entreprise." });
  }
}

async function assertDepartment(companyId: number, departmentId: number) {
  if (isDesignMode) {
    const department = (designDepartments.get(companyId) ?? []).find(({ id }) => id === departmentId);
    if (!department) throw new TRPCError({ code: "NOT_FOUND", message: "Département introuvable." });
    return department;
  }
  const [department] = await getDb().select().from(departments).where(and(
    eq(departments.id, departmentId),
    eq(departments.companyId, companyId),
  )).limit(1);
  if (!department) throw new TRPCError({ code: "NOT_FOUND", message: "Département introuvable." });
  return department;
}

function isDuplicateKey(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ER_DUP_ENTRY";
}

export const departmentRouter = createRouter({
  directory: authedQuery.input(companyInput).query(async ({ ctx, input }) => {
    const company = await assertCompanyAccess(ctx.user, input.companyId);
    await assertSubscriptionFeature(input.companyId, "hr");
    if (isDesignMode) {
      const people: DepartmentPerson[] = [{ id: 1, name: "Admin Démo", email: "admin@demo.idibages.test", role: "Propriétaire" }];
      const personById = new Map(people.map((person) => [person.id, person]));
      const membersByDepartment = designDepartmentMemberIds.get(input.companyId) ?? new Map<number, number[]>();
      const departmentRows = (designDepartments.get(input.companyId) ?? []).map((department) => ({
        ...department,
        members: (membersByDepartment.get(department.id) ?? []).map((id) => personById.get(id)).filter((person): person is DepartmentPerson => Boolean(person)),
      }));
      return { departments: departmentRows, people };
    }

    const db = getDb();
    const memberships = await db.select({ userId: companyMemberships.userId, role: companyMemberships.role })
      .from(companyMemberships).where(and(
        eq(companyMemberships.companyId, input.companyId),
        eq(companyMemberships.status, "active"),
      ));
    const personRoles = new Map<number, string>(memberships.map(({ userId, role }) => [userId, role]));
    if (company.ownerUserId != null) personRoles.set(company.ownerUserId, "owner");
    const personIds = [...personRoles.keys()];
    const peopleRows = personIds.length
      ? await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, personIds))
      : [];
    const people: DepartmentPerson[] = peopleRows.map((person) => ({
      id: person.id,
      name: person.name || person.email || "Utilisateur",
      email: person.email,
      role: personRoles.get(person.id) || "member",
    }));
    const personById = new Map(people.map((person) => [person.id, person]));
    const departmentRows = await db.select().from(departments)
      .where(eq(departments.companyId, input.companyId)).orderBy(desc(departments.createdAt));
    const departmentIds = departmentRows.map(({ id }) => id);
    const membershipRows = departmentIds.length
      ? await db.select({ departmentId: departmentMembers.departmentId, userId: departmentMembers.userId })
        .from(departmentMembers).where(and(
          eq(departmentMembers.companyId, input.companyId),
          inArray(departmentMembers.departmentId, departmentIds),
        ))
      : [];
    const memberIdsByDepartment = new Map<number, number[]>();
    for (const row of membershipRows) {
      const ids = memberIdsByDepartment.get(row.departmentId) ?? [];
      ids.push(row.userId);
      memberIdsByDepartment.set(row.departmentId, ids);
    }
    const departmentsResult: DepartmentRecord[] = departmentRows.map((department) => {
      const manager = department.managerUserId == null ? undefined : personById.get(department.managerUserId);
      return {
        id: department.id,
        companyId: department.companyId,
        name: department.name,
        managerId: department.managerUserId,
        managerName: manager?.name ?? null,
        managerEmail: manager?.email ?? null,
        members: (memberIdsByDepartment.get(department.id) ?? [])
          .map((memberId) => personById.get(memberId)).filter((person): person is DepartmentPerson => Boolean(person)),
        createdAt: department.createdAt,
        updatedAt: department.updatedAt,
      };
    });
    return { departments: departmentsResult, people };
  }),

  create: authedQuery.input(companyInput.extend({
    name: z.string().trim().min(2).max(120),
    managerId: z.number().int().positive().nullable().optional(),
  })).mutation(async ({ ctx, input }) => {
    await assertCompanyAccess(ctx.user, input.companyId);
    await assertSubscriptionFeature(input.companyId, "hr");
    await assertCanManage(ctx.user, input.companyId);
    const managerId = input.managerId ?? null;
    if (managerId != null && !isDesignMode) await assertCompanyPerson(input.companyId, managerId);

    if (isDesignMode) {
      const now = new Date();
      const created: DepartmentRecord = {
        id: Date.now(), companyId: input.companyId, name: input.name,
        managerId, managerName: managerId === 1 ? "Admin Démo" : null,
        managerEmail: managerId === 1 ? "admin@demo.idibages.test" : null,
        members: [], createdAt: now, updatedAt: now,
      };
      designDepartments.set(input.companyId, [created, ...(designDepartments.get(input.companyId) ?? [])]);
      return created;
    }

    try {
      const [created] = await getDb().insert(departments).values({
        companyId: input.companyId, name: input.name, managerUserId: managerId, createdByUserId: ctx.user.id,
      }).$returningId();
      return { id: created.id, companyId: input.companyId, name: input.name, managerId, managerName: null, managerEmail: null, members: [], createdAt: new Date(), updatedAt: new Date() } satisfies DepartmentRecord;
    } catch (error) {
      if (isDuplicateKey(error)) throw new TRPCError({ code: "CONFLICT", message: "Un département porte déjà ce nom dans cette entreprise." });
      throw error;
    }
  }),

  update: authedQuery.input(companyInput.extend({
    departmentId: z.number().int().positive(),
    name: z.string().trim().min(2).max(120),
    managerId: z.number().int().positive().nullable(),
  })).mutation(async ({ ctx, input }) => {
    await assertCompanyAccess(ctx.user, input.companyId);
    await assertSubscriptionFeature(input.companyId, "hr");
    await assertCanManage(ctx.user, input.companyId);
    await assertDepartment(input.companyId, input.departmentId);
    if (input.managerId != null && !isDesignMode) await assertCompanyPerson(input.companyId, input.managerId);
    if (isDesignMode) {
      const updatedAt = new Date();
      designDepartments.set(input.companyId, (designDepartments.get(input.companyId) ?? []).map((department) => department.id === input.departmentId
        ? { ...department, name: input.name, managerId: input.managerId, managerName: input.managerId === 1 ? "Admin Démo" : null, managerEmail: input.managerId === 1 ? "admin@demo.idibages.test" : null, updatedAt }
        : department));
      return { success: true };
    }
    try {
      await getDb().update(departments).set({ name: input.name, managerUserId: input.managerId }).where(and(
        eq(departments.id, input.departmentId), eq(departments.companyId, input.companyId),
      ));
      return { success: true };
    } catch (error) {
      if (isDuplicateKey(error)) throw new TRPCError({ code: "CONFLICT", message: "Un département porte déjà ce nom dans cette entreprise." });
      throw error;
    }
  }),

  assign: authedQuery.input(companyInput.extend({
    departmentId: z.number().int().positive(),
    userId: z.number().int().positive(),
  })).mutation(async ({ ctx, input }) => {
    await assertCompanyAccess(ctx.user, input.companyId);
    await assertSubscriptionFeature(input.companyId, "hr");
    await assertCanManage(ctx.user, input.companyId);
    await assertDepartment(input.companyId, input.departmentId);
    if (!isDesignMode) await assertCompanyPerson(input.companyId, input.userId);
    if (isDesignMode) {
      const companyMembers = designDepartmentMemberIds.get(input.companyId) ?? new Map<number, number[]>();
      const memberIds = companyMembers.get(input.departmentId) ?? [];
      if (!memberIds.includes(input.userId)) companyMembers.set(input.departmentId, [...memberIds, input.userId]);
      designDepartmentMemberIds.set(input.companyId, companyMembers);
      return { success: true };
    }
    try {
      await getDb().insert(departmentMembers).values({
        companyId: input.companyId, departmentId: input.departmentId, userId: input.userId,
      });
    } catch (error) {
      if (!isDuplicateKey(error)) throw error;
    }
    return { success: true };
  }),

  unassign: authedQuery.input(companyInput.extend({
    departmentId: z.number().int().positive(),
    userId: z.number().int().positive(),
  })).mutation(async ({ ctx, input }) => {
    await assertCompanyAccess(ctx.user, input.companyId);
    await assertSubscriptionFeature(input.companyId, "hr");
    await assertCanManage(ctx.user, input.companyId);
    await assertDepartment(input.companyId, input.departmentId);
    if (isDesignMode) {
      const companyMembers = designDepartmentMemberIds.get(input.companyId) ?? new Map<number, number[]>();
      companyMembers.set(input.departmentId, (companyMembers.get(input.departmentId) ?? []).filter((userId) => userId !== input.userId));
      designDepartmentMemberIds.set(input.companyId, companyMembers);
    } else {
      await getDb().delete(departmentMembers).where(and(
        eq(departmentMembers.companyId, input.companyId),
        eq(departmentMembers.departmentId, input.departmentId),
        eq(departmentMembers.userId, input.userId),
      ));
    }
    return { success: true };
  }),

  delete: authedQuery.input(companyInput.extend({ departmentId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await assertCompanyAccess(ctx.user, input.companyId);
      await assertSubscriptionFeature(input.companyId, "hr");
      await assertCanManage(ctx.user, input.companyId);
      await assertDepartment(input.companyId, input.departmentId);
      if (isDesignMode) {
        designDepartments.set(input.companyId, (designDepartments.get(input.companyId) ?? []).filter(({ id }) => id !== input.departmentId));
        designDepartmentMemberIds.get(input.companyId)?.delete(input.departmentId);
      } else {
        await getDb().transaction(async (tx) => {
          await tx.delete(departmentMembers).where(and(
            eq(departmentMembers.companyId, input.companyId), eq(departmentMembers.departmentId, input.departmentId),
          ));
          await tx.delete(departments).where(and(
            eq(departments.companyId, input.companyId), eq(departments.id, input.departmentId),
          ));
        });
      }
      return { success: true };
    }),
});
