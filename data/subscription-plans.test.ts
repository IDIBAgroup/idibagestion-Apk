import { describe, expect, it } from 'vitest';
import { ANNUAL_DISCOUNT_PERCENT, SUBSCRIPTION_PACKS } from './subscription-plans';

describe('IDIBAGES subscription catalog', () => {
  it('provides the four published packs with the requested monthly prices and user quotas', () => {
    expect(SUBSCRIPTION_PACKS.map(({ slug }) => slug)).toEqual(['starter', 'pro', 'business', 'enterprise']);
    expect(SUBSCRIPTION_PACKS.map(({ priceXAF }) => priceXAF.monthly)).toEqual([5000, 15000, 30000, 0]);
    expect(SUBSCRIPTION_PACKS.map(({ limits }) => limits.users)).toEqual([2, 5, 15, 0]);
    expect(SUBSCRIPTION_PACKS.find(({ slug }) => slug === 'pro')?.popular).toBe(true);
    expect(SUBSCRIPTION_PACKS.find(({ slug }) => slug === 'enterprise')?.enterprise).toBe(true);
  });

  it('prices annual billing at a configurable 20 percent discount', () => {
    expect(ANNUAL_DISCOUNT_PERCENT).toBe(20);
    for (const pack of SUBSCRIPTION_PACKS.filter(({ enterprise }) => !enterprise)) {
      expect(pack.priceXAF.yearly).toBe(pack.priceXAF.monthly * 12 * (1 - ANNUAL_DISCOUNT_PERCENT / 100));
    }
  });
});
