import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { Hono } from "hono";
import * as cookie from "cookie";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { googleAuthTransactions, users, companies, companyMemberships } from "@db/schema";
import { getDb } from "./queries/connection";
import { createSession } from "./auth/session";

const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));
const FLOW_COOKIE = "idibages_google_flow";
const FLOW_TTL_SECONDS = 10 * 60;
const FLOW_TTL_MS = FLOW_TTL_SECONDS * 1000;
const OpaqueTokenPattern = /^[A-Za-z0-9_-]{43}$/;

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function createOpaqueToken() {
  return randomBytes(32).toString("base64url");
}

export function isConfiguredGoogleAdmin(email: string, configuredEmail = process.env.GOOGLE_ADMIN_EMAIL) {
  const adminEmail = configuredEmail?.trim().toLowerCase();
  return Boolean(
    adminEmail &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail) &&
    email.trim().toLowerCase() === adminEmail,
  );
}

function getGoogleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const redirectUri = process.env.GOOGLE_REDIRECT_URI?.trim();
  if (!clientId || !clientSecret || !redirectUri) return null;

  let callback: URL;
  try {
    callback = new URL(redirectUri);
  } catch {
    return null;
  }
  if (
    callback.pathname !== "/api/auth/google/callback" ||
    callback.search ||
    callback.hash ||
    (process.env.NODE_ENV === "production" && callback.protocol !== "https:")
  ) {
    return null;
  }

  return { clientId, clientSecret, redirectUri, appOrigin: callback.origin };
}

function flowCookieOptions(requestUrl: URL) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || requestUrl.protocol === "https:",
    sameSite: "lax" as const,
    path: "/api/auth/google/callback",
    maxAge: FLOW_TTL_SECONDS,
  };
}

function redirectToApp(appOrigin: string | null, path: string, responseHeaders?: Headers) {
  const headers = new Headers(responseHeaders);
  headers.set("location", appOrigin ? new URL(path, appOrigin).toString() : path);
  return new Response(null, { status: 302, headers });
}

function clearFlowCookie(requestUrl: URL, headers: Headers) {
  headers.append("set-cookie", cookie.serialize(FLOW_COOKIE, "", {
    ...flowCookieOptions(requestUrl),
    maxAge: 0,
  }));
}

async function consumeTransaction(state: string, browserToken: string) {
  const db = getDb();
  return db.transaction(async (tx) => {
    const [transaction] = await tx
      .select()
      .from(googleAuthTransactions)
      .where(and(
        eq(googleAuthTransactions.stateHash, hash(state)),
        eq(googleAuthTransactions.browserHash, hash(browserToken)),
        gt(googleAuthTransactions.expiresAt, new Date()),
      ))
      .limit(1)
      .for("update");

    if (!transaction) return null;
    await tx.delete(googleAuthTransactions)
      .where(eq(googleAuthTransactions.stateHash, transaction.stateHash));
    return transaction;
  });
}

async function exchangeCode(code: string, verifier: string, config: NonNullable<ReturnType<typeof getGoogleConfig>>) {
  const body = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    grant_type: "authorization_code",
    code_verifier: verifier,
  });
  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("Google token exchange failed");
  const tokens = await response.json() as { id_token?: unknown };
  if (typeof tokens.id_token !== "string") throw new Error("Google did not return an ID token");
  return tokens.id_token;
}

async function getOrCreateUser(idToken: string, expectedNonce: string) {
  const config = getGoogleConfig();
  if (!config) throw new Error("Google authentication is not configured");

  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
    audience: config.clientId,
    issuer: "https://accounts.google.com",
    algorithms: ["RS256"],
  });
  const hasUnexpectedAuthorizedParty = payload.azp !== undefined && payload.azp !== config.clientId;
  const hasUnexpectedMultiAudience = Array.isArray(payload.aud)
    && payload.aud.length > 1
    && payload.azp !== config.clientId;
  if (
    hasUnexpectedAuthorizedParty ||
    hasUnexpectedMultiAudience ||
    typeof payload.sub !== "string" ||
    typeof payload.nonce !== "string" ||
    payload.nonce !== expectedNonce ||
    typeof payload.email !== "string" ||
    payload.email_verified !== true
  ) {
    throw new Error("Google identity claims are incomplete or unverified");
  }

  const email = payload.email.trim().toLowerCase();
  const name = typeof payload.name === "string" && payload.name.trim()
    ? payload.name.trim().slice(0, 255)
    : email;
  const db = getDb();
  const [byGoogleId] = await db.select().from(users)
    .where(eq(users.googleSub, payload.sub))
    .limit(1);

  if (byGoogleId) {
    const signedInAt = new Date();
    const role = isConfiguredGoogleAdmin(email) ? "admin" : byGoogleId.role;
    await db.update(users).set({ lastSignInAt: signedInAt, role }).where(eq(users.id, byGoogleId.id));
    return { user: { ...byGoogleId, lastSignInAt: signedInAt, role }, created: false };
  }

  const [byEmail] = await db.select().from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (byEmail) {
    if (isConfiguredGoogleAdmin(email) && !byEmail.googleSub) {
      const signedInAt = new Date();
      const nameToKeep = byEmail.name || name;
      await db.update(users).set({
        googleSub: payload.sub,
        name: nameToKeep,
        role: "admin",
        lastSignInAt: signedInAt,
      }).where(eq(users.id, byEmail.id));
      return {
        user: {
          ...byEmail,
          googleSub: payload.sub,
          name: nameToKeep,
          role: "admin" as const,
          lastSignInAt: signedInAt,
        },
        created: false,
      };
    }
    throw new Error("GOOGLE_ACCOUNT_CONFLICT");
  }

  try {
    const [created] = await db.insert(users).values({
      googleSub: payload.sub,
      email,
      name,
      role: isConfiguredGoogleAdmin(email) ? "admin" : "user",
      passwordHash: null,
      lastSignInAt: new Date(),
    }).$returningId();
    const [user] = await db.select().from(users).where(eq(users.id, created.id)).limit(1);
    if (!user) throw new Error("Google account creation failed");
    return { user, created: true };
  } catch (error) {
    const [concurrentLogin] = await db.select().from(users)
      .where(eq(users.googleSub, payload.sub))
      .limit(1);
    if (!concurrentLogin) throw error;
    const signedInAt = new Date();
    await db.update(users).set({ lastSignInAt: signedInAt }).where(eq(users.id, concurrentLogin.id));
    return { user: { ...concurrentLogin, lastSignInAt: signedInAt }, created: false };
  }
}

