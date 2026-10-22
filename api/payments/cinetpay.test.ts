import { afterEach, describe, expect, it, vi } from 'vitest';
import { CinetPayGateway, createCinetPayCallbackToken } from './cinetpay';

const config = {
  apiKey: 'test-api-key',
  siteId: 'site-123',
  secretKey: 'test-secret',
  appUrl: 'https://idibages.example',
};

function callbackForm() {
  const fields = new URLSearchParams();
  for (const [key, value] of Object.entries({
    cpm_site_id: 'site-123',
    cpm_trans_id: 'IDIBAGES-TX-42',
    cpm_trans_date: '2026-10-15 15:00:00',
    cpm_amount: '5000',
    cpm_currency: 'XAF',
    signature: 'provider-signature',
    payment_method: 'OM',
    cel_phone_num: '',
    cpm_phone_prefixe: '',
    cpm_language: 'fr',
    cpm_version: 'V4',
    cpm_payment_config: 'Single',
    cpm_page_action: 'Payment',
    cpm_custom: 'IDIBAGES-TX-42',
    cpm_designation: 'Abonnement IDIBAGES',
    cpm_error_message: '',
  })) fields.set(key, value);
  return fields;
}

afterEach(() => vi.unstubAllGlobals());

describe('CinetPay payment adapter', () => {
  it('uses the authenticated callback only as a signal and verifies the transaction with the provider API', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      code: '00',
      data: { amount: '5000', currency: 'XAF', status: 'ACCEPTED', operator_id: 'OP-991' },
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const gateway = new CinetPayGateway(config);
    const fields = callbackForm();
    const event = await gateway.verifyCallback({
      headers: new Headers({ 'x-token': createCinetPayCallbackToken(fields, config.secretKey) }),
      rawBody: new TextEncoder().encode(fields.toString()),
    });

    expect(event).toEqual({
      internalReference: 'IDIBAGES-TX-42',
      providerReference: 'OP-991',
      amountXAF: 5000,
      currency: 'XAF',
      status: 'succeeded',
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(String(fetchMock.mock.calls[0][0])).toBe('https://api-checkout.cinetpay.com/v2/payment/check');
  });

  it('rejects an invalid HMAC before contacting CinetPay', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const fields = callbackForm();
    await expect(new CinetPayGateway(config).verifyCallback({
      headers: new Headers({ 'x-token': 'invalid' }),
      rawBody: new TextEncoder().encode(fields.toString()),
    })).rejects.toThrow('Invalid CinetPay callback HMAC');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('only starts card or Mobile Money payments in XAF with valid merchant amounts', async () => {
    const gateway = new CinetPayGateway(config);
    await expect(gateway.startPayment({
      internalReference: 'IDIBAGES-TX-42', amountXAF: 5001, currency: 'XAF',
      method: 'card', callbackUrl: 'https://idibages.example/api/payments/webhook',
    })).rejects.toThrow('divisible by 5');
  });
});
