import React from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";

import { ackNotification, fetchNotifications } from "../../api/http";
import type { Notification } from "../../types/notification";

const formatDate = (value?: string | null) => {
  if (!value) return "";
  const dt = new Date(value);
  return dt.toLocaleString();
};

export default function NotificationsScreen() {
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["company", "notifications"],
    queryFn: fetchNotifications,
  });

  const ackMutation = useMutation({
    mutationFn: ackNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company", "notifications"] });
    },
  });

  const renderItem = ({ item }: { item: Notification }) => {
    const isRead = !!item.read_at;
    return (
      <View style={[styles.card, isRead && styles.cardRead]}>
        <View style={styles.cardHeader}>
          <Text style={styles.kind}>{item.kind}</Text>
          <Text style={styles.date}>{formatDate(item.created_at)}</Text>
        </View>
        {item.payload?.new_status ? (
          <Text style={styles.body}>
            Status changed: {item.payload.old_status} → {item.payload.new_status}
          </Text>
        ) : null}
        <Text style={styles.meta}>Delivered: {item.delivered ? "Yes" : "Pending"}</Text>
        {isRead ? (
          <Text style={styles.readAt}>Read at {formatDate(item.read_at)}</Text>
        ) : (
          <Pressable
            onPress={() => ackMutation.mutate(item.id)}
            style={[styles.button, ackMutation.isPending && styles.buttonDisabled]}
          >
            {ackMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Mark as read</Text>}
          </Pressable>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
      </View>
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : error ? (
        <Text style={styles.error}>Failed to load notifications</Text>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshing={isRefetching}
          onRefresh={refetch}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No notifications</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f3f4f6" },
  header: { paddingHorizontal: 20, paddingVertical: 12 },
  title: { fontSize: 20, fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  error: { color: "#b91c1c", paddingHorizontal: 20 },
  list: { padding: 20, gap: 12 },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    gap: 8,
  },
  cardRead: { opacity: 0.7 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between" },
  kind: { fontWeight: "700" },
  date: { color: "#4b5563" },
  body: { color: "#111827" },
  meta: { color: "#4b5563" },
  readAt: { color: "#065f46", fontWeight: "600" },
  button: {
    backgroundColor: "#111827",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#fff", fontWeight: "600" },
  empty: { textAlign: "center", color: "#6b7280", paddingVertical: 20 },
});
