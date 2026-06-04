import React from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";

import { getMyAppointments } from "../../api/http";
import { AppointmentCard } from "../../components/AppointmentCard";
import { AppScreen } from "../../components/ui/AppScreen";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadingState } from "../../components/ui/LoadingState";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Text } from "../../components/ui/Text";
import {
  getUnreadCustomerNotificationCount,
  useCustomerNotifications,
} from "../../hooks/useCustomerNotifications";
import { useFocusedAutoRefresh } from "../../hooks/useFocusedAutoRefresh";
import type { AppointmentStackParamList } from "../../navigation/types";
import { customerAppointmentsQueryKey } from "../../query/keys";
import { useAuthStore } from "../../state/authStore";
import { useTheme } from "../../theme/theme";
import type { AppointmentSummary } from "../../types/booking";

export default function AppointmentListScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppointmentStackParamList>>();
  const role = useAuthStore((s) => s.role);
  const isCustomer = role === "customer";
  const notificationsQuery = useCustomerNotifications(isCustomer);
  const unreadCount = getUnreadCustomerNotificationCount(notificationsQuery.data);
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: customerAppointmentsQueryKey,
    queryFn: getMyAppointments,
    enabled: isCustomer,
  });
  const appointments = data ?? [];
  const activeAppointments = appointments.filter((appointment) => !["completed", "cancelled"].includes(appointment.status));
  const completedAppointments = appointments.filter((appointment) => ["completed", "cancelled"].includes(appointment.status));
  const sectionedAppointments = [
    ...activeAppointments.map((appointment) => ({ ...appointment, __section: "active" as const })),
    ...completedAppointments.map((appointment) => ({ ...appointment, __section: "past" as const })),
  ];

  useFocusedAutoRefresh({
    enabled: isCustomer,
    onRefresh: () => {
      void refetch();
    },
  });

  const renderItem = ({ item }: { item: AppointmentSummary }) => (
    <AppointmentCard
      appointment={item}
      onPress={(appt) => navigation.navigate("AppointmentDetail", { appointmentId: appt.id, summary: appt })}
    />
  );

  if (!isCustomer) {
    return (
      <AppScreen contentContainerStyle={styles.center}>
        <EmptyState
          title="Appointments unavailable"
          message="Appointments are only available for customers."
          icon="calendar-clear-outline"
          actionLabel="Go home"
          onAction={() => navigation.getParent()?.navigate("HomeTab")}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <Card variant="marketplace" style={styles.header}>
        <SectionHeader
          eyebrow="Customer orders"
          title="Care appointments"
          subtitle="Track pickup, care progress, delivery, payment, and provider updates."
          style={styles.headerCopy}
        />
        <Pressable
          onPress={() => navigation.navigate("CustomerNotifications")}
          style={({ pressed }) => [
            styles.notificationButton,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.borderSoft,
              opacity: pressed ? 0.92 : 1,
            },
            theme.shadows.soft,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Open notifications"
        >
          <Ionicons name="notifications-outline" size={20} color={theme.colors.primary} />
          {unreadCount > 0 ? (
            <View style={[styles.notificationBadge, { backgroundColor: theme.colors.danger }]}>
              <Text variant="caption" weight="bold" color={theme.colors.surfaceElevated}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </Card>

      {isLoading ? (
        <LoadingState label="Loading appointments" />
      ) : isError ? (
        <View style={styles.center}>
          <EmptyState
            title="Failed to load appointments"
            message="Refresh to get the latest booking status."
            icon="cloud-offline-outline"
          />
          <Button label="Retry" onPress={() => refetch()} variant="secondary" style={styles.retryButton} />
        </View>
      ) : (
        <FlatList
          data={sectionedAppointments}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => {
            const isFirstPast = item.__section === "past" && (index === 0 || sectionedAppointments[index - 1]?.__section !== "past");
            const isFirstActive = item.__section === "active" && index === 0;
            return (
              <>
                {isFirstActive ? <SectionLabel title="Active care" count={activeAppointments.length} /> : null}
                {isFirstPast ? <SectionLabel title="Past care" count={completedAppointments.length} /> : null}
                {renderItem({ item })}
              </>
            );
          }}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.colors.primary} />}
          ListEmptyComponent={
            <EmptyState
              title="No appointments yet"
              message="Book a service to start tracking pickup, care progress, and delivery here."
              icon="calendar-outline"
            />
          }
        />
      )}
    </AppScreen>
  );
}

function SectionLabel({ title, count }: { title: string; count: number }) {
  const theme = useTheme();
  return (
    <View style={styles.sectionLabel}>
      <Text variant="overline" weight="bold" color={theme.colors.accentPressed}>
        {title}
      </Text>
      <Text variant="caption" color={theme.colors.textMuted}>
        {count} {count === 1 ? "appointment" : "appointments"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    margin: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  headerCopy: {
    flex: 1,
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notificationBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    position: "absolute",
    top: -1,
    right: -1,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 24,
  },
  sectionLabel: {
    marginBottom: 10,
    gap: 2,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  retryButton: {
    marginTop: 12,
    alignSelf: "stretch",
  },
});
