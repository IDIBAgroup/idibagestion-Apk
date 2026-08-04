import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { seedCompany } from '@/data/seed';

interface BrandingState {
  companyName: string;
  logo: string | undefined;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  saturation: number;
  lightness: number;
  updateBranding: (data: Partial<Omit<BrandingState, 'updateBranding' | 'resetToDefault'>>) => void;
  resetToDefault: () => void;
}

export const useBrandingStore = create<BrandingState>()(
  persist(
    (set) => ({
      companyName: seedCompany.name,
      logo: undefined,
      primaryColor: seedCompany.primaryColor,
      secondaryColor: seedCompany.secondaryColor,
      backgroundColor: '#0B0F14',
      saturation: 65,
      lightness: 50,

      updateBranding: (data) => set((state) => ({ ...state, ...data })),

      resetToDefault: () =>
        set({
          companyName: seedCompany.name,
          logo: undefined,
          primaryColor: '#2DD4A8',
          secondaryColor: '#3B82F6',
          backgroundColor: '#0B0F14',
          saturation: 65,
          lightness: 50,
        }),
    }),
    {
      name: 'idibages-branding',
    }
  )
);
