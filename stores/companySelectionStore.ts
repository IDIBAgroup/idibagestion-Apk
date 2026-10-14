import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CompanySelectionState {
  activeCompanyId: number | null;
  setActiveCompanyId: (id: number) => void;
}

export const useCompanySelectionStore = create<CompanySelectionState>()(
  persist(
    (set) => ({
      activeCompanyId: null,
      setActiveCompanyId: (activeCompanyId) => set({ activeCompanyId }),
    }),
    { name: 'idibages-active-company' },
  ),
);
