
import { create } from 'zustand';

export interface AppUser {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  provider?: string;
  verified?: boolean;
}

interface AppState {
  user: AppUser | null;
  isLoading: boolean;
  isGuest: boolean;
  setUser: (user: AppUser | null) => void;
  setLoading: (loading: boolean) => void;
  setGuest: (guest: boolean) => void;
  signOut: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  isLoading: true,
  isGuest: false,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setGuest: (isGuest) => set({ isGuest }),
  signOut: () => set({ user: null, isGuest: false }),
}));
