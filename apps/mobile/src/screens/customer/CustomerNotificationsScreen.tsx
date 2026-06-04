import React, { useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { AppScreen } from "../../components/ui/AppScreen";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadingState } from "../../components/ui/LoadingState";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";
import { PressableCard } from "../../components/ui/Card";
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
  type GroupedCustomerNotification,
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

  const handlePress = async (item: GroupedCustomerNotification) => {
    const unreadIds = getUnreadNotificationIdsForGroup(item);
    if (unreadIds.length > 0) {
      try {
        await ackGroupMutation.mutateAsync({ notificationIds: unreadIds });
      } catch (error) {
        // Keep navigation behavior even if ack fails; next refresh will retry state.
      }
    }

    openCustomerAppointmentFromNotification(item.latest);
  };

  const handleMarkGroupRead = async (item: GroupedCustomerNotification) => {
    const unreadIds = getUnreadNotificationIdsForGroup(item);
    if (unreadIds.length === 0) {
      return;
    }

    try {
      await ackGroupMutation.mutateAsync({ notificationIds: unreadIds });
    } catch (error) {
      // Keep the inbox stable; refetch paths will recover state on next refresh.
    }
  };

  const handleArchiveGroup = async (item: GroupedCustomerNotification) => {
    await archiveGroup(item);
  };

  const renderItem = ({ item }: { item: GroupedCustomerNotification }) => {
    const copy = getCustomerNotificationCopy(item.latest);
    const priority = getNotificationPriorityPresentation(item.latest);
    const olderVisible = item.older.slice(0, 2);
    const remainingOlderCount = Math.max(0, item.older.length - olderVisible.length);
    const unreadIds = getUnreadNotificationIdsForGroup(item);
    const isHighPriority = priority.tone === "high";

    return (
      <PressableCard
        onPress={() => void handlePress(item)}
        accessibilityLabel={`Open notification: ${copy.title}`}
        variant={item.unread ? "elevated" : "marketplace"}
        style={[
          styles.notificationCard,
          {
            backgroundColor: item.unread ? theme.colors.surfaceTint : theme.colors.card,
            borderColor: item.unread ? `${theme.colors.primary}33` : theme.colors.borderSoft,
          },
        ]}
      >
        <View style={styles.cardTop}>
          <View style={[styles.notificationIcon, { backgroundColor: isHighPriority ? theme.colors.warningSoft : theme.colors.accentSoft }]}>
            <Ionicons
              name={isHighPriority ? "flash-outline" : "notifications-outline"}
              size={18}
              color={isHighPriority ? theme.colors.warning : theme.colors.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.cardTitleRow}>
              <StatusBadge label={priority.label} tone={isHighPriority ? "warning" : "primary"} />
              {!item.isStandalone ? (
                <Text variant="caption" color={theme.colors.textMuted}>
                  {item.older.length > 0 ? `${item.older.length + 1} updates` : "1 update"}
                </Text>
              ) : null}
            </View>
            <Text variant="h3" weight="bold" style={styles.notificationTitle}>
              {copy.title}
            </Text>
            <Text color={theme.colors.textSecondary} style={styles.notificationDetail}>
              {copy.detail}
            </Text>
          </View>
        </View>

        {olderVisible.length > 0 ? (
          <View style={[styles.olderUpdates, { borderTopColor: theme.colors.divider }]}>
            {olderVisible.map((notification) => {
              const olderCopy = getCustomerNotificationCopy(notification);
              return (
                <View key={notification.id} style={styles.olderUpdateRow}>
                  <Text variant="caption" weight="bold" color={theme.colors.textPrimary}>
                    {olderCopy.title}
                  </Text>
                  <Text variant="caption" color={theme.colors.textMuted}>
                    {olderCopy.timestampLabel}
                  </Text>
                </View>
              );
            })}
            {remainingOlderCount > 0 ? (
              <Text variant="caption" color={theme.colors.textMuted}>
                +{remainingOlderCount} older update{remainingOlderCount === 1 ? "" : "s"}
              </Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.notificationFooter}>
          <View style={styles.footerLeft}>
            {item.unread ? <StatusBadge label={unreadIds.length > 1 ? `${unreadIds.length} new` : "New"} tone="primary" /> : <StatusBadge label="Read" tone="neutral" />}
            <Text variant="caption" color={theme.colors.textMuted}>
              {copy.timestampLabel}
            </Text>
          </View>
          <View style={styles.footerRight}>
            {item.unread ? (
              <Pressable
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Mark notification group read"
                onPress={(event) => {
                  event.stopPropagation();
                  void handleMarkGroupRead(item);
                }}
              >
                <Text variant="caption" weight="bold" color={theme.colors.primary}>
                  Mark read
                </Text>
              </Pressable>
            ) : null}
            <Pressable
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Archive notification group"
              onPress={(event) => {
                event.stopPropagation();
                void handleArchiveGroup(item);
              }}
            >
              <Text variant="caption" weight="bold" color={theme.colors.textMuted}>
                Archive
              </Text>
            </Pressable>
          </View>
        </View>
      </PressableCard>
    );
  };

  return (
    <AppScreen>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <SectionHeader
            eyebrow="Customer updates"
            title="Notifications"
            subtitle="Provider assignments, payment updates, and appointment progress."
            style={styles.headerCopy}
          />
          {unreadCount > 0 ? <StatusBadge label={`${unreadCount} unread`} tone="primary" /> : null}
        </View>
        <View style={styles.actionsRow}>
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
                  accessibilityRole="button"
                  accessibilityLabel={`Show ${option.label.toLowerCase()} notifications`}
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.filterPill,
                    {
                      backgroundColor: active ? theme.colors.surfaceTint : theme.colors.surfaceElevated,
                      borderColor: active ? `${theme.colors.primary}33` : theme.colors.borderSoft,
                    },
                  ]}
                >
                  <Text variant="caption" weight="bold" color={active ? theme.colors.primary : theme.colors.textMuted}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {unreadCount > 0 ? (
            <Button
              label={ackAllMutation.isPending ? "Marking..." : "Mark all read"}
              variant="ghost"
              size="compact"
              disabled={ackAllMutation.isPending}
              onPress={() => {
                void ackAllMutation.mutateAsync();
              }}
            />
          ) : null}
        </View>
      </View>

      {notificationsQuery.isLoading || !isArchiveStateLoaded ? (
        <LoadingState label="Loading your latest updates" />
      ) : notificationsQuery.isError ? (
        <View style={styles.state}>
          <EmptyState
            title="Notifications are unavailable"
            message="Refresh to get the latest appointment updates."
            icon="cloud-offline-outline"
          />
          <Button label="Retry" onPress={() => notificationsQuery.refetch()} variant="secondary" style={styles.retryButton} />
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
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title={
                selectedFilter === "unread"
                  ? "You're all caught up"
                  : groupedNotifications.length > 0
                    ? "Inbox cleared"
                    : "No updates yet"
              }
              message={
                selectedFilter === "unread"
                  ? "Unread provider and appointment updates will appear here when something new comes in."
                  : groupedNotifications.length > 0
                    ? "Archived groups and older read updates are tucked out of the default inbox."
                    : "Assignment and delivery progress updates will appear here as your appointments move."
              }
              icon="notifications-outline"
            />
          }
        />
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 16,
    gap: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  headerCopy: {
    flex: 1,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterPill: {
    minHeight: 36,
    borderRadius: 999,
    paddingHorizontal: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 24,
    gap: 12,
  },
  state: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  retryButton: {
    marginTop: 12,
    alignSelf: "stretch",
  },
  notificationCard: {
    gap: 12,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  notificationIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  notificationTitle: {
    marginTop: 10,
  },
  notificationDetail: {
    marginTop: 6,
  },
  olderUpdates: {
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 6,
  },
  olderUpdateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  notificationFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  footerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});
