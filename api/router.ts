import { authRouter } from "./auth-router";
import { planRouter, companyRouter, subscriptionRouter, transactionRouter, adminRouter } from "./saas-router";
import { partnerRouter } from "./partner-router";
import { clientRouter, productRouter } from "./commercial-router";
import { paymentRouter } from "./payment-router";
import { documentRouter } from "./document-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  plan: planRouter,
  company: companyRouter,
  subscription: subscriptionRouter,
  transaction: transactionRouter,
  payment: paymentRouter,
  admin: adminRouter,
  partner: partnerRouter,
  customer: clientRouter,
  product: productRouter,
  document: documentRouter,
});

export type AppRouter = typeof appRouter;
