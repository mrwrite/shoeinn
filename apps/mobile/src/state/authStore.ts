import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

export type UserRole = "customer" | "company" | null;

interface AuthState {
    token: string | null;
    role: UserRole;
    userId: string | null;
    fullName: string | null;
    email: string | null;
    companyId: string | null;
    rememberMe: boolean;
    loading: boolean;
    hydrate: () => Promise<void>;
    setAuth: (
        token: string,
        role: Exclude<UserRole, null>,
        userId: string,
        fullName: string,
        email: string,
        companyId: string | null,
    ) => Promise<void>;
    setRememberMe: (remember: boolean) => Promise<void>;
    logout: () => Promise<void>;
}

const TOKEN_KEY = "auth_token";
const ROLE_KEY = "auth_role";
const USER_ID_KEY = "auth_user_id";
const FULL_NAME_KEY = "auth_full_name";
const COMPANY_ID_KEY = "auth_company_id";
const REMEMBER_KEY = "auth_remember";
const EMAIL_KEY = "auth_email";

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  role: null,
  userId: null,
  fullName: null,
  email: null,
  companyId: null,
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

      const [[, token], [, role], [, userId], [, fullName], [, email], [, companyId]] = await AsyncStorage.multiGet([
        TOKEN_KEY,
        ROLE_KEY,
        USER_ID_KEY,
        FULL_NAME_KEY,
        EMAIL_KEY,
        COMPANY_ID_KEY,
      ]);
      set({
        token: token ?? null,
        role: (role as UserRole) ?? null,
        userId: userId ?? null,
        fullName: fullName ?? null,
        email: email ?? null,
        companyId: companyId ?? null,
        rememberMe: remember,
        loading: false,
      });
    } catch (error) {
      console.warn("[Auth] Failed to hydrate", error);
      set({ token: null, role: null, userId: null, fullName: null, companyId: null, rememberMe: false, loading: false });
    }
  },
  setAuth: async (token, role, userId, fullName, email, companyId) => {
    set((state) => ({ token, role, userId, fullName, email, companyId, rememberMe: state.rememberMe }));

    const rememberValue = useAuthStore.getState().rememberMe;
    if (rememberValue) {
      await AsyncStorage.multiSet([
        [TOKEN_KEY, token],
        [ROLE_KEY, role],
        [USER_ID_KEY, userId],
        [FULL_NAME_KEY, fullName],
        [EMAIL_KEY, email],
        [COMPANY_ID_KEY, companyId ?? ""],
        [REMEMBER_KEY, "true"],
      ]);
    } else {
      await AsyncStorage.multiRemove([TOKEN_KEY, ROLE_KEY, USER_ID_KEY, FULL_NAME_KEY, EMAIL_KEY, COMPANY_ID_KEY]);
      await AsyncStorage.setItem(REMEMBER_KEY, "false");
    }
  },
  setRememberMe: async (remember) => {
    set({ rememberMe: remember });
    await AsyncStorage.setItem(REMEMBER_KEY, remember ? "true" : "false");
  },
  logout: async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, ROLE_KEY, USER_ID_KEY, FULL_NAME_KEY, EMAIL_KEY, COMPANY_ID_KEY, REMEMBER_KEY]);
    set({ token: null, role: null, userId: null, fullName: null, email: null, companyId: null, rememberMe: false });
  },
}));

export function getAuthToken(): string | null {
  return useAuthStore.getState().token;
}
