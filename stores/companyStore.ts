import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ManagedCompany {
  id: string;
  name: string;
  sigle?: string;
  logo?: string;
  niu: string;
  rccm: string;
  capitalSocial: string;
  address: string;
  city: string;
  country: string;
  email: string;
  phone: string;
  primaryColor: string;
  secondaryColor: string;
  isMain?: boolean;
}

interface CompanyState {
  isMultiCompanyEnabled: boolean;
  maxCompaniesAllowed: number;
  activeCompanyId: string;
  companies: ManagedCompany[];
  
  // Actions
  setMultiCompanyEnabled: (enabled: boolean) => void;
  setMaxCompaniesAllowed: (max: number) => void;
  setActiveCompanyId: (id: string) => void;
  addCompany: (company: Omit<ManagedCompany, 'id'>) => boolean;
  updateCompany: (id: string, data: Partial<ManagedCompany>) => void;
  deleteCompany: (id: string) => void;
  getActiveCompany: () => ManagedCompany;
}

const DEFAULT_COMPANIES: ManagedCompany[] = [
  {
    id: 'comp-1',
    name: 'IDIBA GROUP SARL',
    sigle: 'IDIBA',
    logo: undefined,
    niu: 'M0123456789C',
    rccm: 'RC/DLA/2019/M/0847',
    capitalSocial: '10 000 000 FCFA',
    address: 'Rue Joffre, Immeuble IDIBA',
    city: 'Douala',
    country: 'Cameroun',
    email: 'contact@idibagroup.cm',
    phone: '+237 233 42 00 00',
    primaryColor: '#1F7A63',
    secondaryColor: '#3B82F6',
    isMain: true,
  },
  {
    id: 'comp-2',
    name: 'IDIBA TECH CAMEROUN S.A.',
    sigle: 'ITC',
    logo: undefined,
    niu: 'M08191244901A',
    rccm: 'RC/DLA/2021/B/1042',
    capitalSocial: '25 000 000 FCFA',
    address: 'Avenue Kennedy, Bâtiment Tech',
    city: 'Yaoundé',
    country: 'Cameroun',
    email: 'tech@idibagroup.cm',
    phone: '+237 690 11 22 33',
    primaryColor: '#3B82F6',
    secondaryColor: '#8B5CF6',
  },
  {
    id: 'comp-3',
    name: 'AFRIQUE INNOVATION ADVISORY',
    sigle: 'AIA',
    logo: undefined,
    niu: 'M0298124901B',
    rccm: 'RC/DLA/2023/A/0508',
    capitalSocial: '5 000 000 FCFA',
    address: 'Boulevard de la Liberté',
    city: 'Douala',
    country: 'Cameroun',
    email: 'advisory@afrique-innovation.cm',
    phone: '+237 677 88 99 00',
    primaryColor: '#F59E0B',
    secondaryColor: '#EC4899',
  }
];

export const useCompanyStore = create<CompanyState>()(
  persist(
    (set, get) => ({
      isMultiCompanyEnabled: true,
      maxCompaniesAllowed: 5,
      activeCompanyId: 'comp-1',
      companies: DEFAULT_COMPANIES,

      setMultiCompanyEnabled: (enabled) => set({ isMultiCompanyEnabled: enabled }),

      setMaxCompaniesAllowed: (max) => set({ maxCompaniesAllowed: max }),

      setActiveCompanyId: (id) => {
        const found = get().companies.find((c) => c.id === id);
        if (found) {
          set({ activeCompanyId: id });
        }
      },

      addCompany: (companyData) => {
        const state = get();
        if (state.companies.length >= state.maxCompaniesAllowed) {
          return false;
        }
        const newId = `comp-${Date.now()}`;
        const newCompany: ManagedCompany = {
          ...companyData,
          id: newId,
        };
        set((s) => ({
          companies: [...s.companies, newCompany],
          activeCompanyId: newId,
        }));
        return true;
      },

      updateCompany: (id, data) => {
        set((s) => ({
          companies: s.companies.map((c) => (c.id === id ? { ...c, ...data } : c)),
        }));
      },

      deleteCompany: (id) => {
        set((s) => {
          if (s.companies.length <= 1) return s; // Always keep at least 1
          const filtered = s.companies.filter((c) => c.id !== id);
          const newActive = s.activeCompanyId === id ? filtered[0].id : s.activeCompanyId;
          return {
            companies: filtered,
            activeCompanyId: newActive,
          };
        });
      },

      getActiveCompany: () => {
        const state = get();
        return state.companies.find((c) => c.id === state.activeCompanyId) || state.companies[0];
      },
    }),
    {
      name: 'idibages-company-store',
    }
  )
);
