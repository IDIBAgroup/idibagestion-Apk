import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Lead, BuySignal, SocialTrend, OutreachCampaign, OutreachMessage } from '@/types';

interface VibeState {
  // Filters
  selectedPlatforms: string[];
  selectedIndustries: string[];
  selectedCountries: string[];
  dateRange: '7d' | '30d' | '90d' | 'all';
  leadStatusFilter: string;
  signalTypeFilter: string;
  trendPlatformFilter: string;
  searchQuery: string;

  // Actions
  setSelectedPlatforms: (p: string[]) => void;
  setSelectedIndustries: (i: string[]) => void;
  setSelectedCountries: (c: string[]) => void;
  setDateRange: (r: '7d' | '30d' | '90d' | 'all') => void;
  setLeadStatusFilter: (s: string) => void;
  setSignalTypeFilter: (s: string) => void;
  setTrendPlatformFilter: (p: string) => void;
  setSearchQuery: (q: string) => void;
  resetFilters: () => void;
}

export const useVibeStore = create<VibeState>()(
  persist(
    (set) => ({
      selectedPlatforms: [],
      selectedIndustries: [],
      selectedCountries: [],
      dateRange: '30d',
      leadStatusFilter: 'all',
      signalTypeFilter: 'all',
      trendPlatformFilter: 'all',
      searchQuery: '',

      setSelectedPlatforms: (p) => set({ selectedPlatforms: p }),
      setSelectedIndustries: (i) => set({ selectedIndustries: i }),
      setSelectedCountries: (c) => set({ selectedCountries: c }),
      setDateRange: (r) => set({ dateRange: r }),
      setLeadStatusFilter: (s) => set({ leadStatusFilter: s }),
      setSignalTypeFilter: (s) => set({ signalTypeFilter: s }),
      setTrendPlatformFilter: (p) => set({ trendPlatformFilter: p }),
      setSearchQuery: (q) => set({ searchQuery: q }),
      resetFilters: () => set({
        selectedPlatforms: [],
        selectedIndustries: [],
        selectedCountries: [],
        dateRange: '30d',
        leadStatusFilter: 'all',
        signalTypeFilter: 'all',
        trendPlatformFilter: 'all',
        searchQuery: '',
      }),
    }),
    { name: 'idibages-vibe-filters' }
  )
);
