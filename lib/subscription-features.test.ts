import { describe, expect, it } from 'vitest';
import { DEFAULT_PLAN_FEATURES, parseSubscriptionFeatureKeys, subscriptionFeatureForRoute } from './subscription-features';

describe('subscription module access catalog', () => {
  it('grants a cumulative module set as plans increase', () => {
    expect(DEFAULT_PLAN_FEATURES.starter).toContain('invoices');
    expect(DEFAULT_PLAN_FEATURES.starter).not.toContain('accounting');
    expect(DEFAULT_PLAN_FEATURES.pro).toContain('projects');
    expect(DEFAULT_PLAN_FEATURES.pro).not.toContain('payroll');
    expect(DEFAULT_PLAN_FEATURES.business).toContain('accounting');
    expect(DEFAULT_PLAN_FEATURES.enterprise).toContain('multi_company');
    expect(DEFAULT_PLAN_FEATURES.enterprise).toContain('advanced_security');
  });

  it('accepts only known, unique module keys from stored JSON', () => {
    expect(parseSubscriptionFeatureKeys('["customers","invoices","invoices","not-a-feature"]')).toEqual(['customers', 'invoices']);
    expect(parseSubscriptionFeatureKeys('invalid-json')).toEqual([]);
  });

  it('maps module URLs to the same entitlement keys enforced by navigation and route guards', () => {
    expect(subscriptionFeatureForRoute('/finance/accounting')).toBe('accounting');
    expect(subscriptionFeatureForRoute('/hr/payroll')).toBe('payroll');
    expect(subscriptionFeatureForRoute('/commercial/delivery-notes')).toBe('delivery_notes');
    expect(subscriptionFeatureForRoute('/settings')).toBeUndefined();
  });
});
