import { create } from "zustand";

import { fetchProfile } from "@/features/profile/api";
import { authStorage } from "@/lib/auth";
import type { AuthUser } from "@/types/auth";

type AuthState = {
  user: AuthUser | null;
  ready: boolean;
  setUser: (user: AuthUser | null) => void;
  setTokens: (access: string, refresh: string) => void;
  clearSession: () => void;
  bootstrap: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  ready: false,
  setUser: (user) => set({ user }),
  setTokens: (access, refresh) => {
    authStorage.setTokens(access, refresh);
  },
  clearSession: () => {
    authStorage.clear();
    set({ user: null });
  },
  bootstrap: async () => {
    const access = authStorage.getAccess();
    if (!access) {
      set({ ready: true });
      return;
    }
    try {
      const user = await fetchProfile();
      set({ user, ready: true });
    } catch {
      authStorage.clear();
      set({ user: null, ready: true });
    }
  },
}));
