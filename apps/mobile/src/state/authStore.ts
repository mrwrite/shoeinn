import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

export type UserRole = "customer" | "company" | null;

interface AuthState {
  token: string | null;
  role: UserRole;
  loading: boolean;
  hydrate: () => Promise<void>;
  setAuth: (token: string, role: Exclude<UserRole, null>) => Promise<void>;
  logout: () => Promise<void>;
}

const TOKEN_KEY = "auth_token";
const ROLE_KEY = "auth_role";

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  role: null,
  loading: true,
  hydrate: async () => {
    try {
      const [[, token], [, role]] = await AsyncStorage.multiGet([TOKEN_KEY, ROLE_KEY]);
      set({ token: token ?? null, role: (role as UserRole) ?? null, loading: false });
    } catch (error) {
      console.warn("[Auth] Failed to hydrate", error);
      set({ token: null, role: null, loading: false });
    }
  },
  setAuth: async (token, role) => {
    await AsyncStorage.multiSet([
      [TOKEN_KEY, token],
      [ROLE_KEY, role],
    ]);
    set({ token, role });
  },
  logout: async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, ROLE_KEY]);
    set({ token: null, role: null });
  },
}));

export function getAuthToken(): string | null {
  return useAuthStore.getState().token;
}
