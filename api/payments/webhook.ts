import type { Context } from "hono";
import { and, eq, inArray } from "drizzle-orm";
import { transactions, subscriptions } from "@db/schema";
import { getDb } from "../queries/connection";
import { getPaymentGateway, type VerifiedPaymentEvent } from "./gateway";

const internalReferencePrefix = "IDIBAGES-TX-";

function getTransactionId(internalReference: string) {
  if (!internalReference.startsWith(internalReferencePrefix)) return null;
  const id = Number(internalReference.slice(internalReferencePrefix.length));
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function addBillingCycle(from: Date, cycle: "monthly" | "yearly") {
  const end = new Date(from);
  if (cycle === "yearly") end.setFullYear(end.getFullYear() + 1);
  else end.setMonth(end.getMonth() + 1);
  return end;
}

export function createPaymentWebhookHandler() {
  return async (c: Context) => {
    const gateway = getPaymentGateway();
    if (!gateway) return c.json({ error: "Payment provider is not configured" }, 503);

    let event: VerifiedPaymentEvent;
    try {
      const rawBody = new Uint8Array(await c.req.raw.arrayBuffer());
      event = await gateway.verifyCallback({ headers: c.req.raw.headers, rawBody });
    } catch (error) {
      console.warn("[payments] Provider callback rejected", error);
      return c.json({ error: "Payment callback could not be verified" }, 401);
    }

    const transactionId = getTransactionId(event.internalReference);
    if (!transactionId) return c.json({ error: "Invalid payment reference" }, 400);
    if (event.currency !== "XAF") return c.json({ error: "Unsupported payment currency" }, 422);
    if (!Number.isSafeInteger(event.amountXAF) || event.amountXAF <= 0) {
      return c.json({ error: "Invalid payment amount" }, 422);
    }
    if (!event.providerReference.trim() || event.providerReference.length > 255) {
      return c.json({ error: "Invalid provider transaction reference" }, 422);
    }
    if (!["succeeded", "failed", "pending"].includes(event.status)) {
      return c.json({ error: "Invalid provider payment status" }, 422);
    }

    try {
      const db = getDb();
      const result = await db.transaction(async (tx) => {
        const [transaction] = await tx.select().from(transactions)
          .where(eq(transactions.id, transactionId)).limit(1).for("update");
        if (!transaction) return { kind: "missing" as const };

        if (transaction.amountXAF !== event.amountXAF) return { kind: "amount-mismatch" as const };
        if (transaction.status === "completed" && transaction.isVerified) {
          return transaction.providerTransactionId === event.providerReference
            ? { kind: "duplicate" as const }
            : { kind: "already-confirmed" as const };
        }
        if (transaction.status !== "pending") return { kind: "not-pending" as const };
        if (event.status === "pending") return { kind: "pending" as const };

        if (event.status === "failed") {
          await tx.update(transactions).set({
            status: "failed",
            paymentProvider: gateway.name,
            providerTransactionId: event.providerReference,
          }).where(and(eq(transactions.id, transaction.id), eq(transactions.status, "pending")));
          if (transaction.subscriptionId) {
            await tx.update(subscriptions).set({ status: "expired" })
              .where(and(
                eq(subscriptions.id, transaction.subscriptionId),
                eq(subscriptions.companyId, transaction.companyId),
                eq(subscriptions.status, "past_due"),
              ));
          }
          return { kind: "failed" as const };
        }

        if (transaction.type !== "subscription" && transaction.type !== "renewal" && transaction.type !== "upgrade") {
          return { kind: "unsupported-type" as const };
        }
        if (!transaction.subscriptionId) return { kind: "missing-subscription" as const };

        const [subscription] = await tx.select().from(subscriptions).where(and(
          eq(subscriptions.id, transaction.subscriptionId),
          eq(subscriptions.companyId, transaction.companyId),
        )).limit(1).for("update");
        if (!subscription) return { kind: "missing-subscription" as const };

        const paidAt = new Date();
        let checkoutDetails: { replacesSubscriptionId?: number | null; periodEndAt?: string | null } = {};
        try {
          checkoutDetails = transaction.description ? JSON.parse(transaction.description) : {};
        } catch {
          checkoutDetails = {};
        }
        const periodStart = paidAt;
        const requestedPeriodEnd = checkoutDetails.periodEndAt ? new Date(checkoutDetails.periodEndAt) : null;
        const periodEnd = requestedPeriodEnd && Number.isFinite(requestedPeriodEnd.getTime()) && requestedPeriodEnd > paidAt
          ? requestedPeriodEnd
          : addBillingCycle(periodStart, subscription.billingCycle);

        await tx.update(transactions).set({
          status: "completed",
          isVerified: true,
          paymentProvider: gateway.name,
          providerTransactionId: event.providerReference,
          paidAt,
        }).where(and(eq(transactions.id, transaction.id), eq(transactions.status, "pending")));

        await tx.update(subscriptions).set({
          status: "active",
          trialEndsAt: null,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          lastPaymentAt: paidAt,
          nextPaymentAt: periodEnd,
          autoRenew: false,
        }).where(eq(subscriptions.id, subscription.id));

        const previousId = checkoutDetails.replacesSubscriptionId;
        if (transaction.type === "upgrade" && typeof previousId === "number" && Number.isSafeInteger(previousId) && previousId !== subscription.id) {
          await tx.update(subscriptions).set({
            status: "cancelled",
            cancelledAt: paidAt,
            cancelReason: "Remplacé après confirmation du paiement du nouveau forfait.",
            autoRenew: false,
          }).where(and(
            eq(subscriptions.id, previousId),
            eq(subscriptions.companyId, transaction.companyId),
            inArray(subscriptions.status, ["active", "trial"]),
          ));
        }

        return { kind: "confirmed" as const };
      });

      switch (result.kind) {
        case "confirmed":
        case "failed":
        case "duplicate":
          return c.json({ received: true }, 200);
        case "pending":
          return c.json({ received: true, pending: true }, 202);
        case "missing":
          return c.json({ error: "Payment reference not found" }, 404);
        case "amount-mismatch":
          return c.json({ error: "Payment amount does not match" }, 422);
        case "already-confirmed":
          return c.json({ error: "Payment was already confirmed with a different provider reference" }, 409);
        case "not-pending":
          return c.json({ error: "Payment is not pending" }, 409);
        case "unsupported-type":
          return c.json({ error: "This transaction type is not wired for provider confirmation" }, 422);
        case "missing-subscription":
          return c.json({ error: "Subscription reference not found" }, 422);
      }
    } catch (error) {
      console.error("[payments] Confirmed callback could not be saved", error);
      return c.json({ error: "Verified payment callback could not be saved" }, 500);
    }
  };
}
