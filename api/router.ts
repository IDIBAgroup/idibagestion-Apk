import { authRouter } from "./auth-router";
import { planRouter, companyRouter, subscriptionRouter, transactionRouter, adminRouter } from "./saas-router";
import { partnerRouter } from "./partner-router";
import { clientRouter, productRouter } from "./commercial-router";
import { paymentRouter } from "./payment-router";
import { documentRouter } from "./document-router";
import { salesDocumentRouter } from "./sales-document-router";
import { invoiceReminderRouter } from "./invoice-reminder-router";
import { assetRouter } from "./asset-router";
import { expenseRouter } from "./expense-router";
import { departmentRouter } from "./department-router";
import { accountingRouter } from "./accounting-router";
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
  salesDocument: salesDocumentRouter,
  invoiceReminder: invoiceReminderRouter,
  asset: assetRouter,
  expense: expenseRouter,
  department: departmentRouter,
  accounting: accountingRouter,
});

export type AppRouter = typeof appRouter;
