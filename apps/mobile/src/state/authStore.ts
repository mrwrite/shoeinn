import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

export type UserRole = "customer" | "company" | null;

interface AuthState {
  token: string | null;
  role: UserRole;
  rememberMe: boolean;
  loading: boolean;
  hydrate: () => Promise<void>;
  setAuth: (token: string, role: Exclude<UserRole, null>) => Promise<void>;
  setRememberMe: (remember: boolean) => Promise<void>;
  logout: () => Promise<void>;
}

const TOKEN_KEY = "auth_token";
const ROLE_KEY = "auth_role";
const REMEMBER_KEY = "auth_remember";

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  role: null,
  rememberMe: false,
  loading: true,
  hydrate: async () => {
    try {
      const [[, rememberValue]] = await AsyncStorage.multiGet([REMEMBER_KEY]);
      const remember = rememberValue === "true";
      if (!remember) {
        // Do not hydrate auth if remember me is disabled
        await AsyncStorage.multiRemove([TOKEN_KEY, ROLE_KEY]);
        set({ token: null, role: null, rememberMe: false, loading: false });
        return;
      }

      const [[, token], [, role]] = await AsyncStorage.multiGet([TOKEN_KEY, ROLE_KEY]);
      set({ token: token ?? null, role: (role as UserRole) ?? null, rememberMe: remember, loading: false });
    } catch (error) {
      console.warn("[Auth] Failed to hydrate", error);
      set({ token: null, role: null, rememberMe: false, loading: false });
    }
  },
  setAuth: async (token, role) => {
    set((state) => ({ token, role, rememberMe: state.rememberMe }));

    const rememberValue = useAuthStore.getState().rememberMe;
    if (rememberValue) {
      await AsyncStorage.multiSet([
        [TOKEN_KEY, token],
        [ROLE_KEY, role],
        [REMEMBER_KEY, "true"],
      ]);
    } else {
      await AsyncStorage.multiRemove([TOKEN_KEY, ROLE_KEY]);
      await AsyncStorage.setItem(REMEMBER_KEY, "false");
    }
  },
  setRememberMe: async (remember) => {
    set({ rememberMe: remember });
    await AsyncStorage.setItem(REMEMBER_KEY, remember ? "true" : "false");
  },
  logout: async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, ROLE_KEY, REMEMBER_KEY]);
    set({ token: null, role: null, rememberMe: false });
  },
}));

export function getAuthToken(): string | null {
  return useAuthStore.getState().token;
}