async function hasCompanyAccess(userId: number) {
  const db = getDb();
  const [owned, membership] = await Promise.all([
    db.select({ id: companies.id }).from(companies).where(eq(companies.ownerUserId, userId)).limit(1),
    db.select({ id: companyMemberships.id }).from(companyMemberships).where(and(
      eq(companyMemberships.userId, userId),
      eq(companyMemberships.status, "active"),
    )).limit(1),
  ]);
  return owned.length > 0 || membership.length > 0;
}

export function buildGoogleAuthorizationUrl(
  config: NonNullable<ReturnType<typeof getGoogleConfig>>,
  state: string,
  nonce: string,
  codeVerifier: string,
  loginHint = process.env.GOOGLE_LOGIN_HINT,
) {
  const authorizationUrl = new URL(GOOGLE_AUTH_ENDPOINT);
  const authorizationParameters = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    nonce,
    code_challenge: createHash("sha256").update(codeVerifier).digest("base64url"),
    code_challenge_method: "S256",
    prompt: "select_account",
  });
  const normalizedLoginHint = loginHint?.trim();
  if (normalizedLoginHint && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedLoginHint)) {
    authorizationParameters.set("login_hint", normalizedLoginHint);
  }
  authorizationUrl.search = authorizationParameters.toString();
  return authorizationUrl;
}

export const googleAuthApp = new Hono();

googleAuthApp.get("/start", async (c) => {
  const config = getGoogleConfig();
  if (!config) return c.redirect("/login?auth=google_not_configured", 302);

  const state = createOpaqueToken();
  const browserToken = createOpaqueToken();
  const nonce = createOpaqueToken();
  const codeVerifier = createOpaqueToken();
  const now = new Date();
  const db = getDb();
  await db.delete(googleAuthTransactions).where(lt(googleAuthTransactions.expiresAt, now));
  await db.insert(googleAuthTransactions).values({
    stateHash: hash(state),
    browserHash: hash(browserToken),
    nonce,
    codeVerifier,
    expiresAt: new Date(now.getTime() + FLOW_TTL_MS),
  });

  const authorizationUrl = buildGoogleAuthorizationUrl(config, state, nonce, codeVerifier);

  c.header("set-cookie", cookie.serialize(FLOW_COOKIE, browserToken, flowCookieOptions(new URL(c.req.url))));
  return c.redirect(authorizationUrl.toString(), 302);
});

googleAuthApp.get("/callback", async (c) => {
  const config = getGoogleConfig();
  const requestUrl = new URL(c.req.url);
  const responseHeaders = new Headers();
  const fail = (reason: string) => {
    clearFlowCookie(requestUrl, responseHeaders);
    return redirectToApp(config?.appOrigin ?? null, `/login?auth=${reason}`, responseHeaders);
  };
  if (!config) return fail("google_not_configured");

  const state = c.req.query("state") ?? "";
  const code = c.req.query("code") ?? "";
  const providerError = c.req.query("error");
  const browserToken = cookie.parse(c.req.header("cookie") ?? "")[FLOW_COOKIE] ?? "";
  if (!OpaqueTokenPattern.test(state) || !OpaqueTokenPattern.test(browserToken)) {
    return fail("google_failed");
  }

  try {
    const transaction = await consumeTransaction(state, browserToken);
    if (!transaction) return fail("google_failed");
    if (providerError) return fail("google_cancelled");
    if (!code) return fail("google_failed");

    const idToken = await exchangeCode(code, transaction.codeVerifier, config);
    const { user } = await getOrCreateUser(idToken, transaction.nonce);
    const hasAccess = await hasCompanyAccess(user.id);
    await createSession(user.id, c.req.raw.headers, responseHeaders);
    clearFlowCookie(requestUrl, responseHeaders);
    return redirectToApp(config.appOrigin, hasAccess ? "/dashboard" : "/register", responseHeaders);
  } catch (error) {
    if (error instanceof Error && error.message === "GOOGLE_ACCOUNT_CONFLICT") {
      return fail("google_account_conflict");
    }
    return fail("google_failed");
  }
});
