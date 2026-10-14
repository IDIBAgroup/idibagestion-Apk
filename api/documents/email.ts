import { TRPCError } from "@trpc/server";

export function externalOtpEmailReady() {
  return Boolean(process.env.DOCUMENTS_EMAIL_API_KEY && process.env.DOCUMENTS_EMAIL_FROM);
}

export async function sendExternalAccessCode(email: string, code: string) {
  const apiKey = process.env.DOCUMENTS_EMAIL_API_KEY;
  const from = process.env.DOCUMENTS_EMAIL_FROM;
  if (!apiKey || !from) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Le service e-mail OTP n’est pas configuré." });
  }
  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      personalizations: [{ to: [{ email }] }],
      from: { email: from },
      subject: "Votre code d’accès documentaire IDIBA",
      content: [{ type: "text/plain", value: `Votre code d’accès est ${code}. Il expire dans 10 minutes. Si vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail.` }],
    }),
    signal: AbortSignal.timeout(12_000),
  }).catch(() => null);
  if (!response?.ok) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Le fournisseur e-mail n’a pas accepté l’envoi du code." });
  }
}
