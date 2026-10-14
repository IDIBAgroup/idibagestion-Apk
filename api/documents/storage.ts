import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { TRPCError } from "@trpc/server";
import { isDocuSignConfigured } from "./docusign";

const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
const allowedTypes = {
  "application/pdf": { ext: "pdf", signature: Buffer.from("%PDF-") },
  "image/png": { ext: "png", signature: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) },
  "image/jpeg": { ext: "jpg", signature: Buffer.from([0xff, 0xd8, 0xff]) },
} as const;

type AllowedMime = keyof typeof allowedTypes;

function storageConfig() {
  const bucket = process.env.DOCUMENTS_S3_BUCKET;
  const accessKeyId = process.env.DOCUMENTS_S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.DOCUMENTS_S3_SECRET_ACCESS_KEY;
  if (!bucket || !accessKeyId || !secretAccessKey) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Le stockage privé des documents n’est pas configuré." });
  }
  return {
    bucket,
    client: new S3Client({
      region: process.env.DOCUMENTS_S3_REGION || "us-east-1",
      endpoint: process.env.DOCUMENTS_S3_ENDPOINT || undefined,
      forcePathStyle: Boolean(process.env.DOCUMENTS_S3_ENDPOINT),
      credentials: { accessKeyId, secretAccessKey },
    }),
  };
}

export function documentServiceCapabilities() {
  const s3Ready = Boolean(process.env.DOCUMENTS_S3_BUCKET && process.env.DOCUMENTS_S3_ACCESS_KEY_ID && process.env.DOCUMENTS_S3_SECRET_ACCESS_KEY);
  const scanReady = Boolean(process.env.DOCUMENTS_ANTIVIRUS_URL && process.env.DOCUMENTS_ANTIVIRUS_TOKEN);
  const emailReady = Boolean(process.env.DOCUMENTS_EMAIL_API_KEY && process.env.DOCUMENTS_EMAIL_FROM);
  return {
    upload: s3Ready && scanReady,
    download: s3Ready,
    otp: emailReady,
    comments: true,
    providerSignature: isDocuSignConfigured(),
  };
}

export async function storeScannedDocument(input: {
  companyId: number;
  documentId: number;
  version: number;
  mimeType: string;
  bytes: Buffer;
}) {
  if (input.bytes.byteLength === 0 || input.bytes.byteLength > MAX_DOCUMENT_BYTES) {
    throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Le fichier doit peser au maximum 10 Mo." });
  }
  if (!(input.mimeType in allowedTypes)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Formats acceptés : PDF, PNG ou JPEG." });
  }
  const mimeType = input.mimeType as AllowedMime;
  const signature = allowedTypes[mimeType].signature;
  if (!input.bytes.subarray(0, signature.byteLength).equals(signature)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Le contenu du fichier ne correspond pas à son format déclaré." });
  }

  const scannerUrl = process.env.DOCUMENTS_ANTIVIRUS_URL;
  const scannerToken = process.env.DOCUMENTS_ANTIVIRUS_TOKEN;
  if (!scannerUrl || !scannerToken) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "L’analyse antivirus doit être configurée avant tout téléversement." });
  }
  let scanResponse: Response;
  try {
    scanResponse = await fetch(scannerUrl, {
      method: "POST",
      headers: { authorization: `Bearer ${scannerToken}`, "content-type": mimeType },
      body: new Uint8Array(input.bytes),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Le service antivirus est indisponible ; le fichier n’a pas été enregistré." });
  }
  if (!scanResponse.ok) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "L’analyse antivirus a échoué ; le fichier n’a pas été enregistré." });
  }
  const scanResult = await scanResponse.json().catch(() => null) as { clean?: boolean; status?: string } | null;
  if (scanResult?.clean !== true && scanResult?.status !== "clean") {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Le fichier a été refusé par l’analyse antivirus." });
  }

  const { bucket, client } = storageConfig();
  const key = `companies/${input.companyId}/documents/${input.documentId}/v${input.version}/${randomUUID()}.${allowedTypes[mimeType].ext}`;
  try {
    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: input.bytes,
      ContentType: mimeType,
      ServerSideEncryption: "AES256",
      Metadata: { scanned: "clean", scanner: "configured-antivirus" },
    }));
  } catch {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Le stockage privé n’a pas accepté le fichier." });
  }
  return { key, client, bucket };
}

export async function deleteStoredDocument(key: string) {
  const { bucket, client } = storageConfig();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export async function createPrivateDownloadUrl(key: string, filename: string) {
  const { bucket, client } = storageConfig();
  return getSignedUrl(client, new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${filename.replace(/[\r\n"\\]/g, "_")}"`,
  }), { expiresIn: 60 });
}

export async function readPrivateDocument(key: string) {
  const { bucket, client } = storageConfig();
  const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!response.Body) throw new TRPCError({ code: "NOT_FOUND", message: "Fichier introuvable dans le stockage privé." });
  const bytes = await response.Body.transformToByteArray();
  if (bytes.byteLength > MAX_DOCUMENT_BYTES) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Le fichier est trop volumineux pour l’envoi à DocuSign." });
  return Buffer.from(bytes);
}

export const MAX_DOCUMENT_UPLOAD_BYTES = MAX_DOCUMENT_BYTES;
