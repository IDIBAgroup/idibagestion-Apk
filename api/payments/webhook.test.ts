import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { createPaymentWebhookHandler } from "./webhook";

describe("payment webhook", () => {
  it("stays unavailable while no payment provider is registered", async () => {
    const app = new Hono();
    app.post("/webhook", createPaymentWebhookHandler());

    const response = await app.request("/webhook", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "succeeded" }),
    });

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "Payment provider is not configured" });
  });
});
