import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import { seedUsers } from '@/data/seed';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, _password: string) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 800));
        const user = seedUsers.find((u) => u.email === email);
        if (user) {
          set({ user, isAuthenticated: true, isLoading: false });
          return true;
        }
        set({ isLoading: false });
        return false;
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      updateProfile: (data) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        }));
      },
    }),
    {
      name: 'idibages-auth',
    }
  )
);
