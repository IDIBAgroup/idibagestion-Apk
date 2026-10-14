import { createHash, randomBytes } from "node:crypto";
import * as cookie from "cookie";
import { and, eq, gt, lt } from "drizzle-orm";
import { Session } from "@contracts/constants";
import { userSessions, users, type User } from "@db/schema";
import { getDb } from "../queries/connection";
import { getSessionCookieOptions } from "../lib/cookies";

const SessionTokenPattern = /^[A-Za-z0-9_-]{43}$/;

export function readSessionToken(headers: Headers) {
  const token = cookie.parse(headers.get("cookie") || "")[Session.cookieName];
  return token && SessionTokenPattern.test(token) ? token : null;
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function getSessionExpiresAt() {
  return new Date(Date.now() + Session.maxAgeMs);
}

export function serializeSessionCookie(token: string, headers: Headers) {
  const options = getSessionCookieOptions(headers);
  return cookie.serialize(Session.cookieName, token, {
    httpOnly: options.httpOnly,
    path: options.path,
    sameSite: "lax",
    secure: options.secure,
    maxAge: Session.maxAgeMs / 1000,
  });
}

export function serializeExpiredSessionCookie(headers: Headers) {
  const options = getSessionCookieOptions(headers);
  return cookie.serialize(Session.cookieName, "", {
    httpOnly: options.httpOnly,
    path: options.path,
    sameSite: "lax",
    secure: options.secure,
    maxAge: 0,
  });
}

export function appendSessionCookie(token: string, headers: Headers, responseHeaders: Headers) {
  responseHeaders.append("set-cookie", serializeSessionCookie(token, headers));
}

export async function createSession(userId: number, headers: Headers, responseHeaders: Headers) {
  const token = createSessionToken();
  const expiresAt = getSessionExpiresAt();
  const db = getDb();
  await db.delete(userSessions).where(and(
    eq(userSessions.userId, userId),
    lt(userSessions.expiresAt, new Date()),
  ));
  await db.insert(userSessions).values({
    id: hashSessionToken(token),
    userId,
    expiresAt,
  });
  appendSessionCookie(token, headers, responseHeaders);
}

export async function revokeSession(headers: Headers, responseHeaders: Headers) {
  const token = readSessionToken(headers);
  if (token) {
    await getDb().delete(userSessions).where(eq(userSessions.id, hashSessionToken(token)));
  }
  responseHeaders.append("set-cookie", serializeExpiredSessionCookie(headers));
}

export async function authenticateRequest(headers: Headers, responseHeaders: Headers): Promise<User | undefined> {
  const token = readSessionToken(headers);
  if (!token) return undefined;

  const now = new Date();
  const [result] = await getDb()
    .select({ user: users })
    .from(userSessions)
    .innerJoin(users, eq(userSessions.userId, users.id))
    .where(and(
      eq(userSessions.id, hashSessionToken(token)),
      gt(userSessions.expiresAt, now),
    ))
    .limit(1);

  if (!result) {
    await getDb().delete(userSessions).where(eq(userSessions.id, hashSessionToken(token)));
    responseHeaders.append("set-cookie", serializeExpiredSessionCookie(headers));
    return undefined;
  }

  return result.user;
}
