import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  AppStateStatus,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import NetInfo from "@react-native-community/netinfo";
import {
  QueryClient,
  QueryClientProvider,
  focusManager,
  onlineManager,
} from "@tanstack/react-query";

import { hydrateServicesCache } from "./src/cache/servicesCache";
import {
  OfflineProvider,
  useOfflineManager,
} from "./src/offline/OfflineProvider";
import { useServiceStatusMutation } from "./src/hooks/useServiceMutations";
import { useServices } from "./src/hooks/useServices";
import type { Service } from "./src/api/services";
import type { UseQueryResult } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0,
    },
    mutations: {
      retry: 0,
    },
  },
});

focusManager.setEventListener((handleFocus) => {
  const onAppStateChange = (status: AppStateStatus) => {
    if (status === "active") {
      handleFocus(true);
    }
  };

  const subscription = AppState.addEventListener("change", onAppStateChange);
  return () => {
    subscription.remove();
  };
});

onlineManager.setEventListener((setOnline) => {
  const unsubscribe = NetInfo.addEventListener((state) => {
    const online = Boolean(
      state.isConnected && state.isInternetReachable !== false
    );
    setOnline(online);
  });

  NetInfo.fetch().then((state) => {
    const online = Boolean(
      state.isConnected && state.isInternetReachable !== false
    );
    setOnline(online);
  });

  return unsubscribe;
});

const formatPrice = (price: number) => `$${price.toFixed(2)}`;

const ServicesScreen: React.FC = () => {
  const query = useServices() as UseQueryResult<Service[], Error>;
  const services: Service[] = query.data ?? [];
  const { error, isError, isLoading } = query;

  const { isOnline, isSyncing, pendingCount } = useOfflineManager();
  const mutation = useServiceStatusMutation();

  const actionDisabled = mutation.isPending || isSyncing;

  const sortedServices = useMemo<Service[]>(() => {
    return services
      .slice()
      .sort((a: Service, b: Service) => a.name.localeCompare(b.name));
  }, [services]);

  const renderItem = ({ item }: { item: Service }) => {
    const status = (item.status ?? "active") as "active" | "inactive";
    const nextStatus = status === "active" ? "inactive" : "active";

    return (
      <View style={styles.item}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{item.name}</Text>
          <View
            style={[
              styles.statusBadge,
              status === "active"
                ? styles.statusActive
                : styles.statusInactive,
            ]}
          >
            <Text style={styles.statusText}>{status.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.company}>{item.company.name}</Text>
        <Text style={styles.meta}>
          {item.company.city && item.company.state
            ? `${item.company.city}, ${item.company.state}`
            : "Available"}
        </Text>
        <Text style={styles.meta}>
          Duration: {item.duration_min ? `${item.duration_min} min` : "N/A"}
        </Text>
        <Text style={styles.price}>{formatPrice(item.price)}</Text>
        <TouchableOpacity
          accessibilityRole="button"
          disabled={actionDisabled}
          onPress={() =>
            mutation.mutate({
              id: item.id,
              status: nextStatus,
            })
          }
          style={[styles.button, actionDisabled && styles.buttonDisabled]}
        >
          <Text style={styles.buttonLabel}>
            {item.status === "active" ? "Mark Inactive" : "Mark Active"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  console.log("[UI] isLoading:", isLoading, "len:", services.length);
  if (isError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.bannerError}>
          <Text style={styles.bannerText}>Unable to load services.</Text>
        </View>
        <Text style={styles.error}>
          Error: {error instanceof Error ? error.message : "Unknown error"}
        </Text>
      </SafeAreaView>
    );
  }

  if (isLoading && services.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {!isOnline && (
        <View style={styles.bannerOffline}>
          <Text style={styles.bannerText}>
            Offline.{" "}
            {pendingCount
              ? `${pendingCount} change(s) queued.`
              : "Changes will sync when you reconnect."}
          </Text>
        </View>
      )}
      {isSyncing && (
        <View style={styles.bannerSyncing}>
          <ActivityIndicator size="small" />
          <Text style={[styles.bannerText, styles.bannerSyncingText]}>
            Syncing pending changes...
          </Text>
        </View>
      )}
      <FlatList
        data={sortedServices}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.empty}>No services available.</Text>
          </View>
        }
        contentContainerStyle={
          !sortedServices.length ? styles.emptyList : undefined
        }
      />
    </SafeAreaView>
  );
};

const AppContent: React.FC = () => {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      const { API_URL } = await import("./src/api/http");
      console.log("🔎 Using API_URL:", API_URL);

      try {
        const res = await fetch(`${API_URL}/health`, { method: "GET" });
        console.log("🔎 /health status:", res.status);
        console.log("🔎 /health body:", (await res.text()).slice(0, 200));
      } catch (e: any) {
        console.log("🔎 /health ERROR:", e?.message ?? e);
      }
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsHydrated(true); // optimistically set to true

    (async () => {
      try {
        await hydrateServicesCache(queryClient);
        if (!cancelled) {
          console.log("[Hydrate] done");
        }
      } catch (e) {
        console.warn("[Hydrate] failed:", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!isHydrated) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <OfflineProvider>
      <ServicesScreen />
    </OfflineProvider>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  item: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    gap: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    flexShrink: 1,
  },
  company: {
    fontSize: 16,
    color: "#444",
  },
  meta: {
    fontSize: 14,
    color: "#555",
  },
  price: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "600",
  },
  error: {
    color: "red",
    marginTop: 16,
  },
  empty: {
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
  },
  button: {
    marginTop: 8,
    paddingVertical: 10,
    backgroundColor: "#1f2937",
    borderRadius: 6,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  bannerOffline: {
    backgroundColor: "#f59e0b",
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  bannerSyncing: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#2563eb",
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  bannerText: {
    color: "#111827",
    fontWeight: "600",
  },
  bannerSyncingText: {
    color: "#f9fafb",
  },
  bannerError: {
    backgroundColor: "#f87171",
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: "#bbf7d0",
  },
  statusInactive: {
    backgroundColor: "#fecaca",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },
});
