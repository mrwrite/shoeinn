import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Image, Linking, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  API_URL,
  cancelAppointmentPayment,
  getAppointment,
  getAppointmentAssignment,
  getAppointmentEvents,
  refreshAppointmentPayment,
} from "../../api/http";
import { AppointmentTimeline, type AppointmentTimelineItem } from "../../components/AppointmentTimeline";
import { CustomerTravelMapCard } from "../../components/CustomerTravelMapCard";
import { AppScreen } from "../../components/ui/AppScreen";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadingState } from "../../components/ui/LoadingState";
import { MediaPlaceholder } from "../../components/ui/MediaPlaceholder";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { AppointmentStatusBadge, StatusBadge } from "../../components/ui/StatusBadge";
import { Text } from "../../components/ui/Text";
import { useFocusedAutoRefresh } from "../../hooks/useFocusedAutoRefresh";
import {
  getCustomerNotificationCopy,
  getLatestNotificationForAppointment,
  useCustomerNotifications,
} from "../../hooks/useCustomerNotifications";
import {
  customerAppointmentNextStepCopy,
  customerAppointmentStatusLabels,
} from "../../features/appointmentCopy";
import type { AppointmentStackParamList } from "../../navigation/types";
import {
  appointmentAssignmentQueryKey,
  appointmentEventsQueryKey,
  appointmentQueryKey,
  customerAppointmentsQueryKey,
} from "../../query/keys";
import { useTheme } from "../../theme/theme";
import type { AppointmentEvent, AppointmentSummary } from "../../types/booking";

const travelStatuses = new Set(["en_route_pickup", "out_for_delivery"]);
const photoVisibleStatuses = new Set(["ready", "out_for_delivery", "delivered", "completed"]);

const statusOrder = [
  "requested",
  "pending_payment",
  "payment_failed",
  "confirmed",
  "en_route_pickup",
  "picked_up",
  "cleaning",
  "ready",
  "out_for_delivery",
  "delivered",
  "completed",
  "cancelled",
];

type Props = NativeStackScreenProps<AppointmentStackParamList, "AppointmentDetail">;

type CustomerAssignmentState =
  | { kind: "assigned"; title: string; detail?: string }
  | { kind: "unassigned"; title: string; detail?: string }
  | { kind: "assignment_unavailable"; title: string; detail?: string };

const formatDateTime = (value?: string | null) => (value ? new Date(value).toLocaleString() : "-");

function formatMoney(amount: number | null | undefined, currency: string | null | undefined): string {
  if (amount == null || !currency) {
    return "--";
  }
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

const buildTimelineItems = (events: AppointmentEvent[], currentStatus?: string): AppointmentTimelineItem[] => {
  const reached = new Set<string>();
  events.forEach((event) => {
    if (event.kind === "status_change" && event.payload?.status) {
      reached.add(event.payload.status as string);
    }
  });
  if (currentStatus) {
    reached.add(currentStatus);
  }

  const currentIndex = currentStatus ? statusOrder.indexOf(currentStatus) : -1;
  const isTerminal = currentStatus === "completed" || currentStatus === "cancelled";

  return statusOrder
    .filter((status) => {
      if (currentStatus === "cancelled") {
        return reached.has(status) || status === "cancelled";
      }
      return status !== "cancelled";
    })
    .map((status, index) => {
      let state: AppointmentTimelineItem["state"] = "upcoming";
      if (status === currentStatus && (status === "completed" || status === "cancelled")) {
        state = "terminal";
      } else if (status === currentStatus) {
        state = "current";
      } else if (reached.has(status) && currentIndex >= 0 && index < currentIndex) {
        state = "completed";
      } else if (isTerminal && reached.has(status) && status !== currentStatus) {
        state = "completed";
      }

      return {
        key: status,
        title: customerAppointmentStatusLabels[status] ?? status,
        detail:
          state === "current"
            ? "Happening now"
            : state === "completed"
              ? "Finished"
              : state === "terminal"
                ? "Final outcome"
                : "Coming up next",
        state,
      };
    });
};

const resolvePhotoUrl = (url?: string | null) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `${API_URL.replace(/\/$/, "")}${url.startsWith("/") ? "" : "/"}${url}`;
};

