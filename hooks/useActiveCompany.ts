import { useEffect } from 'react';
import { trpc } from '@/providers/trpc';
import { useCompanySelectionStore } from '@/stores/companySelectionStore';

export function useActiveCompany() {
  const query = trpc.company.mine.useQuery(undefined, {
    retry: false,
    staleTime: 30_000,
  });
  const activeCompanyId = useCompanySelectionStore((state) => state.activeCompanyId);
  const setActiveCompanyId = useCompanySelectionStore((state) => state.setActiveCompanyId);
  const companies = query.data ?? [];
  const company = companies.find((item) => item.id === activeCompanyId) ?? companies[0];

  useEffect(() => {
    if (company && activeCompanyId !== company.id) setActiveCompanyId(company.id);
  }, [company, activeCompanyId, setActiveCompanyId]);

  return { ...query, companies, company, companyId: company?.id };
}
