import { create } from 'zustand';

interface QueuedAction {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

interface OfflineState {
  isOnline: boolean;
  pendingQueue: QueuedAction[];
  isSyncing: boolean;
  setOnline: (online: boolean) => void;
  queueAction: (action: Omit<QueuedAction, 'id' | 'timestamp'>) => void;
  removeFromQueue: (id: string) => void;
  syncNow: () => Promise<void>;
  clearQueue: () => void;
}

export const useOfflineStore = create<OfflineState>((set, get) => ({
  isOnline: true,
  pendingQueue: [],
  isSyncing: false,

  setOnline: (online) => {
    const wasOffline = !get().isOnline;
    set({ isOnline: online });
    if (wasOffline && online && get().pendingQueue.length > 0) {
      get().syncNow();
    }
  },

  queueAction: (action) => {
    const queued: QueuedAction = {
      ...action,
      id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    set((state) => ({ pendingQueue: [...state.pendingQueue, queued] }));
  },

  removeFromQueue: (id) =>
    set((state) => ({ pendingQueue: state.pendingQueue.filter((a) => a.id !== id) })),

  syncNow: async () => {
    set({ isSyncing: true });
    await new Promise((resolve) => setTimeout(resolve, 2000));
    set({ pendingQueue: [], isSyncing: false });
  },

  clearQueue: () => set({ pendingQueue: [] }),
}));
