import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ScreenContainer } from "../../components/ScreenContainer";
import { Card } from "../../components/ui/Card";
import { Text } from "../../components/ui/Text";
import { useFocusedAutoRefresh } from "../../hooks/useFocusedAutoRefresh";
import {
  ackMyNotification,
  customerNotificationsQueryKey,
  getCustomerNotificationCopy,
  useCustomerNotifications,
} from "../../hooks/useCustomerNotifications";
import type { AppointmentStackParamList } from "../../navigation/types";
import type { Notification } from "../../types/notification";
import { useTheme } from "../../theme/theme";

export default function CustomerNotificationsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppointmentStackParamList>>();
  const queryClient = useQueryClient();
  const notificationsQuery = useCustomerNotifications(true);

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

    if (notification.appointment_id) {
      navigation.navigate("AppointmentDetail", { appointmentId: notification.appointment_id });
    }
  };

  const renderItem = ({ item }: { item: Notification }) => {
    const copy = getCustomerNotificationCopy(item);
    return (
      <Pressable onPress={() => void handlePress(item)}>
        <Card
          style={[
            styles.notificationCard,
            copy.unread && { borderColor: "#bfdbfe", backgroundColor: "#eff6ff" },
          ]}
        >
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
          <View style={styles.notificationFooter}>
            {copy.unread ? (
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
          data={notificationsQuery.data ?? []}
          keyExtractor={(item) => item.id}
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
  notificationHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
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
