import { create } from 'zustand';

interface OfflineState {
  isOnline: boolean;
  setOnline: (online: boolean) => void;
}

// Connectivity only. Business writes must be confirmed by the server and are
// deliberately never queued or reported as synchronized by this UI store.
export const useOfflineStore = create<OfflineState>((set) => ({
  isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
  setOnline: (isOnline) => set({ isOnline }),
}));
