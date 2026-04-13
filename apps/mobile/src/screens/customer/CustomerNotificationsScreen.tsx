import React, { useMemo, useState } from "react";
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
  ackAllMyNotifications,
  ackCustomerNotificationGroup,
  customerNotificationsQueryKey,
  getCustomerNotificationCopy,
  getNotificationPriorityPresentation,
  getUnreadCustomerNotificationCount,
  getUnreadNotificationIdsForGroup,
  groupCustomerNotifications,
  shouldHideNotificationGroup,
  useArchivedCustomerNotificationGroups,
  useCustomerNotifications,
} from "../../hooks/useCustomerNotifications";
import { openCustomerAppointmentFromNotification } from "../../navigation/customerNotificationNavigation";
import { useTheme } from "../../theme/theme";

type InboxFilter = "all" | "unread";

export default function CustomerNotificationsScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [selectedFilter, setSelectedFilter] = useState<InboxFilter>("all");
  const notificationsQuery = useCustomerNotifications(true);
  const groupedNotifications = groupCustomerNotifications(notificationsQuery.data);
  const { archivedGroups, archiveGroup, isArchiveStateLoaded } =
    useArchivedCustomerNotificationGroups(groupedNotifications);
  const unreadCount = getUnreadCustomerNotificationCount(notificationsQuery.data);
  const visibleNotifications = useMemo(
    () =>
      selectedFilter === "unread"
        ? groupedNotifications.filter(
            (notificationGroup) =>
              notificationGroup.unread &&
              !shouldHideNotificationGroup(notificationGroup, archivedGroups),
          )
        : groupedNotifications.filter(
            (notificationGroup) => !shouldHideNotificationGroup(notificationGroup, archivedGroups),
          ),
    [archivedGroups, groupedNotifications, selectedFilter],
  );

  const ackGroupMutation = useMutation({
    mutationFn: ackCustomerNotificationGroup,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: customerNotificationsQueryKey });
    },
  });

  const ackAllMutation = useMutation({
    mutationFn: ackAllMyNotifications,
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

  const handlePress = async (item: ReturnType<typeof groupCustomerNotifications>[number]) => {
    const unreadIds = getUnreadNotificationIdsForGroup(item);
    if (unreadIds.length > 0) {
      try {
        await ackGroupMutation.mutateAsync({
          notificationIds: unreadIds,
        });
      } catch (error) {
        // Keep navigation behavior even if ack fails; next refresh will retry state.
      }
    }

    openCustomerAppointmentFromNotification(item.latest);
  };

  const handleMarkGroupRead = async (item: ReturnType<typeof groupCustomerNotifications>[number]) => {
    const unreadIds = getUnreadNotificationIdsForGroup(item);
    if (unreadIds.length === 0) {
      return;
    }

    try {
      await ackGroupMutation.mutateAsync({
        notificationIds: unreadIds,
      });
    } catch (error) {
      // Keep the inbox stable; refetch paths will recover state on next refresh.
    }
  };

  const handleArchiveGroup = async (item: ReturnType<typeof groupCustomerNotifications>[number]) => {
    await archiveGroup(item);
  };

  const renderItem = ({
    item,
  }: {
    item: ReturnType<typeof groupCustomerNotifications>[number];
  }) => {
    const copy = getCustomerNotificationCopy(item.latest);
    const priority = getNotificationPriorityPresentation(item.latest);
    const olderVisible = item.older.slice(0, 2);
    const remainingOlderCount = Math.max(0, item.older.length - olderVisible.length);
    const unreadIds = getUnreadNotificationIdsForGroup(item);
    const isHighPriority = priority.tone === "high";
    return (
      <Pressable onPress={() => void handlePress(item)}>
        <Card
          style={[
            styles.notificationCard,
            isHighPriority && styles.notificationCardPriority,
            item.unread && { borderColor: "#bfdbfe", backgroundColor: "#eff6ff" },
            item.unread && isHighPriority && styles.notificationCardPriorityUnread,
          ]}
        >
          <View style={styles.groupHeader}>
            <Text
              variant="overline"
              weight="semibold"
              color={isHighPriority ? theme.colors.textCharcoal : theme.colors.peacockPrimary}
            >
              {priority.label}
            </Text>
            {!item.isStandalone ? (
              <Text variant="caption" color={theme.colors.mutedText}>
                {item.older.length > 0 ? `${item.older.length + 1} updates` : "1 update"}
              </Text>
            ) : null}
          </View>
          <View style={styles.notificationHeader}>
            <Text
              variant="subtitle"
              weight="semibold"
              style={[styles.notificationTitle, isHighPriority && styles.notificationTitlePriority]}
            >
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
              <View style={styles.footerLeft}>
                <View style={[styles.unreadPill, isHighPriority && styles.unreadPillPriority]}>
                  <Text variant="overline" weight="semibold" color={theme.colors.peacockPrimary}>
                    {unreadIds.length > 1 ? `${unreadIds.length} new` : "New"}
                  </Text>
                </View>
                <Pressable
                  hitSlop={8}
                  onPress={(event) => {
                    event.stopPropagation();
                    void handleMarkGroupRead(item);
                  }}
                >
                  <Text variant="caption" weight="semibold" color={theme.colors.peacockPrimary}>
                    Mark read
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Text variant="caption" color={theme.colors.mutedText}>
                Read
              </Text>
            )}
            <View style={styles.footerRight}>
              <Pressable
                hitSlop={8}
                onPress={(event) => {
                  event.stopPropagation();
                  void handleArchiveGroup(item);
                }}
              >
                <Text variant="caption" weight="semibold" color={theme.colors.mutedText}>
                  Archive
                </Text>
              </Pressable>
              <Text variant="caption" color={theme.colors.peacockPrimary}>
                Open update
              </Text>
            </View>
          </View>
        </Card>
      </Pressable>
    );
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text variant="title" weight="bold">
              Notifications
            </Text>
            <Text color={theme.colors.mutedText} style={{ marginTop: 4 }}>
              Recent provider and appointment updates.
            </Text>
          </View>
          {unreadCount > 0 ? (
            <Pressable
              hitSlop={8}
              disabled={ackAllMutation.isPending}
              onPress={() => {
                void ackAllMutation.mutateAsync();
              }}
            >
              <Text variant="caption" weight="semibold" color={theme.colors.peacockPrimary}>
                {ackAllMutation.isPending ? "Marking..." : "Mark all read"}
              </Text>
            </Pressable>
          ) : null}
        </View>
        <View style={styles.filterRow}>
          {([
            { key: "all", label: "All" },
            { key: "unread", label: "Unread" },
          ] as const).map((option) => {
            const active = selectedFilter === option.key;
            return (
              <Pressable
                key={option.key}
                onPress={() => setSelectedFilter(option.key)}
                style={[styles.filterPill, active && styles.filterPillActive]}
              >
                <Text
                  variant="caption"
                  weight="semibold"
                  color={active ? theme.colors.peacockPrimary : theme.colors.mutedText}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {notificationsQuery.isLoading || !isArchiveStateLoaded ? (
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
          data={visibleNotifications}
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
              <Text weight="semibold">
                {selectedFilter === "unread"
                  ? "You're all caught up"
                  : groupedNotifications.length > 0
                    ? "Inbox cleared"
                    : "No updates yet"}
              </Text>
              <Text color={theme.colors.mutedText} style={{ textAlign: "center" }}>
                {selectedFilter === "unread"
                  ? "Unread provider and appointment updates will appear here when something new comes in."
                  : groupedNotifications.length > 0
                    ? "Archived groups and older read updates are tucked out of the default inbox."
                    : "Assignment and delivery progress updates will appear here as your appointments move."}
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
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  filterRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  filterPillActive: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
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
  notificationCardPriority: {
    borderColor: "#d1d5db",
    backgroundColor: "#fcfcfd",
  },
  notificationCardPriorityUnread: {
    borderColor: "#93c5fd",
    backgroundColor: "#f8fbff",
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
  notificationTitle: {
    flex: 1,
  },
  notificationTitlePriority: {
    color: "#111827",
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
  footerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  unreadPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#dbeafe",
  },
  unreadPillPriority: {
    backgroundColor: "#e0f2fe",
  },
  retryButton: {
    marginTop: 6,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#0F4C5C",
  },
});
