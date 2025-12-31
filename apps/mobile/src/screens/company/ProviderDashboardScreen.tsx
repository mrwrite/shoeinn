import React from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";

import { fetchOpenAppointments } from "../../api/http";
import { CompanyStackParamList } from "../../navigation/CompanyStack";
import { useAuthStore } from "../../state/authStore";
import type { ProviderAppointment } from "../../types/company";

const formatDate = (value: string) => {
  const dt = new Date(value);
  return dt.toLocaleString();
};

type Props = NativeStackScreenProps<CompanyStackParamList, "ProviderDashboard">;

export default function ProviderDashboardScreen({ navigation }: Props) {
  const logout = useAuthStore((s) => s.logout);
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["provider", "open"],
    queryFn: fetchOpenAppointments,
  });

  const renderItem = ({ item }: { item: ProviderAppointment }) => (
    <Pressable
      onPress={() => navigation.navigate("ProviderAppointmentDetail", { appointment: item })}
      style={styles.card}
    >
      <View style={styles.cardRow}>
        <Text style={styles.cardTitle}>{item.service_name ?? "Appointment"}</Text>
        <Text style={styles.cardStatus}>{item.status?.toUpperCase?.() ?? item.status}</Text>
      </View>
      <Text style={styles.cardMeta}>{formatDate(item.start_time)}</Text>
      <Text style={styles.cardMeta}>{[item.customer_city, item.customer_state].filter(Boolean).join(", ")}</Text>
      <Text style={styles.cardHint}>Tap to view and claim</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Provider dashboard</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={() => navigation.navigate("Notifications")} style={styles.linkButton}>
            <Text style={styles.linkText}>🔔</Text>
          </Pressable>
          <Pressable onPress={logout} style={styles.linkButton}>
            <Text style={styles.linkText}>Logout</Text>
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : error ? (
        <Text style={styles.error}>Failed to load appointments</Text>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={<Text style={styles.empty}>No open appointments</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f3f4f6" },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "700" },
  headerActions: { flexDirection: "row", alignItems: "center", columnGap: 12 },
  linkButton: { paddingHorizontal: 6, paddingVertical: 4 },
  linkText: { color: "#1d4ed8", fontWeight: "600", fontSize: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  error: { color: "#b91c1c", paddingHorizontal: 20 },
  list: { paddingHorizontal: 20, paddingBottom: 24, gap: 12 },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 12,
  },
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  cardStatus: { color: "#4b5563" },
  cardMeta: { color: "#4b5563", marginTop: 4 },
  cardHint: { color: "#16a34a", marginTop: 6, fontWeight: "600" },
  empty: { textAlign: "center", color: "#6b7280", paddingVertical: 20 },
});
