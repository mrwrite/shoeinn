import React, { useEffect } from "react";
import { ActivityIndicator, Linking, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";

import AuthStack from "./AuthStack";
import AppStack from "./AppStack";
import { navigateWhenReady, navigationRef } from "./rootNavigation";
import { useAuthStore } from "../state/authStore";

function normalizeIncomingPath(pathname: string, host: string): string {
  const trimmed = pathname.replace(/^\/+/, "");
  if (!trimmed && host) {
    return host;
  }
  if (trimmed.startsWith("--/")) {
    return trimmed.slice(3);
  }
  return trimmed;
}

function handleIncomingPaymentReturn(url: string, role: string | null | undefined) {
  if (role !== "customer") {
    return;
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return;
  }

  const path = normalizeIncomingPath(parsed.pathname, parsed.host);
  if (path !== "payment/success" && path !== "payment/cancel") {
    return;
  }

  const bookingId = parsed.searchParams.get("booking_id");
  const sessionId = parsed.searchParams.get("session_id") ?? undefined;
  if (!bookingId) {
    return;
  }
  const status = path.endsWith("/cancel") ? "cancel" : "success";

  navigateWhenReady(() => {
    navigationRef.navigate("AppointmentsTab", {
      screen: "PaymentResult",
      params: {
        bookingId,
        sessionId,
        status,
      },
    });
  });
}

export default function AuthGate() {
  const { token, role, loading, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    void Linking.getInitialURL().then((url) => {
      if (url) {
        handleIncomingPaymentReturn(url, role);
      }
    });

    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleIncomingPaymentReturn(url, role);
    });
    return () => subscription.remove();
  }, [role]);

  if (loading) {
    return (
      <View
        style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f3f4f6" }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {!token || !role ? <AuthStack /> : <AppStack />}
    </NavigationContainer>
  );
}
