import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ScreenContainer } from "../../components/ScreenContainer";
import { Card } from "../../components/ui/Card";
import { Text } from "../../components/ui/Text";
import { useFocusedAutoRefresh } from "../../hooks/useFocusedAutoRefresh";
import {
  ackMyNotification,
  customerNotificationsQueryKey,
  getCustomerNotificationCopy,
  groupCustomerNotifications,
  useCustomerNotifications,
} from "../../hooks/useCustomerNotifications";
import { openCustomerAppointmentFromNotification } from "../../navigation/customerNotificationNavigation";
import type { Notification } from "../../types/notification";
import { useTheme } from "../../theme/theme";

export default function CustomerNotificationsScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const notificationsQuery = useCustomerNotifications(true);
  const groupedNotifications = groupCustomerNotifications(notificationsQuery.data);

  const ackMutation = useMutation({
    mutationFn: (notificationId: string) => ackMyNotification(notificationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: customerNotificationsQueryKey });
    },
  });

  useFocusedAutoRefresh({
    enabled: true,
    intervalMs: 15000,
    onRefresh: async () => {
      await notificationsQuery.refetch();
    },
  });

  const handlePress = async (notification: Notification) => {
    if (!notification.read_at) {
      try {
        await ackMutation.mutateAsync(notification.id);
      } catch (error) {
        // Keep navigation behavior even if ack fails; next refresh will retry state.
      }
    }

    openCustomerAppointmentFromNotification(notification);
  };

  const renderItem = ({
    item,
  }: {
    item: ReturnType<typeof groupCustomerNotifications>[number];
  }) => {
    const copy = getCustomerNotificationCopy(item.latest);
    const olderVisible = item.older.slice(0, 2);
    const remainingOlderCount = Math.max(0, item.older.length - olderVisible.length);
    return (
      <Pressable onPress={() => void handlePress(item.latest)}>
        <Card
          style={[
            styles.notificationCard,
            item.unread && { borderColor: "#bfdbfe", backgroundColor: "#eff6ff" },
          ]}
        >
          {!item.isStandalone ? (
            <View style={styles.groupHeader}>
              <Text variant="overline" weight="semibold" color={theme.colors.peacockPrimary}>
                Appointment update
              </Text>
              <Text variant="caption" color={theme.colors.mutedText}>
                {item.older.length > 0 ? `${item.older.length + 1} updates` : "1 update"}
              </Text>
            </View>
          ) : null}
          <View style={styles.notificationHeader}>
            <Text variant="subtitle" weight="semibold" style={{ flex: 1 }}>
              {copy.title}
            </Text>
            <Text variant="caption" color={theme.colors.mutedText}>
              {copy.timestampLabel}
            </Text>
          </View>
          <Text color={theme.colors.mutedText} style={{ marginTop: 8 }}>
            {copy.detail}
          </Text>
          {olderVisible.length > 0 ? (
            <View style={styles.olderUpdates}>
              {olderVisible.map((notification) => {
                const olderCopy = getCustomerNotificationCopy(notification);
                return (
                  <View key={notification.id} style={styles.olderUpdateRow}>
                    <Text variant="caption" weight="semibold" color={theme.colors.textCharcoal}>
                      {olderCopy.title}
                    </Text>
                    <Text variant="caption" color={theme.colors.mutedText}>
                      {olderCopy.timestampLabel}
                    </Text>
                  </View>
                );
              })}
              {remainingOlderCount > 0 ? (
                <Text variant="caption" color={theme.colors.mutedText}>
                  +{remainingOlderCount} older update{remainingOlderCount === 1 ? "" : "s"}
                </Text>
              ) : null}
            </View>
          ) : null}
          <View style={styles.notificationFooter}>
            {item.unread ? (
              <View style={styles.unreadPill}>
                <Text variant="overline" weight="semibold" color={theme.colors.peacockPrimary}>
                  New
                </Text>
              </View>
            ) : (
              <Text variant="caption" color={theme.colors.mutedText}>
                Read
              </Text>
            )}
            <Text variant="caption" color={theme.colors.peacockPrimary}>
              Open update
            </Text>
          </View>
        </Card>
      </Pressable>
    );
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text variant="title" weight="bold">
          Notifications
        </Text>
        <Text color={theme.colors.mutedText} style={{ marginTop: 4 }}>
          Recent provider and appointment updates.
        </Text>
      </View>

      {notificationsQuery.isLoading ? (
        <View style={styles.state}>
          <ActivityIndicator color={theme.colors.peacockPrimary} />
          <Text color={theme.colors.mutedText}>Loading your latest updates.</Text>
        </View>
      ) : notificationsQuery.isError ? (
        <View style={styles.state}>
          <Text weight="semibold" color={theme.colors.danger}>
            Notifications are unavailable right now.
          </Text>
          <Pressable style={styles.retryButton} onPress={() => notificationsQuery.refetch()}>
            <Text weight="semibold" color="#fff">
              Retry
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={groupedNotifications}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={notificationsQuery.isRefetching}
              onRefresh={() => notificationsQuery.refetch()}
            />
          }
          ListEmptyComponent={
            <View style={styles.state}>
              <Text weight="semibold">No updates yet</Text>
              <Text color={theme.colors.mutedText} style={{ textAlign: "center" }}>
                Assignment and delivery progress updates will appear here as your appointments move.
              </Text>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 16,
    gap: 4,
  },
  list: {
    padding: 16,
    paddingTop: 4,
    gap: 12,
  },
  state: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 10,
  },
  notificationCard: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 4,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 2,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  olderUpdates: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    gap: 6,
  },
  olderUpdateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  notificationFooter: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  unreadPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#dbeafe",
  },
  retryButton: {
    marginTop: 6,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#0F4C5C",
  },
});
