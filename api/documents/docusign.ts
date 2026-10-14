import { SignJWT, importPKCS8 } from "jose";
import { TRPCError } from "@trpc/server";

let cachedToken: { value: string; expiresAt: number } | undefined;

function config() {
  const integrationKey = process.env.DOCUMENTS_DOCUSIGN_INTEGRATION_KEY;
  const userId = process.env.DOCUMENTS_DOCUSIGN_USER_ID;
  const accountId = process.env.DOCUMENTS_DOCUSIGN_ACCOUNT_ID;
  const privateKey = process.env.DOCUMENTS_DOCUSIGN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const oauthHost = process.env.DOCUMENTS_DOCUSIGN_OAUTH_HOST || "account-d.docusign.com";
  const baseUri = process.env.DOCUMENTS_DOCUSIGN_BASE_URI || (oauthHost === "account.docusign.com" ? "" : "https://demo.docusign.net");
  if (!integrationKey || !userId || !accountId || !privateKey || !["account-d.docusign.com", "account.docusign.com"].includes(oauthHost)) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "La connexion DocuSign n’est pas configurée." });
  }
  const apiUrl = baseUri ? new URL(baseUri) : null;
  if (!apiUrl || apiUrl.protocol !== "https:" || !/(^|\.)docusign\.net$/i.test(apiUrl.hostname)) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "L’URL API DocuSign HTTPS doit être configurée pour ce compte." });
  }
  return { integrationKey, userId, accountId, privateKey, oauthHost, baseUri: baseUri.replace(/\/$/, "") };
}

export function isDocuSignConfigured() {
  return Boolean(
    process.env.DOCUMENTS_DOCUSIGN_INTEGRATION_KEY
    && process.env.DOCUMENTS_DOCUSIGN_USER_ID
    && process.env.DOCUMENTS_DOCUSIGN_ACCOUNT_ID
    && process.env.DOCUMENTS_DOCUSIGN_PRIVATE_KEY
    && process.env.DOCUMENTS_DOCUSIGN_BASE_URI,
  );
}

async function accessToken() {
  const cfg = config();
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return { ...cfg, token: cachedToken.value };
  const now = Math.floor(Date.now() / 1000);
  const key = await importPKCS8(cfg.privateKey, "RS256");
  const assertion = await new SignJWT({})
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(cfg.integrationKey)
    .setSubject(cfg.userId)
    .setAudience(cfg.oauthHost)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);
  const response = await fetch(`https://${cfg.oauthHost}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion, scope: "signature impersonation" }),
    signal: AbortSignal.timeout(15_000),
  }).catch(() => null);
  if (!response?.ok) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "DocuSign n’a pas accordé l’accès. Vérifiez le consentement JWT et les identifiants." });
  const data = await response.json().catch(() => null) as { access_token?: string; expires_in?: number } | null;
  if (!data?.access_token) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "DocuSign n’a pas renvoyé de jeton utilisable." });
  cachedToken = { value: data.access_token, expiresAt: Date.now() + Math.min(data.expires_in ?? 3600, 3600) * 1000 };
  return { ...cfg, token: data.access_token };
}

export async function sendEnvelopeForSignature(input: {
  transactionId: string;
  documentTitle: string;
  documentBase64: string;
  signerName: string;
  signerEmail: string;
  anchorText: string;
}) {
  const cfg = await accessToken();
  const response = await fetch(`${cfg.baseUri}/restapi/v2.1/accounts/${encodeURIComponent(cfg.accountId)}/envelopes`, {
    method: "POST",
    headers: { authorization: `Bearer ${cfg.token}`, "content-type": "application/json" },
    body: JSON.stringify({
      transactionId: input.transactionId,
      emailSubject: `Signature demandée : ${input.documentTitle}`,
      documents: [{ documentBase64: input.documentBase64, name: input.documentTitle.slice(0, 100), fileExtension: "pdf", documentId: "1" }],
      recipients: {
        signers: [{
          email: input.signerEmail,
          name: input.signerName,
          recipientId: "1",
          routingOrder: "1",
          tabs: { signHereTabs: [{ anchorString: input.anchorText, anchorUnits: "pixels", anchorXOffset: "0", anchorYOffset: "0", anchorIgnoreIfNotPresent: "false" }] },
        }],
      },
      status: "sent",
    }),
    signal: AbortSignal.timeout(30_000),
  }).catch(() => null);
  if (!response?.ok) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "DocuSign n’a pas accepté la demande. Vérifiez le document, l’ancre de signature et le compte." });
  const envelope = await response.json().catch(() => null) as { envelopeId?: string; status?: string } | null;
  if (!envelope?.envelopeId || envelope.status !== "sent") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "DocuSign n’a pas confirmé l’envoi de l’enveloppe." });
  return { envelopeId: envelope.envelopeId, status: envelope.status };
}

export async function getEnvelopeStatus(envelopeId: string) {
  const cfg = await accessToken();
  const response = await fetch(`${cfg.baseUri}/restapi/v2.1/accounts/${encodeURIComponent(cfg.accountId)}/envelopes/${encodeURIComponent(envelopeId)}`, {
    headers: { authorization: `Bearer ${cfg.token}` },
    signal: AbortSignal.timeout(15_000),
  }).catch(() => null);
  if (!response?.ok) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Impossible de récupérer le statut DocuSign pour le moment." });
  const body = await response.json().catch(() => null) as { status?: string; completedDateTime?: string } | null;
  if (!body?.status) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "DocuSign n’a pas renvoyé de statut d’enveloppe." });
  return { status: body.status.toLowerCase(), completedAt: body.completedDateTime ? new Date(body.completedDateTime) : null };
}
