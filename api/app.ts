import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { serialize } from "cookie";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { createPaymentWebhookHandler } from "./payments/webhook";
import { googleAuthApp } from "./google-auth";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));
app.get("/api/auth/cleanup-legacy-cookies", (c) => {
  const secure = process.env.NODE_ENV === "production" || new URL(c.req.url).protocol === "https:";
  for (const [name, path] of [
    ["kimi_sid", "/"],
    ["kimi_oauth_state", "/api/oauth/callback"],
    ["kimi_oauth_return", "/api/oauth/callback"],
  ]) {
    c.header("Set-Cookie", serialize(name, "", {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path,
      maxAge: 0,
    }), { append: true });
  }
  return c.json({ success: true });
});
app.route("/api/auth/google", googleAuthApp);
app.post("/api/payments/webhook", createPaymentWebhookHandler());
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;
