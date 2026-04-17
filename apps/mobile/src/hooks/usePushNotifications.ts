import { useEffect } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

import { registerPushToken, unregisterPushToken } from "../api/http";
import { useCustomerNotificationPreferences } from "./useCustomerNotifications";
import { openCustomerAppointmentFromNotification } from "../navigation/customerNotificationNavigation";
import { useAuthStore } from "../state/authStore";

const PUSH_TOKEN_STORAGE_KEY = "expo_push_token";

async function requestPermissions(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === "granted") {
    return true;
  }
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === "granted";
}


async function ensureAndroidChannel() {
  if (Platform.OS !== "android") {
    return;
  }
  await Notifications.setNotificationChannelAsync("default", {
    name: "default",
    importance: Notifications.AndroidImportance.MAX,
  });
}


async function acquireExpoToken(): Promise<string | null> {
  const granted = await requestPermissions();
  if (!granted) {
    return null;
  }

  await ensureAndroidChannel();
  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  return token.data ?? null;
}

async function getStoredPushToken(): Promise<string | null> {
  return AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
}

async function storePushToken(token: string): Promise<void> {
  await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
}

async function clearStoredPushToken(): Promise<void> {
  await AsyncStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
}


export function usePushNotifications() {
  const { token: authToken, role } = useAuthStore();
  const preferencesQuery = useCustomerNotificationPreferences(!!authToken && role === "customer");

  useEffect(() => {
    if (!authToken || !role) {
      return;
    }

    Notifications.setNotificationHandler({
      handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: false, shouldSetBadge: false }),
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      if (role === "customer") {
        openCustomerAppointmentFromNotification(response.notification.request.content.data);
      }
    });

    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response && role === "customer") {
          openCustomerAppointmentFromNotification(response.notification.request.content.data);
        }
      })
      .catch((err) => console.warn("[Push] Last response handling failed", err?.message ?? err));

    const syncPushRegistration = async () => {
      const pushEnabled =
        role !== "customer" ? true : (preferencesQuery.data?.customer_push_enabled ?? true);

      if (role === "customer" && preferencesQuery.isLoading) {
        return;
      }

      if (!pushEnabled) {
        const storedToken = await getStoredPushToken();
        if (storedToken) {
          try {
            await unregisterPushToken({ token: storedToken });
          } catch (err: any) {
            console.warn("[Push] Unregister failed", err?.message ?? err);
          }
        }
        await clearStoredPushToken();
        return;
      }

      const expoToken = await acquireExpoToken();
      if (!expoToken) return;
      await registerPushToken({ token: expoToken, platform: Platform.OS === "ios" ? "ios" : "android" });
      await storePushToken(expoToken);
    };

    syncPushRegistration().catch((err) => console.warn("[Push] Sync failed", err?.message ?? err));

    return () => {
      responseListener.remove();
    };
  }, [authToken, preferencesQuery.data, preferencesQuery.isLoading, role]);
}

