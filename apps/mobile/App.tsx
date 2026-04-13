import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { enableScreens } from "react-native-screens";
import { SafeAreaProvider } from "react-native-safe-area-context";

import AuthGate from "./src/navigation/AuthGate";
import { useLiveAppointmentEvents } from "./src/hooks/useLiveAppointmentEvents";
import { usePushNotifications } from "./src/hooks/usePushNotifications";

enableScreens(true);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0,
    },
  },
});

function AppShell() {
  useLiveAppointmentEvents();
  usePushNotifications();
  return <AuthGate />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AppShell />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
