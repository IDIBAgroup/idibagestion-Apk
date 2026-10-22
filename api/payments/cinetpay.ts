import { createHmac, timingSafeEqual } from 'node:crypto';
import type { PaymentGateway, PaymentStartRequest, VerifiedPaymentEvent } from './gateway';

type CinetPayConfig = {
  apiKey: string;
  siteId: string;
  secretKey: string;
  appUrl: string;
};

type CinetPayApiResponse = {
  code?: string;
  message?: string;
  data?: {
    payment_url?: string;
    operator_id?: string | null;
    amount?: string | number;
    currency?: string;
    status?: string;
  };
};

const checkoutApi = 'https://api-checkout.cinetpay.com/v2/payment';

const callbackFields = [
  'cpm_site_id',
  'cpm_trans_id',
  'cpm_trans_date',
  'cpm_amount',
  'cpm_currency',
  'signature',
  'payment_method',
  'cel_phone_num',
  'cpm_phone_prefixe',
  'cpm_language',
  'cpm_version',
  'cpm_payment_config',
  'cpm_page_action',
  'cpm_custom',
  'cpm_designation',
  'cpm_error_message',
] as const;

export function createCinetPayCallbackToken(fields: URLSearchParams, secretKey: string) {
  const payload = callbackFields.map((field) => fields.get(field) ?? '').join('');
  return createHmac('sha256', secretKey).update(payload).digest('hex');
}

function safeTokenEqual(received: string, expected: string) {
  if (!/^[a-f0-9]{64}$/i.test(received) || !/^[a-f0-9]{64}$/i.test(expected)) return false;
  return timingSafeEqual(Buffer.from(received, 'hex'), Buffer.from(expected, 'hex'));
}

export class CinetPayGateway implements PaymentGateway {
  readonly name = 'cinetpay';

  constructor(private readonly config: CinetPayConfig) {}

  async startPayment(request: PaymentStartRequest) {
    if (request.currency !== 'XAF') throw new Error('CinetPay currency is not supported by the current subscription ledger.');
    if (!Number.isSafeInteger(request.amountXAF) || request.amountXAF < 100 || request.amountXAF % 5 !== 0) {
      throw new Error('CinetPay requires a whole XAF amount of at least 100, divisible by 5.');
    }
    if (request.method !== 'mobile_money' && request.method !== 'card') {
      throw new Error('CinetPay checkout supports card and Mobile Money for subscription payments.');
    }
    const response = await fetch(checkoutApi, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        apikey: this.config.apiKey,
        site_id: this.config.siteId,
        transaction_id: request.internalReference,
        amount: request.amountXAF,
        currency: request.currency,
        description: 'Abonnement IDIBAGES',
        return_url: request.returnUrl ?? new URL('/subscription', this.config.appUrl).toString(),
        notify_url: request.callbackUrl,
        channels: request.method === 'card' ? 'CREDIT_CARD' : 'MOBILE_MONEY',
        lang: 'fr',
        metadata: request.internalReference,
        customer_email: request.customerEmail,
        customer_phone_number: request.phone,
      }),
    });
    const payload = await response.json() as CinetPayApiResponse;
    if (!response.ok || payload.code !== '201' || !payload.data?.payment_url) {
      throw new Error('CinetPay could not create the checkout session.');
    }
    return { providerReference: request.internalReference, checkoutUrl: payload.data.payment_url };
  }

  async verifyCallback({ headers, rawBody }: { headers: Headers; rawBody: Uint8Array }): Promise<VerifiedPaymentEvent> {
    const form = new URLSearchParams(new TextDecoder().decode(rawBody));
    const receivedToken = headers.get('x-token') ?? '';
    const expectedToken = createCinetPayCallbackToken(form, this.config.secretKey);
    if (!safeTokenEqual(receivedToken, expectedToken)) throw new Error('Invalid CinetPay callback HMAC.');

    const siteId = form.get('cpm_site_id') ?? '';
    const transactionId = form.get('cpm_trans_id') ?? '';
    if (siteId !== this.config.siteId || !transactionId) throw new Error('CinetPay callback reference is invalid.');

    // The notification payload is only a signal. Always fetch the authoritative
    // transaction status from CinetPay before granting access.
    const response = await fetch(checkoutApi + '/check', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ apikey: this.config.apiKey, site_id: this.config.siteId, transaction_id: transactionId }),
    });
    const payload = await response.json() as CinetPayApiResponse;
    if (!response.ok || !payload.data) throw new Error('CinetPay transaction could not be verified.');

    const data = payload.data;
    if (data.currency !== 'XAF') throw new Error('CinetPay returned a currency not supported by this subscription ledger.');
    const status = payload.code === '00' && data.status === 'ACCEPTED'
      ? 'succeeded'
      : ['REFUSED', 'CANCELLED', 'FAILED'].includes(data.status ?? '')
        ? 'failed'
        : 'pending';
    const amountXAF = Number(data.amount);
    if (!Number.isSafeInteger(amountXAF)) throw new Error('CinetPay returned an invalid amount.');
    return {
      internalReference: transactionId,
      providerReference: data.operator_id || transactionId,
      amountXAF,
      currency: 'XAF',
      status,
    };
  }
}

export function getCinetPayConfigFromEnv(): CinetPayConfig | null {
  const { CINETPAY_API_KEY: apiKey, CINETPAY_SITE_ID: siteId, CINETPAY_SECRET_KEY: secretKey } = process.env;
  const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (!apiKey || !siteId || !secretKey || !appUrl) return null;
  try {
    const parsed = new URL(appUrl);
    if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') return null;
  } catch {
    return null;
  }
  return { apiKey, siteId, secretKey, appUrl };
}
