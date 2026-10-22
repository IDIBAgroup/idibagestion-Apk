import { useMemo } from 'react';
import { trpc } from '@/providers/trpc';
import { useActiveCompany } from '@/hooks/useActiveCompany';

export function usePlatformFinancialSettings() {
  const { companyId } = useActiveCompany();
  const profile = trpc.company.profile.useQuery({ companyId: companyId ?? 0 }, {
    enabled: Boolean(companyId),
    staleTime: 60_000,
  });
  const taxRules = trpc.company.taxRules.useQuery({ companyId: companyId ?? 0 }, {
    enabled: Boolean(companyId),
    staleTime: 60_000,
  });
  const settings = useMemo(() => {
    const todayParts = new Intl.DateTimeFormat('en-CA', {
      timeZone: profile.data?.timezone ?? 'UTC',
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(new Date());
    const today = `${todayParts.find((part) => part.type === 'year')?.value}-${todayParts.find((part) => part.type === 'month')?.value}-${todayParts.find((part) => part.type === 'day')?.value}`;
    const countryCode = profile.data?.countryCode;
    const activeVatRule = taxRules.data?.find((rule) =>
      rule.isActive && rule.taxType === 'vat' && rule.countryCode === countryCode &&
      rule.effectiveFrom <= today && (!rule.effectiveTo || rule.effectiveTo >= today),
    );
    return {
      currency: profile.data?.currencyCode ?? 'XAF',
      currentDate: today,
      taxRate: activeVatRule ? activeVatRule.rateBasisPoints / 100 : 0,
      taxConfigured: Boolean(activeVatRule),
      taxRules: taxRules.data ?? [],
      countryCode: countryCode ?? 'CM',
      fiscalYearStartMonth: profile.data?.fiscalYearStartMonth ?? 1,
      fiscalYearStartDay: profile.data?.fiscalYearStartDay ?? 1,
      isLoading: profile.isLoading || taxRules.isLoading,
    };
  }, [profile.data, profile.isLoading, taxRules.data, taxRules.isLoading]);
  return settings;
}

export function formatPlatformCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency', currency, minimumFractionDigits: 0,
    }).format(amount);
  } catch {
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(amount);
  }
}
