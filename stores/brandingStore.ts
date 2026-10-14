import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { seedCompany } from '@/data/seed';

export interface FontOption {
  id: string;
  name: string;
  family: string;
  googleFont: string;
}

export const AVAILABLE_FONTS: FontOption[] = [
  { id: 'inter', name: 'Inter (Défaut moderne)', family: "'Inter', sans-serif", googleFont: 'Inter:wght@400;500;600;700' },
  { id: 'outfit', name: 'Outfit (Sleek Tech & Luxe)', family: "'Outfit', sans-serif", googleFont: 'Outfit:wght@400;500;600;700' },
  { id: 'jakarta', name: 'Plus Jakarta Sans (Corporate Premium)', family: "'Plus Jakarta Sans', sans-serif", googleFont: 'Plus+Jakarta+Sans:wght@400;500;600;700' },
  { id: 'roboto', name: 'Roboto (Google Standard)', family: "'Roboto', sans-serif", googleFont: 'Roboto:wght@400;500;700' },
  { id: 'montserrat', name: 'Montserrat (Audacieux & Élégant)', family: "'Montserrat', sans-serif", googleFont: 'Montserrat:wght@400;500;600;700' },
  { id: 'poppins', name: 'Poppins (Géométrique Doux)', family: "'Poppins', sans-serif", googleFont: 'Poppins:wght@400;500;600;700' },
];

export interface LanguageOption {
  code: 'fr' | 'en' | 'es';
  name: string;
  flag: string;
}

export const AVAILABLE_LANGUAGES: LanguageOption[] = [
  { code: 'fr', name: 'Français (Cameroun / CEMAC)', flag: '🇨🇲' },
  { code: 'en', name: 'English (International)', flag: '🇬🇧' },
  { code: 'es', name: 'Español (Guinea Ecuatorial)', flag: '🇬🇶' },
];

interface BrandingState {
  companyName: string;
  logo: string | undefined;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  cardColor: string;
  fontFamily: string;
  fontId: string;
  language: 'fr' | 'en' | 'es';
  saturation: number;
  lightness: number;

  updateBranding: (data: Partial<Omit<BrandingState, 'updateBranding' | 'resetToDefault' | 'applyTheme'>>) => void;
  applyTheme: () => void;
  resetToDefault: () => void;
}

export const useBrandingStore = create<BrandingState>()(
  persist(
    (set, get) => ({
      companyName: seedCompany.name,
      logo: undefined,
      primaryColor: '#1F7A63',
      secondaryColor: '#3B82F6',
      backgroundColor: '#FFFFFF',
      cardColor: '#111820',
      fontFamily: "'Inter', sans-serif",
      fontId: 'inter',
      language: 'fr',
      saturation: 65,
      lightness: 50,

      updateBranding: (data) => {
        set((state) => ({ ...state, ...data }));
        setTimeout(() => get().applyTheme(), 10);
      },

      applyTheme: () => {
        const state = get();
        const root = document.documentElement;

        // Apply Color CSS Variables
        if (state.primaryColor) {
          root.style.setProperty('--accent-primary', state.primaryColor);
          root.style.setProperty('--accent-primary-hover', `color-mix(in srgb, ${state.primaryColor} 85%, #081C2D)`);
          root.style.setProperty('--accent-primary-glow', `${state.primaryColor}26`);
        }
        if (state.secondaryColor) {
          root.style.setProperty('--accent-secondary', state.secondaryColor);
        }
        if (state.backgroundColor) {
          root.style.setProperty('--bg-primary', state.backgroundColor);
        }

        // Apply Dynamic Google Font
        const selectedFont = AVAILABLE_FONTS.find((f) => f.id === state.fontId) || AVAILABLE_FONTS[0];
        let fontLink = document.getElementById('dynamic-google-font') as HTMLLinkElement;
        if (!fontLink) {
          fontLink = document.createElement('link');
          fontLink.id = 'dynamic-google-font';
          fontLink.rel = 'stylesheet';
          document.head.appendChild(fontLink);
        }
        fontLink.href = `https://fonts.googleapis.com/css2?family=${selectedFont.googleFont}&display=swap`;
        document.body.style.fontFamily = selectedFont.family;
      },

      resetToDefault: () => {
        set({
          companyName: seedCompany.name,
          logo: undefined,
          primaryColor: '#1F7A63',
          secondaryColor: '#3B82F6',
          backgroundColor: '#FFFFFF',
          cardColor: '#111820',
          fontFamily: "'Inter', sans-serif",
          fontId: 'inter',
          language: 'fr',
          saturation: 65,
          lightness: 50,
        });
        setTimeout(() => get().applyTheme(), 10);
      },
    }),
    {
      name: 'idibages-branding-v2',
      version: 6,
      // Upgrade the former default palette while preserving custom branding.
      migrate: (persisted, version) => {
        const state = persisted as Partial<BrandingState>;
        const legacyPrimary = ['#2dd4a8', '#0f766e'];
        if (version < 4 && legacyPrimary.includes(state.primaryColor?.toLowerCase() ?? '')) state.primaryColor = '#B94724';
        if (version < 5 && ['#0b0f14', '#faf7f2'].includes(state.backgroundColor?.toLowerCase() ?? '')) state.backgroundColor = '#FFFFFF';
        if (version < 6 && state.primaryColor?.toLowerCase() === '#b94724') state.primaryColor = '#1F7A63';
        return state as BrandingState;
      },
    }
  )
);
