import { createRouter, publicQuery } from './middleware';
import { getPaymentAvailability } from './payments/gateway';

export const paymentRouter = createRouter({
  status: publicQuery.query(() => getPaymentAvailability()),
});