export default function AppointmentDetailScreen({ route }: Props) {
  const theme = useTheme();
  const { appointmentId, summary, refreshPaymentOnOpen, paymentReturnStatus } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<AppointmentStackParamList>>();
  const queryClient = useQueryClient();
  const [expandedPhotoUrl, setExpandedPhotoUrl] = useState<string | null>(null);
  const handledAutoRefreshRef = useRef(false);

  const appointmentQuery = useQuery({
    queryKey: appointmentQueryKey(appointmentId),
    queryFn: () => getAppointment(appointmentId),
  });

  const eventsQuery = useQuery({
    queryKey: appointmentEventsQueryKey(appointmentId),
    queryFn: () => getAppointmentEvents(appointmentId),
    enabled: !!appointmentId,
  });

  const assignmentQuery = useQuery({
    queryKey: appointmentAssignmentQueryKey(appointmentId),
    queryFn: () => getAppointmentAssignment(appointmentId),
    retry: false,
  });
  const notificationsQuery = useCustomerNotifications(true);

  const appointment = appointmentQuery.data ?? (summary as AppointmentSummary | undefined);
  const paymentAwareAppointment = appointmentQuery.data;
  const status = appointment?.status;
  const shouldShowTravelMap = status ? travelStatuses.has(status) : false;
  const timelineItems = useMemo(
    () => buildTimelineItems(eventsQuery.data ?? [], appointment?.status),
    [eventsQuery.data, appointment?.status],
  );

  const finishedPhotoUrl = resolvePhotoUrl(appointmentQuery.data?.ready_photo_url);
  const shouldShowFinishedPhotoSection = appointment ? photoVisibleStatuses.has(appointment.status) : false;
  const assignmentErrorText = assignmentQuery.error ? `${assignmentQuery.error}`.toLowerCase() : "";
  const assignmentState: CustomerAssignmentState = assignmentQuery.data
    ? {
        kind: "assigned",
        title: assignmentQuery.data.provider_name ?? "Provider assigned",
        detail: `Assigned at ${formatDateTime(assignmentQuery.data.assigned_at)}`,
      }
    : assignmentQuery.isError
      ? assignmentErrorText.includes("404")
        ? {
            kind: "unassigned",
            title: "No provider assigned yet",
            detail: "We're still matching your appointment with a provider.",
          }
        : {
            kind: "assignment_unavailable",
            title: "Provider status temporarily unavailable",
            detail: "Your appointment is still active, but we could not load provider assignment right now.",
          }
      : {
          kind: "unassigned",
          title: "Checking provider assignment",
          detail: "We're loading the latest assignment details.",
        };
  const recentNotification = getLatestNotificationForAppointment(notificationsQuery.data, appointmentId);
  const recentNotificationCopy = recentNotification ? getCustomerNotificationCopy(recentNotification) : null;
  const isAppointmentLoading = appointmentQuery.isLoading && !appointment;
  const isLiveAppointment = !!appointment && !["completed", "cancelled", "payment_failed"].includes(appointment.status);

  const handleOpenCheckout = async () => {
    const checkoutUrl = appointmentQuery.data?.payment_checkout_url;
    if (!checkoutUrl) {
      Alert.alert("Checkout unavailable", "This booking does not currently have a checkout URL.");
      return;
    }
    try {
      await Linking.openURL(checkoutUrl);
    } catch {
      Alert.alert("Checkout unavailable", "Unable to open checkout right now.");
    }
  };

  const handleRefreshPayment = async (reason: "manual" | "return" = "manual") => {
    try {
      const latest = await refreshAppointmentPayment(appointmentId);
      queryClient.setQueryData(appointmentQueryKey(appointmentId), latest);
      await queryClient.invalidateQueries({ queryKey: customerAppointmentsQueryKey });
      await appointmentQuery.refetch();
      await eventsQuery.refetch();

      if (reason !== "return") {
        return;
      }

      if (latest.payment_status === "succeeded") {
        Alert.alert("Payment confirmed", latest.payment_message ?? "Your payment completed successfully.");
        return;
      }
      if (latest.payment_status === "failed" || latest.status === "payment_failed" || latest.status === "cancelled") {
        Alert.alert("Payment incomplete", latest.payment_message ?? "This booking still needs payment attention.");
        return;
      }

      if (paymentReturnStatus === "cancel") {
        Alert.alert("Checkout canceled", latest.payment_message ?? "No payment was completed for this booking.");
        return;
      }

      Alert.alert(
        "Payment submitted",
        latest.payment_message ?? "We returned to ShoeInn, but Stripe has not marked this payment complete yet. You can refresh again if needed.",
      );
    } catch (error: any) {
      Alert.alert("Unable to refresh payment", error?.message ?? "Please try again.");
    }
  };

  const handleCancelPendingPayment = async () => {
    try {
      const latest = await cancelAppointmentPayment(appointmentId);
      queryClient.setQueryData(appointmentQueryKey(appointmentId), latest);
      await queryClient.invalidateQueries({ queryKey: customerAppointmentsQueryKey });
      await appointmentQuery.refetch();
      await eventsQuery.refetch();
    } catch (error: any) {
      Alert.alert("Unable to cancel booking", error?.message ?? "Please try again.");
    }
  };

  useFocusedAutoRefresh({
    enabled: !!appointmentId,
    intervalMs: isLiveAppointment ? 12000 : null,
    onRefresh: () => {
      void appointmentQuery.refetch();
      void assignmentQuery.refetch();
      void eventsQuery.refetch();
    },
  });

  useEffect(() => {
    if (!refreshPaymentOnOpen || handledAutoRefreshRef.current) {
      return;
    }
    handledAutoRefreshRef.current = true;
    void handleRefreshPayment("return");
  }, [refreshPaymentOnOpen]);

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.container}>
        {!appointment ? (
          isAppointmentLoading ? (
            <LoadingState label="Loading your appointment" />
          ) : (
            <EmptyState
              title="Appointment not found"
              message="We couldn't find this appointment in the active customer flow."
              icon="calendar-clear-outline"
            />
          )
        ) : (
          <>
            <Card variant="marketplace" style={styles.heroCard}>
              <MediaPlaceholder
                compact
                categorySlug={appointment.category_slug}
                label={appointment.service_name ?? "Care appointment"}
                caption={appointment.category_name ?? "Premium care"}
                style={styles.heroMedia}
              />
              <View style={styles.heroBody}>
                <View style={styles.heroTop}>
                  <View style={{ flex: 1 }}>
                    <Text variant="caption" weight="bold" color={theme.colors.textMuted}>
                      Care appointment
                    </Text>
                    <Text variant="h1" weight="bold" style={styles.heroTitle}>
                      {appointment.service_name ?? "Appointment"}
                    </Text>
                  </View>
                  <AppointmentStatusBadge status={appointment.status} />
                </View>
                <View style={styles.badgeRow}>
                  {appointment.category_name ? <StatusBadge label={appointment.category_name} tone="primary" /> : null}
                  {paymentAwareAppointment?.payment_status ? <StatusBadge label={`Payment ${paymentAwareAppointment.payment_status}`} tone={paymentAwareAppointment.payment_status === "succeeded" ? "success" : "warning"} /> : null}
                </View>
                <Text color={theme.colors.textSecondary}>{formatDateTime(appointment.start_time)}</Text>
                <View style={[styles.nextStep, { backgroundColor: theme.colors.surfaceMuted }]}>
                  <Text weight="bold">Current step</Text>
                  <Text color={theme.colors.textSecondary} style={styles.nextStepCopy}>
                    {customerAppointmentNextStepCopy[appointment.status] ?? "We'll keep this status updated as your appointment moves forward."}
                  </Text>
                </View>
              </View>
            </Card>

            <Card variant="marketplace">
              <SectionHeader title="Provider" subtitle={assignmentState.detail} />
              <View style={styles.providerRow}>
                <View style={[styles.providerIcon, { backgroundColor: theme.colors.accentSoft }]}>
                  <Ionicons name="person-circle-outline" size={24} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text weight="bold">{assignmentState.title}</Text>
                  <Text variant="caption" color={theme.colors.textMuted} style={styles.nextStepCopy}>
                    {assignmentState.kind === "assigned" ? "Your provider will continue updating this appointment." : "Assignment updates will appear here."}
                  </Text>
                </View>
              </View>
            </Card>

            {paymentAwareAppointment?.payment_mode === "service" ? (
              <Card variant="marketplace">
                <SectionHeader title="Payment" />
                <View style={styles.paymentSummary}>
                  <SummaryRow label="Status" value={paymentAwareAppointment.payment_status ?? "pending"} />
                  <SummaryRow
                    label="Amount"
                    value={formatMoney(
                      paymentAwareAppointment.payment_amount_received ?? paymentAwareAppointment.payment_amount_expected,
                      paymentAwareAppointment.payment_currency,
                    )}
                  />
                </View>
                {appointment.status === "pending_payment" || appointment.status === "payment_failed" ? (
                  <View style={styles.paymentActions}>
                    <Text color={theme.colors.textSecondary}>
                      {paymentAwareAppointment.payment_message ?? "Complete payment before this booking can move forward."}
                    </Text>
                    {paymentAwareAppointment.payment_checkout_url ? (
                      <Button label="Open secure checkout" variant="gold" onPress={() => void handleOpenCheckout()} />
                    ) : null}
                    <Button label="Check payment status" variant="secondary" onPress={() => void handleRefreshPayment("manual")} />
                    {appointment.status === "pending_payment" ? (
                      <Button label="Cancel unpaid booking" variant="ghost" onPress={() => void handleCancelPendingPayment()} />
                    ) : null}
                  </View>
                ) : null}
              </Card>
            ) : null}

            {recentNotificationCopy ? (
              <Pressable
                onPress={() => navigation.navigate("CustomerNotifications")}
                accessibilityRole="button"
                accessibilityLabel="Open recent appointment update in notifications"
              >
                <Card
                  variant="marketplace"
                  style={recentNotificationCopy.unread ? [styles.unreadUpdateCard, { borderColor: `${theme.colors.primary}33` }] : undefined}
                >
                  <View style={styles.updateHeader}>
                    <SectionHeader title="Recent update" subtitle={recentNotificationCopy.timestampLabel} />
                    {recentNotificationCopy.unread ? <StatusBadge label="New" tone="primary" /> : null}
                  </View>
                  <Text weight="bold">{recentNotificationCopy.title}</Text>
                  <Text color={theme.colors.textSecondary}>{recentNotificationCopy.detail}</Text>
                </Card>
              </Pressable>
            ) : null}

            {shouldShowTravelMap ? (
              <CustomerTravelMapCard
                appointment={{
                  id: appointment.id,
                  status: appointment.status,
                  address_line1: appointment.address_line1,
                  address_line2: appointment.address_line2,
                  city: appointment.city,
                  state: appointment.state,
                  postal_code: appointment.postal_code,
                }}
              />
            ) : null}

            <Card variant="marketplace">
              <SectionHeader title="Progress timeline" subtitle="Follow what has happened, what is active now, and what comes next." />
              {eventsQuery.isLoading ? (
                <LoadingState label="Loading progress history" />
              ) : eventsQuery.isError ? (
                <EmptyState
                  title="Progress history unavailable"
                  message="Your current status summary above is still up to date."
                  icon="time-outline"
                />
              ) : (
                <AppointmentTimeline items={timelineItems} style={styles.timeline} />
              )}
            </Card>

            {shouldShowFinishedPhotoSection ? (
              <Card variant="marketplace">
                <SectionHeader title="Completion photo" />
                {finishedPhotoUrl ? (
                  <Pressable
                    onPress={() => setExpandedPhotoUrl(finishedPhotoUrl)}
                    accessibilityRole="button"
                    accessibilityLabel="Expand completion appointment photo"
                  >
                    <Image source={{ uri: finishedPhotoUrl }} style={styles.finishedPhoto} />
                    <Text variant="caption" color={theme.colors.textMuted}>
                      Tap to expand
                    </Text>
                  </Pressable>
                ) : (
                  <Text color={theme.colors.textSecondary}>A completion photo is expected here once it is available.</Text>
                )}
              </Card>
            ) : null}

            <Card variant="marketplace">
              <SectionHeader title="Pickup and drop-off" subtitle="The address and contact details attached to this appointment." />
              <View style={styles.detailRows}>
                <SummaryRow label="Customer" value={appointment.customer_name} />
                <SummaryRow label="Contact" value={appointment.customer_phone} />
                {appointment.address_line1 ? (
                  <>
                    <SummaryRow
                      label="Address"
                      value={[appointment.address_line1, appointment.address_line2].filter(Boolean).join(", ")}
                    />
                    <SummaryRow
                      label="Area"
                      value={[appointment.city, appointment.state, appointment.postal_code].filter(Boolean).join(" ")}
                    />
                  </>
                ) : null}
              </View>
            </Card>
          </>
        )}
      </ScrollView>

      <Modal visible={!!expandedPhotoUrl} transparent animationType="fade">
        <Pressable
          style={styles.photoModalBackdrop}
          onPress={() => setExpandedPhotoUrl(null)}
          accessibilityRole="button"
          accessibilityLabel="Close expanded photo"
        >
          {expandedPhotoUrl ? <Image source={{ uri: expandedPhotoUrl }} style={styles.photoModalImage} /> : null}
        </Pressable>
      </Modal>
    </AppScreen>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.summaryRow}>
      <Text color={theme.colors.textMuted}>{label}</Text>
      <Text weight="bold" style={styles.summaryValue}>
        {value || "-"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  heroCard: {
    padding: 0,
    overflow: "hidden",
  },
  heroMedia: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  heroBody: {
    padding: 16,
    gap: 12,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  heroTitle: {
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  nextStep: {
    borderRadius: 20,
    padding: 12,
  },
  nextStepCopy: {
    marginTop: 4,
  },
  providerRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  providerIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentSummary: {
    marginTop: 12,
    gap: 10,
  },
  paymentActions: {
    marginTop: 14,
    gap: 10,
  },
  updateHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  unreadUpdateCard: {
  },
  timeline: {
    marginTop: 12,
  },
  finishedPhoto: {
    width: "100%",
    height: 220,
    borderRadius: 18,
    marginTop: 12,
    marginBottom: 8,
  },
  detailRows: {
    marginTop: 12,
    gap: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  summaryValue: {
    flex: 1,
    textAlign: "right",
  },
  photoModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  photoModalImage: {
    width: "100%",
    height: "85%",
    resizeMode: "contain",
  },
});
