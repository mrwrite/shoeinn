import { useEffect } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

import { registerPushToken } from "../api/http";
import { useAuthStore } from "../state/authStore";


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


export function usePushNotifications() {
  const { token: authToken, role } = useAuthStore();

  useEffect(() => {
    if (!authToken || !role) {
      return;
    }

    Notifications.setNotificationHandler({
      handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: false, shouldSetBadge: false }),
    });

    acquireExpoToken()
      .then((expoToken) => {
        if (!expoToken) return;
        registerPushToken({ token: expoToken, platform: Platform.OS === "ios" ? "ios" : "android" }).catch((err) =>
          console.warn("[Push] Register failed", err?.message ?? err),
        );
      })
      .catch((err) => console.warn("[Push] Token acquisition failed", err?.message ?? err));
  }, [authToken, role]);
}

