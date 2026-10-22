export type PaymentMethod = 'mobile_money' | 'card' | 'bank_transfer' | 'cash';

export interface PaymentStartRequest {
  internalReference: string;
  amountXAF: number;
  currency: 'XAF';
  method: PaymentMethod;
  phone?: string;
  customerEmail?: string;
  callbackUrl: string;
  returnUrl?: string;
}

export interface VerifiedPaymentEvent {
  internalReference: string;
  providerReference: string;
  amountXAF: number;
  currency: 'XAF';
  status: 'succeeded' | 'failed' | 'pending';
}

/** A provider adapter must verify its callback against the provider before returning an event. */
export interface PaymentGateway {
  readonly name: string;
  startPayment(request: PaymentStartRequest): Promise<{
    providerReference: string;
    checkoutUrl?: string;
  }>;
  verifyCallback(request: { headers: Headers; rawBody: Uint8Array }): Promise<VerifiedPaymentEvent>;
}

let activeGateway: PaymentGateway | null = null;

export function registerPaymentGateway(gateway: PaymentGateway) {
  activeGateway = gateway;
}

export function getPaymentGateway() {
  return activeGateway;
}

export function getPaymentAvailability() {
  return {
    available: activeGateway !== null,
    provider: activeGateway?.name ?? null,
  };
}
