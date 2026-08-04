import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Notification } from '@/types';

interface UIState {
  sidebarOpen: boolean;
  notifications: Notification[];
  unreadCount: number;
  searchOpen: boolean;
  currentPageTitle: string;
  toast: { message: string; type: 'success' | 'error' | 'info' | 'warning' } | null;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  setSearchOpen: (open: boolean) => void;
  setCurrentPageTitle: (title: string) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  clearToast: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      notifications: [],
      unreadCount: 0,
      searchOpen: false,
      currentPageTitle: 'Tableau de Bord',
      toast: null,

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      addNotification: (notification) =>
        set((state) => ({
          notifications: [notification, ...state.notifications].slice(0, 50),
          unreadCount: state.unreadCount + 1,
        })),

      markNotificationRead: (id) =>
        set((state) => {
          const notifs = state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          );
          return { notifications: notifs, unreadCount: Math.max(0, state.unreadCount - 1) };
        }),

      markAllNotificationsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        })),

      setSearchOpen: (open) => set({ searchOpen: open }),
      setCurrentPageTitle: (title) => set({ currentPageTitle: title }),

      showToast: (message, type) => set({ toast: { message, type } }),
      clearToast: () => set({ toast: null }),
    }),
    {
      name: 'idibages-ui',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        notifications: state.notifications,
        unreadCount: state.unreadCount,
      }),
    }
  )
);
