import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { PasswordRules } from "@contracts/constants";
import { userSessions, users, type User } from "@db/schema";
import { hashPassword, verifyPassword } from "./auth/password.js";
import {
  appendSessionCookie,
  createSession,
  createSessionToken,
  getSessionExpiresAt,
  hashSessionToken,
  revokeSession,
} from "./auth/session";
import {
  clearLoginFailures,
  getLoginRetryAfter,
  recordLoginFailure,
} from "./auth/rate-limit";
import { getDb } from "./queries/connection";
import { createRouter, authedQuery, publicQuery } from "./middleware";

function assertSameOrigin(request: Request) {
  const originHeader = request.headers.get("origin");
  if (!originHeader) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Origine de la requête absente." });
  }

  try {
    const origin = new URL(originHeader);
    const requestUrl = new URL(request.url);
    if (
      origin.host !== requestUrl.host ||
      (process.env.NODE_ENV === "production" && origin.protocol !== "https:")
    ) {
      throw new Error("Cross-origin request");
    }
  } catch {
    throw new TRPCError({ code: "FORBIDDEN", message: "Origine de la requête invalide." });
  }
}

function publicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    hasPassword: Boolean(user.passwordHash),
    avatar: user.avatar,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastSignInAt: user.lastSignInAt,
  };
}

const emailSchema = z.string().trim().toLowerCase().email().max(320);
const passwordSchema = z.string().min(1).max(128);
const newPasswordSchema = z.string()
  .min(PasswordRules.minLength, `Le mot de passe doit contenir au moins ${PasswordRules.minLength} caractères.`)
  .max(PasswordRules.maxLength, `Le mot de passe ne peut pas dépasser ${PasswordRules.maxLength} caractères.`);

export const authRouter = createRouter({
  me: publicQuery.query(({ ctx }) => ctx.user ? publicUser(ctx.user) : null),

  login: publicQuery
    .input(z.object({ email: emailSchema, password: passwordSchema }))
    .mutation(async ({ ctx, input }) => {
      assertSameOrigin(ctx.req);

      const retryAfter = getLoginRetryAfter(input.email);
      if (retryAfter > 0) {
        ctx.resHeaders.set("retry-after", String(retryAfter));
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Trop de tentatives. Réessayez dans quelques minutes.",
        });
      }

      const [user] = await getDb()
        .select()
        .from(users)
        .where(sql`LOWER(${users.email}) = ${input.email}`)
        .limit(1);

      const passwordMatches = await verifyPassword(input.password, user?.passwordHash);
      if (!user || !user.passwordHash || !passwordMatches) {
        recordLoginFailure(input.email);
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Adresse e-mail ou mot de passe invalide.",
        });
      }

      clearLoginFailures(input.email);
      const signedInAt = new Date();
      await getDb().update(users).set({ lastSignInAt: signedInAt }).where(eq(users.id, user.id));
      await createSession(user.id, ctx.req.headers, ctx.resHeaders);

      return publicUser({ ...user, lastSignInAt: signedInAt });
    }),

  logout: publicQuery.mutation(async ({ ctx }) => {
    assertSameOrigin(ctx.req);
    await revokeSession(ctx.req.headers, ctx.resHeaders);
    return { success: true };
  }),

  changePassword: authedQuery
    .input(z.object({
      currentPassword: passwordSchema,
      newPassword: newPasswordSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      assertSameOrigin(ctx.req);
      const user = ctx.user;
      const accountKey = user.email ?? `user-${user.id}`;
      const retryAfter = getLoginRetryAfter(accountKey);
      if (retryAfter > 0) {
        ctx.resHeaders.set("retry-after", String(retryAfter));
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Trop de tentatives. Réessayez dans quelques minutes.",
        });
      }
      if (!user.passwordHash || !(await verifyPassword(input.currentPassword, user.passwordHash))) {
        recordLoginFailure(accountKey);
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Mot de passe actuel invalide." });
      }

      clearLoginFailures(accountKey);
      const passwordHash = await hashPassword(input.newPassword);
      const token = createSessionToken();
      const expiresAt = getSessionExpiresAt();
      await getDb().transaction(async (tx) => {
        await tx.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, user.id));
        await tx.delete(userSessions).where(eq(userSessions.userId, user.id));
        await tx.insert(userSessions).values({ id: hashSessionToken(token), userId: user.id, expiresAt });
      });
      appendSessionCookie(token, ctx.req.headers, ctx.resHeaders);
      return { success: true };
    }),
});
