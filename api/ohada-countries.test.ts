import { describe, expect, it } from 'vitest';
import { findOhadaCountry, getOhadaCountry, getOhadaCountryDefaults, OHADA_COUNTRIES, OHADA_INDUSTRIES } from '@/lib/ohada/countries';

describe('OHADA country registry', () => {
  it('contains the 17 current member states with a supported legal-tender default', () => {
    expect(OHADA_COUNTRIES).toHaveLength(17);
    expect(new Set(OHADA_COUNTRIES.map(({ code }) => code)).size).toBe(17);
    for (const country of OHADA_COUNTRIES) {
      expect(country.code).toMatch(/^[A-Z]{2}$/);
      expect(country.currency).toMatch(/^(XAF|XOF|KMF|CDF|GNF)$/);
      expect(country.timezone).toBeTruthy();
      expect(country.locale).toBeTruthy();
    }
  });

  it('uses each member state currency and SYSCOHADA defaults without assuming tax rates', () => {
    expect(getOhadaCountryDefaults('CM')).toMatchObject({ currencyCode: 'XAF', accountingFramework: 'SYSCOHADA_REVISED' });
    expect(getOhadaCountryDefaults('CI').currencyCode).toBe('XOF');
    expect(getOhadaCountryDefaults('KM').currencyCode).toBe('KMF');
    expect(getOhadaCountryDefaults('CD').currencyCode).toBe('CDF');
    expect(getOhadaCountryDefaults('GN').currencyCode).toBe('GNF');
    expect('taxRate' in getOhadaCountryDefaults('CM')).toBe(false);
  });

  it('normalizes accents for legacy country names and rejects non-OHADA codes', () => {
    expect(findOhadaCountry('Cameroun')?.code).toBe('CM');
    expect(findOhadaCountry('Cote d Ivoire')?.code).toBe('CI');
    expect(findOhadaCountry('RDC')?.code).toBe('CD');
    expect(findOhadaCountry('Côte d’Ivoire')?.code).toBe('CI');
    expect(getOhadaCountry('US')).toBeUndefined();
  });

  it('offers sectors across different company activities and a custom option', () => {
    const codes = OHADA_INDUSTRIES.map(({ code }) => code);
    expect(codes).toContain('manufacturing');
    expect(codes).toContain('retail');
    expect(codes).toContain('construction');
    expect(codes).toContain('other');
  });
});
